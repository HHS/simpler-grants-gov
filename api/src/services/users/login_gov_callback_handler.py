import logging
from dataclasses import dataclass

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.adapters.oauth.login_gov.login_gov_oauth_client import LoginGovOauthClient
from src.adapters.oauth.oauth_client_models import OauthTokenRequest
from src.api.route_utils import raise_flask_error
from src.auth.api_jwt_auth import create_jwt_for_user
from src.auth.auth_errors import JwtValidationError
from src.auth.login_gov_jwt_auth import validate_token
from src.constants.lookup_constants import ExternalUserType
from src.db.models.user_models import LinkExternalUser, LoginGovState, User
from src.util.string_utils import is_valid_uuid

logger = logging.getLogger(__name__)


class CallbackParams(BaseModel):
    code: str
    state: str
    error: str | None = None
    error_description: str | None = None


@dataclass
class LoginGovCallbackResponse:
    token: str
    is_user_new: bool


def get_login_gov_client() -> LoginGovOauthClient:
    """Get the login.gov client, in a method to be overridable in tests"""
    return LoginGovOauthClient()


def handle_login_gov_callback(query_data: dict, db_session: db.Session) -> LoginGovCallbackResponse:
    """Handle the callback from login.gov after calling the authenticate endpoint

    NOTE: Any errors thrown here will actually lead to a redirect due to the
          with_login_redirect_error_handler handler we have attached to the route
    """

    # Process the data coming back from login.gov via the redirect query params
    # see: https://developers.login.gov/oidc/authorization/#authorization-response
    callback_params = CallbackParams.model_validate(query_data)

    # If we got an error back in the callback, raise an exception
    # The only two documented error values are access_denied and invalid_request
    # which would both indicate an issue in our configuration and we'll treat as a 5xx internal error
    if callback_params.error is not None:
        error_message = f"{callback_params.error} {callback_params.error_description}"
        raise_flask_error(500, error_message)

    # If the state value we received isn't a valid UUID
    # then it's likely someone randomly calling the endpoint
    # We don't want this validation on the schema as it would
    # occur before our error catching that handles redirects
    if not is_valid_uuid(callback_params.state):
        raise_flask_error(422, "Invalid OAuth state value")

    login_gov_state = db_session.execute(
        select(LoginGovState).where(LoginGovState.login_gov_state_id == callback_params.state)
    ).scalar_one_or_none()

    # If we don't have the state value in our DB, that either means:
    # * login.gov is very broken and sending us bad data
    # * Someone called this endpoint directly with a random value
    #
    # There isn't a way to truly separate those here, so we'll assume the more likely second one
    # and raise a 404 to say we have no idea what they passed us.
    if login_gov_state is None:
        raise_flask_error(404, "OAuth state not found")

    # call the token endpoint (make a client)
    # https://developers.login.gov/oidc/token/
    # TODO: Creating a JWT with the key we gave login.gov
    client = get_login_gov_client()
    response = client.get_token(OauthTokenRequest(code=callback_params.code))

    # If this request failed, we'll assume we're the issue and 500
    # TODO - need to test with actual login.gov if there could be other scenarios
    #        the mock always returns something as long as the request is well-formatted
    if response.is_error_response():
        raise_flask_error(500, response.error_description)

    # Process the token response from login.gov
    return _process_token(db_session, response.id_token)


def _process_token(db_session: db.Session, token: str) -> LoginGovCallbackResponse:
    """Process the token from login.gov and generate our own token for auth"""
    try:
        login_gov_user = validate_token(token)
    except JwtValidationError as e:
        logger.info("Login.gov token validation failed", extra={"auth.issue": e.message})
        raise_flask_error(401, e.message)

    external_user: LinkExternalUser | None = db_session.execute(
        select(LinkExternalUser)
        .where(LinkExternalUser.external_user_id == login_gov_user.user_id)
        # We only support login.gov right now, so this does nothing, but let's
        # be explicit just in case.
        .where(LinkExternalUser.external_user_type == ExternalUserType.LOGIN_GOV)
        .options(selectinload("*"))
    ).scalar()

    is_user_new = external_user is None

    # If we didn't find anything, we want to create the user
    if external_user is None:
        external_user = _create_login_gov_user(login_gov_user.user_id, db_session)

    # Update fields on the external user table
    external_user.email = login_gov_user.email

    # Flush the records to the DB so any auto-generated IDs and similar are populated
    # prior to us trying to work with the user further.
    # NOTE: This doesn't commit yet - but effectively moves the cache from memory to the DB transaction
    db_session.flush()

    token, user_token_session = create_jwt_for_user(external_user.user, db_session)

    logger.info(
        "Generated token for user",
        extra={
            "user_token_session.token_id": str(user_token_session.token_id),
            "user_token_session.user_id": str(user_token_session.user_id),
        },
    )

    return LoginGovCallbackResponse(token=token, is_user_new=is_user_new)


def _create_login_gov_user(external_user_id: str, db_session: db.Session) -> LinkExternalUser:
    user = User()
    db_session.add(user)

    external_user = LinkExternalUser(
        user=user,
        external_user_type=ExternalUserType.LOGIN_GOV,
        external_user_id=external_user_id,
        # note we set other params in the calling method to also handle updates
    )
    db_session.add(external_user)

    return external_user
