import logging
from dataclasses import dataclass

from pydantic import BaseModel
from sqlalchemy import select

import src.adapters.db as db
from src.adapters.oauth.login_gov.login_gov_oauth_client import LoginGovOauthClient
from src.adapters.oauth.oauth_client_models import OauthTokenRequest
from src.api.route_utils import raise_flask_error
from src.db.models.user_models import LoginGovState
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

    # TODO: Process the token response from login.gov
    # Note that a lot of this is already in https://github.com/HHS/simpler-grants-gov/pull/3004

    # TODO - connect this to the above logic once implemented
    return LoginGovCallbackResponse(token="abc123xyz456", is_user_new=False)
