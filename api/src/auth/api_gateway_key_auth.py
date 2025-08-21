import logging

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.util.datetime_util as datetime_util
from src.adapters import db
from src.adapters.db import flask_db
from src.api.route_utils import raise_flask_error
from src.auth.jwt_user_http_token_auth import JwtUserHttpTokenAuth
from src.db.models.user_models import UserApiKey
from src.logging.flask_logger import add_extra_data_to_current_request_logs

logger = logging.getLogger(__name__)

# Initialize the authorization context for API Gateway key authentication
# This uses the X-API-Key header which is the standard header that AWS API Gateway
# forwards when api_key_required is set to true
api_gateway_key_auth = JwtUserHttpTokenAuth(
    "ApiKey", header="X-API-Key", security_scheme_name="ApiGatewayKeyAuth"
)


class ApiKeyValidationError(Exception):
    """Exception raised when API key validation fails"""

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


@api_gateway_key_auth.verify_token
@flask_db.with_db_session()
def verify_api_key(db_session: db.Session, token: str) -> UserApiKey:
    logger.info("Authenticating API Gateway key")

    try:
        api_key = validate_api_key_in_db(token, db_session)

        # Update last_used timestamp
        api_key.last_used = datetime_util.utcnow()
        db_session.add(api_key)
        # Note: We don't commit here as the transaction will be managed
        # by the calling context (e.g., @flask_db.with_db_session)

        add_extra_data_to_current_request_logs(
            {
                "auth.user_id": str(api_key.user_id),
                "auth.api_key_id": str(api_key.api_key_id),
            }
        )

        logger.info("API Gateway key authentication successful")

        return api_key

    except ApiKeyValidationError as e:
        logger.info("API Gateway key authentication failed", extra={"auth.issue": e.message})
        raise_flask_error(401, e.message)


def validate_api_key_in_db(api_key: str, db_session: db.Session) -> UserApiKey:
    user_api_key: UserApiKey | None = db_session.execute(
        select(UserApiKey)
        .where(UserApiKey.key_id == api_key)
        .options(selectinload(UserApiKey.user))
    ).scalar_one_or_none()

    if user_api_key is None:
        raise ApiKeyValidationError("Invalid API key")

    if not user_api_key.is_active:
        raise ApiKeyValidationError("API key is inactive")

    if user_api_key.user is None:
        raise ApiKeyValidationError("API key is not associated with a valid user")

    return user_api_key
