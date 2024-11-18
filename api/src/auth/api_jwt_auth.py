import logging
import uuid
from datetime import timedelta

import jwt
from pydantic import Field
from sqlalchemy import select

import src.util.datetime_util as datetime_util
from src.adapters import db
from src.auth.auth_errors import JwtValidationError
from src.db.models.user_models import User, UserTokenSession
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class ApiJwtConfig(PydanticBaseEnvConfig):

    private_key: str = Field(alias="API_JWT_PRIVATE_KEY")
    public_key: str = Field(alias="API_JWT_PUBLIC_KEY")

    issuer: str = Field("simpler-grants-api", alias="API_JWT_ISSUER")
    audience: str = Field("simpler-grants-api", alias="API_JWT_AUDIENCE")

    algorithm: str = Field("RS256", alias="API_JWT_ALGORITHM")

    token_expiration_minutes: int = Field(30, alias="API_JWT_TOKEN_EXPIRATION_MINUTES")


# Initialize a config at startup that we'll use below
_config: ApiJwtConfig | None = None


def initialize() -> None:
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
        raise Exception("No JWT configuration - initialize() must be run first")

    return _config


def create_jwt_for_user(
    user: User, db_session: db.Session, config: ApiJwtConfig | None = None
) -> str:
    if config is None:
        config = get_config()

    # Generate a random ID
    token_id = uuid.uuid4()

    # Always do all time checks in UTC for consistency
    current_time = datetime_util.utcnow()
    expiration_time = current_time + timedelta(minutes=config.token_expiration_minutes)

    # Create the session in the DB
    db_session.add(
        UserTokenSession(
            user=user,
            token_id=token_id,
            expires_at=expiration_time,
        )
    )

    # Create the JWT with information we'll want to receive back
    payload = {
        "sub": str(token_id),
        # iat -> issued at
        "iat": current_time,
        "aud": config.audience,
        "iss": config.issuer,
    }

    return jwt.encode(payload, config.private_key, algorithm="RS256")


def parse_jwt_for_user(
    token: str, db_session: db.Session, config: ApiJwtConfig | None = None
) -> User:
    # TODO - more implementation/validation to come in https://github.com/HHS/simpler-grants-gov/issues/2809
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
        select(UserTokenSession).join(User).where(UserTokenSession.token_id == sub_id)
    ).scalar_one_or_none()

    # We check both the token expires_at timestamp as well as an
    # is_valid flag to make sure the token is still valid.
    if token_session is None:
        raise JwtValidationError("Token session does not exist")
    if token_session.expires_at < current_timestamp:
        raise JwtValidationError("Token expired")
    if token_session.is_valid is False:
        raise JwtValidationError("Token is no longer valid")

    return token_session.user
