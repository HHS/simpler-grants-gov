import logging
from typing import cast

from apiflask import APIKeyHeaderAuth
from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.util.datetime_util as datetime_util
from src.adapters import db
from src.adapters.db import flask_db
from src.api.route_utils import raise_flask_error
from src.db.models.user_models import User, UserApiKey
from src.logging.flask_logger import add_extra_data_to_current_request_logs

logger = logging.getLogger(__name__)


class ApiUserKeyHttpTokenAuth(APIKeyHeaderAuth):
    """Custom HTTPTokenAuth that provides typed access to the current user API key and user."""

    def get_user_api_key(self) -> UserApiKey:
        """Wrapper method around the current_user value to handle type issues.

        Note that this value gets set based on whatever is returned from the method
        you configure for @<your ApiUserKeyHttpTokenAuth obj>.verify_token
        """
        return cast(UserApiKey, self.current_user)

    def get_user(self) -> User:
        """Get the User associated with the current API key.

        This is a convenience method since we typically only care about
        the user, not the API key itself.
        """
        return self.get_user_api_key().user


# Initialize the authorization context for API Gateway key authentication
# This uses the X-API-Key header which is the standard header that AWS API Gateway
# forwards when api_key_required is set to true
api_user_key_auth = ApiUserKeyHttpTokenAuth(
    "ApiKey", param_name="X-API-Key", security_scheme_name="ApiUserKeyAuth"
)


class ApiKeyValidationError(Exception):
    """Exception raised when API key validation fails"""

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


@api_user_key_auth.verify_token
@flask_db.with_db_session()
def verify_api_key(db_session: db.Session, token: str) -> UserApiKey:
    logger.info("Authenticating API Gateway key")

    with db_session.begin():
        try:
            api_key = validate_api_key_in_db(token, db_session)
        except ApiKeyValidationError as e:
            logger.info("API Gateway key authentication failed", extra={"auth.issue": e.message})
            raise_flask_error(401, e.message)

        api_key.last_used = datetime_util.utcnow()
        db_session.add(api_key)

        add_extra_data_to_current_request_logs(
            {
                "auth.user_id": api_key.user_id,
                "auth.api_key_id": str(api_key.api_key_id),
            }
        )

        logger.info("API Gateway key authentication successful")

        return api_key


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

    return user_api_key
