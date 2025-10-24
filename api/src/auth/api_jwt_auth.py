import logging
import uuid
from datetime import timedelta

import jwt
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.util.datetime_util as datetime_util
from src.adapters import db
from src.adapters.db import flask_db
from src.api.route_utils import raise_flask_error
from src.auth.auth_errors import JwtValidationError
from src.auth.jwt_user_http_token_auth import JwtUserHttpTokenAuth
from src.db.models.user_models import User, UserTokenSession
from src.logging.flask_logger import add_extra_data_to_current_request_logs
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)

api_jwt_auth = JwtUserHttpTokenAuth(
    "ApiKey", header="X-SGG-Token", security_scheme_name="ApiJwtAuth"
)


class ApiJwtConfig(PydanticBaseEnvConfig):

    private_key: str = Field(alias="API_JWT_PRIVATE_KEY")
    public_key: str = Field(alias="API_JWT_PUBLIC_KEY")

    issuer: str = Field("simpler-grants-api", alias="API_JWT_ISSUER")
    audience: str = Field("simpler-grants-api", alias="API_JWT_AUDIENCE")

    algorithm: str = Field("RS256", alias="API_JWT_ALGORITHM")

    token_expiration_minutes: int = Field(30, alias="API_JWT_TOKEN_EXPIRATION_MINUTES")


# Initialize a config at startup that we'll use below
_config: ApiJwtConfig | None = None


def initialize_jwt_auth() -> None:
    global _config
    if not _config:
        _config = ApiJwtConfig()
        logger.info(
            "Constructed JWT configuration",
            extra={
                # NOTE: We don't just log the entire config
                # because that would include the encryption keys
                "issuer": _config.issuer,
                "audience": _config.audience,
                "algorithm": _config.algorithm,
                "token_expiration_minutes": _config.token_expiration_minutes,
            },
        )


def get_config() -> ApiJwtConfig:
    global _config

    if _config is None:
        raise Exception("No JWT configuration - initialize_jwt_auth() must be run first")

    return _config


def create_jwt_for_user(
    user: User, db_session: db.Session, config: ApiJwtConfig | None = None, email: str | None = None
) -> tuple[str, UserTokenSession]:
    if config is None:
        config = get_config()

    # Generate a random ID
    token_id = uuid.uuid4()

    # Always do all time checks in UTC for consistency
    current_time = datetime_util.utcnow()
    expiration_time = current_time + timedelta(minutes=config.token_expiration_minutes)

    # Create the session in the DB
    user_token_session = UserTokenSession(user=user, token_id=token_id, expires_at=expiration_time)
    db_session.add(user_token_session)

    # Create the JWT with information we'll want to receive back
    payload = {
        "sub": str(token_id),
        # iat -> issued at
        "iat": current_time,
        "aud": config.audience,
        "iss": config.issuer,
        "email": email,
        "user_id": str(user.user_id),
        "session_duration_minutes": config.token_expiration_minutes,
    }

    logger.info(
        "Created JWT token",
        extra={
            "auth.user_id": str(user_token_session.user_id),
            "auth.token_id": str(user_token_session.token_id),
        },
    )

    return jwt.encode(payload, config.private_key, algorithm="RS256"), user_token_session


def parse_jwt_for_user(
    token: str, db_session: db.Session, config: ApiJwtConfig | None = None
) -> UserTokenSession:
    """Handle processing a jwt token, and connecting it to a user token session in our DB"""
    if config is None:
        config = get_config()

    current_timestamp = datetime_util.utcnow()

    try:
        parsed_jwt: dict = jwt.decode(
            token,
            config.public_key,
            algorithms=[config.algorithm],
            issuer=config.issuer,
            audience=config.audience,
            options={
                "verify_signature": True,
                "verify_iat": True,
                "verify_aud": True,
                "verify_iss": True,
                # We do not set the following fields
                # so do not want to validate.
                "verify_exp": False,  # expiration is managed in the DB
                "verify_nbf": False,  # Tokens are always fine to use immediately
            },
        )

    except jwt.ImmatureSignatureError as e:  # IAT errors hit this
        raise JwtValidationError("Token not yet valid") from e
    except jwt.InvalidIssuerError as e:
        raise JwtValidationError("Unknown Issuer") from e
    except jwt.InvalidAudienceError as e:
        raise JwtValidationError("Unknown Audience") from e
    except jwt.PyJWTError as e:
        # Every other error case wrap in the same generic error message.
        raise JwtValidationError("Unable to process token") from e

    sub_id = parsed_jwt.get("sub", None)
    if sub_id is None:
        raise JwtValidationError("Token missing sub field")

    token_session: UserTokenSession | None = db_session.execute(
        select(UserTokenSession)
        .where(UserTokenSession.token_id == sub_id)
        .options(selectinload(UserTokenSession.user))
    ).scalar()

    # We check both the token expires_at timestamp as well as an
    # is_valid flag to make sure the token is still valid.
    if token_session is None:
        raise JwtValidationError("Token session does not exist")
    if token_session.expires_at < current_timestamp:
        raise JwtValidationError("Token expired")
    if token_session.is_valid is False:
        raise JwtValidationError("Token is no longer valid")

    return token_session


@api_jwt_auth.verify_token
@flask_db.with_db_session()
def decode_token(db_session: db.Session, token: str) -> UserTokenSession:
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


def refresh_token_expiration(
    token_session: UserTokenSession, config: ApiJwtConfig | None = None
) -> UserTokenSession:
    if config is None:
        config = get_config()

    expiration_time = datetime_util.utcnow() + timedelta(minutes=config.token_expiration_minutes)
    token_session.expires_at = expiration_time

    return token_session
