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
from src.auth.login_gov_jwt_auth import get_config, get_login_gov_client_assertion, validate_token
from src.constants.lookup_constants import ExternalUserType
from src.db.models.user_models import LinkExternalUser, LoginGovState, User
from src.services.users.organization_from_ebiz_poc import handle_ebiz_poc_organization_during_login
from src.util.string_utils import is_valid_uuid

logger = logging.getLogger(__name__)


class CallbackParams(BaseModel):
    code: str | None = None
    state: str
    error: str | None = None
    error_description: str | None = None


@dataclass
class LoginGovDataContainer:
    """Holds various login gov related fields we want to pass around"""

    code: str
    nonce: str


@dataclass
class LoginGovCallbackResponse:
    token: str
    is_user_new: bool


def get_login_gov_client() -> LoginGovOauthClient:
    """Get the login.gov client, in a method to be overridable in tests"""
    return LoginGovOauthClient()


def handle_login_gov_callback_request(
    query_data: dict, db_session: db.Session
) -> LoginGovDataContainer:
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

    # This shouldn't be possible, if there is no error, this should always be set
    if callback_params.code is None:
        raise_flask_error(500, "Missing code in request")

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

    # We do not want the login_gov_state to be reusable - so delete it
    # even if we later error to avoid any replay attacks.
    db_session.delete(login_gov_state)

    return LoginGovDataContainer(code=callback_params.code, nonce=str(login_gov_state.nonce))


def _validate_piv_requirement(user: User, x509_presented: bool | None) -> None:
    """Validate that agency users authenticate with PIV/CAC when required.

    Args:
        user: The user attempting to log in
        x509_presented: Whether the user authenticated with a certificate (PIV/CAC)

    Raises:
        HTTPError: If an agency user attempts to login without PIV when required
    """
    config = get_config()

    # Skip validation if PIV is not required (lower environments)
    if not config.is_piv_required:
        return

    # Check if user is an agency user
    is_agency_user = len(user.agency_users) > 0

    # If user is an agency user and didn't use PIV, reject login
    if is_agency_user and not x509_presented:
        logger.info(
            "Agency user attempted login without PIV",
            extra={
                "user_id": str(user.user_id),
                "x509_presented": x509_presented,
            },
        )
        raise_flask_error(422, "Agency users must authenticate using a PIV/CAC card")


def handle_login_gov_token(
    db_session: db.Session, login_gov_data: LoginGovDataContainer
) -> LoginGovCallbackResponse:
    """Fetch user info from login gov, and handle user creation

    NOTE: Any errors thrown here will actually lead to a redirect due to the
          with_login_redirect_error_handler handler we have attached to the route
    """

    # call the token endpoint (make a client)
    # https://developers.login.gov/oidc/token/
    client = get_login_gov_client()
    response = client.get_token(
        OauthTokenRequest(
            code=login_gov_data.code, client_assertion=get_login_gov_client_assertion()
        )
    )

    # If this request failed, we'll assume we're the issue and 500
    if response.is_error_response():
        raise_flask_error(500, response.error_description)

    # Process the token response from login.gov
    # which will create/update a user in the DB
    return _process_token(db_session, response.id_token, login_gov_data.nonce)


def _process_token(db_session: db.Session, token: str, nonce: str) -> LoginGovCallbackResponse:
    """Process the token from login.gov and generate our own token for auth"""
    try:
        login_gov_user = validate_token(token, nonce)
    except JwtValidationError as e:
        logger.info("Login.gov token validation failed", extra={"auth.issue": e.message})
        raise_flask_error(401, e.message)

    external_user: LinkExternalUser | None = db_session.execute(
        select(LinkExternalUser)
        .where(LinkExternalUser.external_user_id == login_gov_user.user_id)
        # We only support login.gov right now, so this does nothing, but let's
        # be explicit just in case.
        .where(LinkExternalUser.external_user_type == ExternalUserType.LOGIN_GOV)
        .options(selectinload(LinkExternalUser.user).selectinload(User.agency_users))
    ).scalar()

    is_user_new = external_user is None

    # If we didn't find anything, we want to create the user
    if external_user is None:
        external_user = _create_login_gov_user(login_gov_user.user_id, db_session)

    # Update fields on the external user table
    # Store the email as lowercase, this should be how it's returned already
    # but just to make email comparisons easier elsewhere we doubly make sure.
    external_user.email = login_gov_user.email.lower()

    # Flush the records to the DB so any auto-generated IDs and similar are populated
    # prior to us trying to work with the user further.
    # NOTE: This doesn't commit yet - but effectively moves the cache from memory to the DB transaction
    db_session.flush()

    # Check if the user is an ebiz POC and create/link their organization
    # Only do this for new users
    if is_user_new:
        handle_ebiz_poc_organization_during_login(db_session, external_user.user)

    # Validate PIV requirement for agency users
    _validate_piv_requirement(external_user.user, login_gov_user.x509_presented)

    token, user_token_session = create_jwt_for_user(
        external_user.user, db_session, email=external_user.email
    )

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
