import logging
import uuid

import grants_shared.adapters.db as db
from grants_shared.api.route_utils import raise_flask_error
from pydantic import Field
from sqlalchemy import select

from src.auth.api_jwt_auth import create_jwt_for_user
from src.auth.endpoint_access_util import can_access, verify_access
from src.constants.lookup_constants import Privilege
from src.db.models.user_models import User
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)

LOWER_ENVIRONMENTS = {"local", "dev", "staging", "training"}


class _EnvironmentConfig(PydanticBaseEnvConfig):
    environment: str | None = Field(default=None, alias="ENVIRONMENT")


def create_e2e_token(db_session: db.Session, api_key_user: User, target_user_id: uuid.UUID) -> dict:
    env_config = _EnvironmentConfig()
    if env_config.environment not in LOWER_ENVIRONMENTS:
        logger.warning("Attempted to access E2E token endpoint in production")
        raise_flask_error(404, "Not Found")

    verify_access(api_key_user, {Privilege.MANAGE_TEST_USER_TOKEN}, None)

    target_user = db_session.execute(
        select(User).where(User.user_id == target_user_id)
    ).scalar_one_or_none()

    if target_user is None or not can_access(target_user, {Privilege.READ_TEST_USER_TOKEN}, None):
        logger.info(
            "E2E token requested for non-test user",
            extra={"target_user_id": target_user_id},
        )
        raise_flask_error(404, "Not Found")

    logger.info("Generating E2E bypass token")

    jwt_str, token_session = create_jwt_for_user(target_user, db_session)

    return {"token": jwt_str, "expires_at": token_session.expires_at}
