import logging
from datetime import timedelta
from typing import cast

import grants_shared.util.datetime_util as datetime_util
from apiflask import APIKeyHeaderAuth
from grants_shared.adapters import db
from grants_shared.adapters.db import flask_db
from grants_shared.api.route_utils import raise_flask_error
from grants_shared.auth.api_jwt_auth import ApiJwtConfig, JwtAuth, get_config
from grants_shared.auth.auth_errors import JwtValidationError
from grants_shared.logs.flask_logger import add_extra_data_to_current_request_logs

from src.auth.auth_handler import MgmtAuthHandler
from src.db.models.user_models import MgmtUser, MgmtUserTokenSession

logger = logging.getLogger(__name__)


class JwtUserHttpTokenAuth(APIKeyHeaderAuth):

    def get_user_token_session(self) -> MgmtUserTokenSession:
        """Wrapper method around the current_user value to handle type issues

        Note that this value gets set based on whatever is returned from the method
        you configure for @<your JwtUserHttpTokenAuth obj>.verify_token
        """
        return cast(MgmtUserTokenSession, self.current_user)


api_jwt_auth = JwtUserHttpTokenAuth(
    "ApiKey",
    param_name="X-MGMT-Token",
    security_scheme_name="ApiJwtAuth",
)


def create_jwt_for_user(
    user: MgmtUser,
    db_session: db.Session,
    config: ApiJwtConfig | None = None,
    email: str | None = None,
) -> tuple[str, MgmtUserTokenSession]:
    return JwtAuth(MgmtAuthHandler(db_session), config).create_jwt_for_user(user, email)


def parse_jwt_for_user(
    token: str, db_session: db.Session, config: ApiJwtConfig | None = None
) -> MgmtUserTokenSession:
    return JwtAuth(MgmtAuthHandler(db_session), config).parse_jwt_for_user(token)


@api_jwt_auth.verify_token
@flask_db.with_db_session()
def decode_token(db_session: db.Session, token: str) -> MgmtUserTokenSession:
    """
    Process an internal jwt token as created by the above create_jwt_for_user method.

    To add this auth to an endpoint, simply put::

        from src.auth.api_jwt_auth import api_jwt_auth

        @example_blueprint.get("/example")
        @example_blueprint.auth_required(api_jwt_auth)
        @flask_db.with_db_session()
        def example_method(db_session: db.Session) -> response.ApiResponse:
            # The token session object can be fetched from the auth object
            token_session: UserTokenSession = api_jwt_auth.current_user

            # If you want to modify the token_session or user, you will
            # need to add it to the DB session otherwise it won't do anything
            db_session.add(token_session)
            token_session.expires_at = ...
            ...
    """

    try:
        user_token_session = parse_jwt_for_user(token, db_session)

        add_extra_data_to_current_request_logs(user_token_session.get_log_extra())
        logger.info("JWT Authentication Successful")

        # Return the user token session object
        return user_token_session
    except JwtValidationError as e:
        # If validation of the jwt fails, pass the error message back to the user
        # The message is just the value we set when constructing the JwtValidationError
        logger.info("JWT Authentication Failed for provided token", extra={"auth.issue": e.message})
        raise_flask_error(401, e.message)


def refresh_token_expiration(
    token_session: MgmtUserTokenSession, config: ApiJwtConfig | None = None
) -> MgmtUserTokenSession:
    if config is None:
        config = get_config()

    expiration_time = datetime_util.utcnow() + timedelta(minutes=config.token_expiration_minutes)
    token_session.expires_at = expiration_time

    return token_session
