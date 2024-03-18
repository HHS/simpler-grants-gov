import logging
import os
from dataclasses import dataclass
from typing import Any

import flask
from apiflask import HTTPTokenAuth

from src.api.route_utils import raise_flask_error
from src.logging.flask_logger import add_extra_data_to_current_request_logs

logger = logging.getLogger(__name__)

# Initialize the authorization context
# this needs to be attached to your
# routes as `your_blueprint.auth_required(api_key_auth)`
# in order to enable authorization
api_key_auth = HTTPTokenAuth("ApiKey", header="X-Auth")


def get_app_security_scheme() -> dict[str, Any]:
    return {"ApiKeyAuth": {"type": "apiKey", "in": "header", "name": "X-Auth"}}


@dataclass
class User:
    # A very basic "user" for the purposes of logging
    # which API key was used to call us.
    username: str


API_AUTH_USERS: dict[str, User] | None = None


@api_key_auth.verify_token
def verify_token(token: str) -> User:
    logger.info("Authenticating provided token")

    user = process_token(token)

    # Note that the current user can also be found
    # by doing api_key_auth.current_user once in
    # the request context. This is here in case
    # multiple authentication approaches exist
    # in your API, you don't need to check each
    # one in order to figure out which was actually used
    flask.g.current_user = user

    # Add the "username" to all logs for the rest of the request lifecycle
    add_extra_data_to_current_request_logs({"auth.username": user.username})

    logger.info("Authentication successful")

    return user


def _get_auth_users() -> dict[str, User] | None:
    # To avoid every request re-parsing the auth token
    # string, load it once and store in a global variable
    # This doesn't really account for threading, but worst case
    # multiple threads write the same value
    global API_AUTH_USERS

    if API_AUTH_USERS is not None:
        return API_AUTH_USERS

    raw_auth_tokens = os.getenv("API_AUTH_TOKEN", None)

    if raw_auth_tokens is None:
        return None

    API_AUTH_USERS = {}

    # Auth tokens will look like some_value,another_value,a_third_value
    # and get usernames like:
    # some_value    -> auth_token_0
    # another_value -> auth_token_1
    # a_third_value -> auth_token_2
    #
    # This username is just used for logging, and is deliberately very
    # simple until we build out authentication more. This just gives us the most
    # barebones ability to do distinguish our users.
    auth_tokens = raw_auth_tokens.split(",")
    for i, token in enumerate(auth_tokens):
        API_AUTH_USERS[token] = User(username=f"auth_token_{i}")

    return API_AUTH_USERS


def process_token(token: str) -> User:
    # WARNING: this isn't really a production ready
    # auth approach. In reality the user object returned
    # here should be pulled from a DB or auth service, but
    # as there are several types of authentication, we are
    # keeping this pretty basic for the out-of-the-box approach
    api_auth_users = _get_auth_users()

    if not api_auth_users:
        logger.error(
            "Authentication is not setup, please add an API_AUTH_TOKEN environment variable."
        )
        raise_flask_error(
            401, "Authentication is not setup properly and the user cannot be authenticated"
        )

    user = api_auth_users.get(token, None)

    if user is None:
        logger.info("Authentication failed for provided auth token.")
        raise_flask_error(
            401, "The server could not verify that you are authorized to access the URL requested"
        )

    return user
