import abc
import logging
from dataclasses import dataclass
from typing import Any

from pydantic import BaseModel

from grants_shared.adapters.oauth.login_gov.login_gov_oauth_client import LoginGovOauthClient
from grants_shared.adapters.oauth.oauth_client_models import OauthTokenRequest
from grants_shared.api.route_utils import raise_flask_error
from grants_shared.auth.api_jwt_auth import JwtAuth
from grants_shared.auth.auth_errors import JwtValidationError
from grants_shared.auth.auth_handler import AbstractAuthHandler
from grants_shared.auth.login_gov_jwt_auth import (
    LoginGovUser,
    get_login_gov_client_assertion,
    validate_token,
)
from grants_shared.db.models.auth_base_models import (
    BaseLinkExternalUser,
    BaseLoginGovState,
    BaseUser,
    BaseUserTokenSession,
)
from grants_shared.util.string_utils import is_valid_uuid

logger = logging.getLogger(__name__)


class CallbackParams(BaseModel):
    code: str | None = None
    state: str | None = None
    error: str | None = None
    error_description: str | None = None


@dataclass
class LoginGovDataContainer:
    """Holds various login gov related fields we want to pass around"""

    code: str | None
    nonce: str


@dataclass
class LoginGovCallbackResponse:
    token: str
    is_user_new: bool


def get_login_gov_client() -> LoginGovOauthClient:
    """Get the login.gov client, in a method to be overridable in tests"""
    return LoginGovOauthClient()


class AbstractLoginGovCallbackHandler[
    USER: BaseUser,
    LINK_EXTERNAL: BaseLinkExternalUser,
    LOGIN_GOV_STATE: BaseLoginGovState,
    USER_TOKEN_SESSION: BaseUserTokenSession,
](abc.ABC, metaclass=abc.ABCMeta):
    """Generic login.gov callback flow, reusable across systems.

    Everything that touches the DB goes through the injected :class:`AbstractAuthHandler`,
    and any system-specific behavior after the user is resolved is supplied by the abstract
    :meth:`handle_post_login` hook. Concrete handlers bind the type parameters to their real
    tables, so the flow never needs to cast the user/link types.
    """

    def __init__(
        self,
        auth_handler: AbstractAuthHandler[
            USER, LINK_EXTERNAL, LOGIN_GOV_STATE, Any, USER_TOKEN_SESSION
        ],
        jwt_auth: JwtAuth[USER, USER_TOKEN_SESSION],
    ):
        self.auth_handler = auth_handler
        self.jwt_auth = jwt_auth
        self.db_session = auth_handler.db_session

    def handle_callback_request(self, query_data: dict) -> LoginGovDataContainer:
        """Handle the callback from login.gov after calling the authenticate endpoint

        NOTE: Any errors thrown here will actually lead to a redirect due to the
              with_login_redirect_error_handler handler we have attached to the route
        """
        # Process the data coming back from login.gov via the redirect query params
        # see: https://developers.login.gov/oidc/authorization/#authorization-response
        callback_params = CallbackParams.model_validate(query_data)

        # If we got an error back in the callback, raise an exception
        # The only two documented error values are access_denied and invalid_request
        if callback_params.error is not None:
            # access_denied means "The user has either cancelled or declined to authorize the client"
            # so raise a 401 and redirect them back to the frontend
            if callback_params.error == "access_denied":
                raise_flask_error(401, "User declined to login")

            # Otherwise it's an invalid request which indicates a problem with our configuration
            error_message = f"{callback_params.error} {callback_params.error_description}"
            raise_flask_error(500, error_message)

        # This should only ever happen if someone directly calls the API
        # We can't validate the request like normal due to the redirect nature
        # of these endpoints.
        if callback_params.code is None:
            raise_flask_error(422, "Missing code in request")
        if callback_params.state is None:
            raise_flask_error(422, "Missing state in request")

        # If the state value we received isn't a valid UUID
        # then it's likely someone randomly calling the endpoint
        # We don't want this validation on the schema as it would
        # occur before our error catching that handles redirects
        if not is_valid_uuid(callback_params.state):
            raise_flask_error(422, "Invalid OAuth state value")

        login_gov_state = self.auth_handler.get_login_gov_state(callback_params.state)

        # If we don't have the state value in our DB, that either means:
        # * login.gov is very broken and sending us bad data
        # * Someone called this endpoint directly with a random value
        #
        # There isn't a way to truly separate those here, so we'll assume the more likely second one
        # and raise a 404 to say we have no idea what they passed us.
        if login_gov_state is None:
            raise_flask_error(404, "OAuth state not found")

        # We do not want the login_gov_state to be reusable - so delete it
        # even if we later error to avoid any replay attacks.
        self.db_session.delete(login_gov_state)

        return LoginGovDataContainer(code=callback_params.code, nonce=str(login_gov_state.nonce))

    def handle_token(self, login_gov_data: LoginGovDataContainer) -> LoginGovCallbackResponse:
        """Fetch user info from login gov, and handle user creation

        NOTE: Any errors thrown here will actually lead to a redirect due to the
              with_login_redirect_error_handler handler we have attached to the route
        """

        # call the token endpoint (make a client)
        # https://developers.login.gov/oidc/token/
        client = get_login_gov_client()
        limit = 3
        tries = 0
        while tries < limit:
            tries += 1
            response = client.get_token(
                OauthTokenRequest(
                    code=login_gov_data.code, client_assertion=get_login_gov_client_assertion()
                )
            )

            # If this request failed, we'll check our retry policy and either retry or return the 500 if we're out of retries
            if response.is_error_response():
                if tries == limit:
                    raise_flask_error(500, response.error_description)
                else:
                    logger.info(
                        "Retrying call to Login.gov after receiving error",
                        extra={"tries": tries, "limit": limit},
                    )
                    continue
            # if it's not an error we should break out of the loop since it was a successful call
            break
        # Process the token response from login.gov
        # which will create/update a user in the DB
        return self._process_token(response.id_token, login_gov_data.nonce)

    def _process_token(self, token: str, nonce: str) -> LoginGovCallbackResponse:
        """Process the token from login.gov and generate our own token for auth"""
        try:
            login_gov_user = validate_token(token, nonce)
        except JwtValidationError as e:
            logger.info("Login.gov token validation failed", extra={"auth.issue": e.message})
            raise_flask_error(401, e.message)

        external_user = self.auth_handler.get_link_external_user(login_gov_user.user_id)

        is_user_new = external_user is None

        # If we didn't find anything, we want to create the user
        if external_user is None:
            external_user = self.auth_handler.create_user_with_external_link(login_gov_user.user_id)

        # Update fields on the external user table
        # Store the email as lowercase, this should be how it's returned already
        # but just to make email comparisons easier elsewhere we doubly make sure.
        external_user.email = login_gov_user.email.lower()

        # Flush the records to the DB so any auto-generated IDs and similar are populated
        # prior to us trying to work with the user further.
        # NOTE: This doesn't commit yet - but effectively moves the cache from memory to the DB transaction
        self.db_session.flush()

        user = self.auth_handler.get_user_for_external_link(external_user)

        # Apply any system-specific handling now that the user is resolved
        self.handle_post_login(user, is_user_new, login_gov_user)

        token, user_token_session = self.jwt_auth.create_jwt_for_user(
            user, email=external_user.email
        )

        logger.info("Generated token for user", extra=user_token_session.get_log_extra())

        return LoginGovCallbackResponse(token=token, is_user_new=is_user_new)

    @abc.abstractmethod
    def handle_post_login(
        self, user: USER, is_user_new: bool, login_gov_user: LoginGovUser
    ) -> None:
        """Apply system-specific handling after the login.gov user is resolved.

        Each system supplies its own behavior here (e.g. organization linking, PIV checks),
        since these depend on tables that only exist in that system.
        """
