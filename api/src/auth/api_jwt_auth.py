import jwt
from src.adapters import db
from src.db.models.user_models import User, UserTokenSession
from src.util.env_config import PydanticBaseEnvConfig
from pydantic import Field
from datetime import datetime, timedelta
import uuid
from sqlalchemy import select

import src.util.datetime_util as datetime_util
import logging

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

def initialize():
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
            }
        )

def get_config() -> ApiJwtConfig:
    global _config

    if _config is None:
        raise Exception("No JWT configuration - initialize() must be run first")

    return _config

def create_jwt_for_user(user: User, db_session: db.Session, config: ApiJwtConfig | None = None) -> str:
    if config is None:
        config = get_config()

    token_id = uuid.uuid4()

    current_time = datetime_util.utcnow()
    expiration_time = current_time + timedelta(minutes=config.token_expiration_minutes)

    db_session.add(UserTokenSession(
        user=user,
        token_id=token_id,
        expires_at=expiration_time,
    ))

    payload = {
        "sub": str(token_id),
        # iat -> issued at
        "iat": current_time,
        "aud": config.audience,
        "iss": config.issuer
    }

    return jwt.encode(payload, config.private_key, algorithm="RS256")


def parse_jwt_for_user(token: str, db_session: db.Session, config: ApiJwtConfig | None = None) -> User:
    if config is None:
        config = get_config()

    current_timestamp = datetime_util.utcnow()

    try:
        token = jwt.decode(token, config.public_key, algorithms=[config.algorithm], issuer=config.issuer, audience=config.audience,
                           options={
            "verify_signature": True,
            "verify_iat": True,
            "verify_aud": True,
            "verify_iss": True,
            # We do not set the following fields
            # so do not want to validate.
            "verify_exp": False, # expiration is managed in the DB
            "verify_nbf": False, # Tokens are always fine to use immediately
        })

        sub_id = token["sub"]
        token_session: UserTokenSession | None = db_session.execute(select(UserTokenSession).join(User).where(UserTokenSession.token_id == sub_id)).scalar_one_or_none()

        if token_session is None:
            # TODO
            pass
        if token_session.expires_at > current_timestamp:
            pass
        if token_session.is_valid is False:
            pass

        return token_session.user


    #except Exception: # TODO
    #    pass
    except KeyError:
        pass
