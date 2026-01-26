import logging
import uuid
from datetime import datetime

import jwt
from sqlalchemy import select

import src.util.datetime_util as datetime_util
from src.adapters import db
from src.adapters.db import flask_db
from src.api.route_utils import raise_flask_error
from src.auth.api_jwt_auth import ApiJwtConfig, get_config
from src.auth.auth_errors import JwtValidationError
from src.auth.jwt_user_http_token_auth import JwtUserHttpTokenAuth
from src.db.models.competition_models import ShortLivedInternalToken
from src.logging.flask_logger import add_extra_data_to_current_request_logs

logger = logging.getLogger(__name__)

# Create the internal JWT auth object with the specified configuration
internal_jwt_auth = JwtUserHttpTokenAuth(
    "ApiKey", param_name="X-SGG-Internal-Token", security_scheme_name="InternalApiJwtAuth"
)


def create_jwt_for_internal_token(
    expires_at: datetime,
    db_session: db.Session,
    config: ApiJwtConfig | None = None,
) -> tuple[str, ShortLivedInternalToken]:
    """
    Create a JWT token for internal use with a short-lived token record.
    """
    if config is None:
        config = get_config()

    # Generate a random ID for this token
    token_id = uuid.uuid4()

    # Always do all time checks in UTC for consistency
    current_time = datetime_util.utcnow()

    # Create the session in the DB
    short_lived_token = ShortLivedInternalToken(
        short_lived_internal_token_id=token_id,
        expires_at=expires_at,
        is_valid=True,
    )
    db_session.add(short_lived_token)

    # Create the JWT with information we'll want to receive back
    payload = {
        "sub": str(token_id),
        # iat -> issued at
        "iat": current_time,
        "aud": config.audience,
        "iss": config.issuer,
    }

    logger.info(
        "Created internal JWT token",
        extra={
            "auth.short_lived_internal_token_id": str(token_id),
        },
    )

    return jwt.encode(payload, config.private_key, algorithm="RS256"), short_lived_token


def parse_jwt_for_internal_token(
    token: str, db_session: db.Session, config: ApiJwtConfig | None = None
) -> ShortLivedInternalToken:
    """
    Handle processing a JWT token and connecting it to a short-lived token record in our DB.
    """
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

    # Fetch the short-lived token from the database
    short_lived_token: ShortLivedInternalToken | None = db_session.execute(
        select(ShortLivedInternalToken).where(
            ShortLivedInternalToken.short_lived_internal_token_id == sub_id
        )
    ).scalar()

    # We check both the token expires_at timestamp as well as an
    # is_valid flag to make sure the token is still valid.
    if short_lived_token is None:
        raise JwtValidationError("Token session does not exist")
    if short_lived_token.expires_at < current_timestamp:
        raise JwtValidationError("Token expired")
    if short_lived_token.is_valid is False:
        raise JwtValidationError("Token is no longer valid")

    return short_lived_token


@internal_jwt_auth.verify_token
@flask_db.with_db_session()
def decode_internal_token(db_session: db.Session, token: str) -> ShortLivedInternalToken:
    """
    Process an internal JWT token as created by the above create_jwt_for_internal_token method.
    """

    try:
        short_lived_token = parse_jwt_for_internal_token(token, db_session)

        add_extra_data_to_current_request_logs(
            {
                "auth.short_lived_internal_token_id": str(
                    short_lived_token.short_lived_internal_token_id
                ),
            }
        )
        logger.info("Internal JWT Authentication Successful")

        # Return the short-lived token object
        return short_lived_token
    except JwtValidationError as e:
        # If validation of the jwt fails, pass the error message back to the user
        # The message is just the value we set when constructing the JwtValidationError
        logger.info(
            "Internal JWT Authentication Failed for provided token", extra={"auth.issue": e.message}
        )
        raise_flask_error(401, e.message)
