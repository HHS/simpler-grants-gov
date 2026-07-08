import logging

from grants_shared.adapters import db
from grants_shared.adapters.db import flask_db
from grants_shared.api.route_utils import raise_flask_error
from grants_shared.auth.api_jwt_auth import ApiJwtConfig, JwtAuth
from grants_shared.auth.auth_errors import JwtValidationError
from grants_shared.db.models.auth_base_models import BaseUser, BaseUserTokenSession
from grants_shared.logs.flask_logger import add_extra_data_to_current_request_logs

from src.auth.auth_handler import get_auth_handler
from src.auth.jwt_user_http_token_auth import JwtUserHttpTokenAuth

logger = logging.getLogger(__name__)

api_jwt_auth = JwtUserHttpTokenAuth(
    "ApiKey", param_name="X-SGG-Token", security_scheme_name="ApiJwtAuth"
)


def create_jwt_for_user(
    user: BaseUser,
    db_session: db.Session,
    config: ApiJwtConfig | None = None,
    email: str | None = None,
) -> tuple[str, BaseUserTokenSession]:
    return JwtAuth(get_auth_handler(db_session), config).create_jwt_for_user(user, email)


def parse_jwt_for_user(
    token: str, db_session: db.Session, config: ApiJwtConfig | None = None
) -> BaseUserTokenSession:
    return JwtAuth(get_auth_handler(db_session), config).parse_jwt_for_user(token)


@api_jwt_auth.verify_token
@flask_db.with_db_session()
def decode_token(db_session: db.Session, token: str) -> BaseUserTokenSession:
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

        add_extra_data_to_current_request_logs(
            {
                "auth.user_id": user_token_session.user_id,
                "auth.token_id": user_token_session.token_id,
            }
        )
        logger.info("JWT Authentication Successful")

        # Return the user token session object
        return user_token_session
    except JwtValidationError as e:
        # If validation of the jwt fails, pass the error message back to the user
        # The message is just the value we set when constructing the JwtValidationError
        logger.info("JWT Authentication Failed for provided token", extra={"auth.issue": e.message})
        raise_flask_error(401, e.message)
