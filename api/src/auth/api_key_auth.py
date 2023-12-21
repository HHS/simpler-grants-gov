import logging
import os
import uuid
from dataclasses import dataclass
from typing import Any

import flask
from apiflask import HTTPTokenAuth, abort

logger = logging.getLogger(__name__)

# Initialize the authorization context
# this needs to be attached to your
# routes as `your_blueprint..auth_required(api_key_auth)`
# in order to enable authorization
api_key_auth = HTTPTokenAuth("ApiKey", header="X-Auth")


def get_app_security_scheme() -> dict[str, Any]:
    return {"ApiKeyAuth": {"type": "apiKey", "in": "header", "name": "X-Auth"}}


@dataclass
class User:
    # WARNING: This is a very rudimentary
    # user for demo purposes and is not
    # a production ready approach. It exists
    # purely to define a rough structure / example
    id: uuid.UUID
    sub_id: str
    username: str

    def as_dict(self) -> dict[str, Any]:
        # Connexion expects a dictionary it can
        # use .get() on, so convert this to that format
        return {"uid": self.id, "sub": self.sub_id}

    def get_user_log_attributes(self) -> dict:
        # Note this gets called during authentication
        # to attach the information to the flask global object
        # which will in turn be attached to the log record
        return {"current_user.id": str(self.id)}


API_AUTH_USER = User(uuid.uuid4(), "sub_id_1234", "API auth user")


@api_key_auth.verify_token
def verify_token(token: str) -> dict:
    logger.info("Authenticating provided token")

    user = process_token(token)

    # Note that the current user can also be found
    # by doing api_key_auth.current_user once in
    # the request context. This is here in case
    # multiple authentication approaches exist
    # in your API, you don't need to check each
    # one in order to figure out which was actually used
    flask.g.current_user = user
    flask.g.current_user_log_attributes = user.get_user_log_attributes()

    logger.info("Authentication successful")

    return user.as_dict()


def process_token(token: str) -> User:
    # WARNING: this isn't really a production ready
    # auth approach. In reality the user object returned
    # here should be pulled from a DB or auth service, but
    # as there are several types of authentication, we are
    # keeping this pretty basic for the out-of-the-box approach
    expected_auth_token = os.getenv("API_AUTH_TOKEN", None)

    if not expected_auth_token:
        logger.error(
            "Authentication is not setup, please add an API_AUTH_TOKEN environment variable."
        )
        abort(401, "Authentication is not setup properly and the user cannot be authenticated")

    if token != expected_auth_token:
        logger.info("Authentication failed for provided auth token.")
        abort(
            401, "The server could not verify that you are authorized to access the URL requested"
        )

    return API_AUTH_USER
