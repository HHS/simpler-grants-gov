import logging
import os

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.auth.api_jwt_auth import create_jwt_for_user
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import Privilege
from src.db.models.user_models import User

logger = logging.getLogger(__name__)


def create_e2e_token(db_session: db.Session, user: User) -> dict:
    if os.getenv("APP_ENV") == "production":
        logger.warning("Attempted to access E2E token endpoint in production")
        raise_flask_error(404)

    verify_access(user, {Privilege.READ_TEST_USER_TOKEN}, None)

    logger.info("Generating E2E bypass token", extra={"auth.user_id": str(user.user_id)})

    jwt_str, token_session = create_jwt_for_user(user, db_session)

    return {"token": jwt_str, "expires_at": token_session.expires_at}
