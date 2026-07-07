import logging
import uuid
from datetime import datetime, timedelta
from typing import Any

import jwt
from pydantic import Field

import grants_shared.util.datetime_util as datetime_util
from grants_shared.auth.auth_errors import JwtValidationError
from grants_shared.auth.auth_handler import AbstractAuthHandler
from grants_shared.db.models.auth_base_models import BaseUser, BaseUserTokenSession
from grants_shared.util.env_config import PydanticBaseEnvConfig

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


def generate_jwt(
    user_token_session: BaseUserTokenSession,
    user: BaseUser,
    current_time: datetime,
    email: str | None = None,
    config: ApiJwtConfig | None = None,
) -> str:
    """Create the JWT payload and make it into a JWT"""
    if config is None:
        config = get_config()

    payload = {
        "sub": str(user_token_session.token_id),
        # iat -> issued at
        "iat": current_time,
        "aud": config.audience,
        "iss": config.issuer,
        "email": email,
        "user_id": str(user.get_user_id()),
        "session_duration_minutes": config.token_expiration_minutes,
    }

    return jwt.encode(payload, config.private_key, algorithm="RS256")


class JwtAuth[USER: BaseUser, USER_TOKEN_SESSION: BaseUserTokenSession]:
    """Generic JWT creation/parsing flow.

    The DB interactions go through the injected :class:`AbstractAuthHandler`, so this flow
    can be reused across systems by binding the concrete user / token-session models.
    """

    def __init__(
        self,
        auth_handler: AbstractAuthHandler[USER, Any, Any, Any, USER_TOKEN_SESSION],
        config: ApiJwtConfig | None = None,
    ):
        self.auth_handler = auth_handler
        self.config = config if config is not None else get_config()

    def create_jwt_for_user(
        self, user: USER, email: str | None = None
    ) -> tuple[str, USER_TOKEN_SESSION]:
        # Always do all time checks in UTC for consistency
        current_time = datetime_util.utcnow()
        expiration_time = current_time + timedelta(minutes=self.config.token_expiration_minutes)

        # Create the session in the DB
        user_token_session = self.auth_handler.create_token_session(
            user, uuid.uuid4(), expiration_time
        )
        jwt_str = generate_jwt(
            user_token_session, user, current_time=current_time, email=email, config=self.config
        )

        logger.info(
            "Created JWT token",
            extra={
                "auth.user_id": user.get_user_id(),
                "auth.token_id": user_token_session.token_id,
            },
        )
        return jwt_str, user_token_session

    def parse_jwt_for_user(self, token: str) -> USER_TOKEN_SESSION:
        """Handle processing a jwt token, and connecting it to a user token session in our DB"""
        current_timestamp = datetime_util.utcnow()

        try:
            parsed_jwt: dict = jwt.decode(
                token,
                self.config.public_key,
                algorithms=[self.config.algorithm],
                issuer=self.config.issuer,
                audience=self.config.audience,
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
            logger.warning("Token parse failure: %r", repr(e))
            raise JwtValidationError("Unable to process token") from e

        sub_id = parsed_jwt.get("sub", None)
        if sub_id is None:
            raise JwtValidationError("Token missing sub field")

        token_session = self.auth_handler.get_token_session_by_token_id(sub_id)

        # We check both the token expires_at timestamp as well as an
        # is_valid flag to make sure the token is still valid.
        if token_session is None:
            raise JwtValidationError("Token session does not exist")
        if token_session.expires_at < current_timestamp:
            raise JwtValidationError("Token expired")
        if token_session.is_valid is False:
            raise JwtValidationError("Token is no longer valid")

        return token_session


def refresh_token_expiration(
    token_session: BaseUserTokenSession, config: ApiJwtConfig | None = None
) -> BaseUserTokenSession:
    if config is None:
        config = get_config()

    expiration_time = datetime_util.utcnow() + timedelta(minutes=config.token_expiration_minutes)
    token_session.expires_at = expiration_time

    return token_session
