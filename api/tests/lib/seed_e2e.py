import os
import tests.src.db.models.factories as factories
import logging
import uuid
import src.adapters.db as db
from src.auth.api_jwt_auth import create_jwt_for_user
from src.auth.api_jwt_auth import initialize_jwt_auth
from pathlib import Path
from src.util.file_util import append_to_file

logger = logging.getLogger(__name__)

###############################
# This script will
# * seed the local database with a user that can be used for fake or potentially real logins from automated e2e tests
# * create an authorization token entry tied to that user, seeding the database accordingly
# * write the resulting token into the overrides.env file (where it can be retrieved by CI processes for frontend / e2e use)
###############################


def _append_token_to_override(token: str) -> None:
    path_to_override = os.path.join(os.path.dirname(__file__), "..", "..", "override.env")
    if Path(path_to_override).exists():
        token_declaration = 'E2E_USER_AUTH_TOKEN="' + token + '"'
        append_to_file(path_to_override, token_declaration)


def _build_users_and_tokens(db_session: db.Session) -> None:
    USER_E2E_BASE = factories.UserFactory.build(
        user_id=uuid.UUID("7edb5704-9d3b-4099-9e10-fbb9f2729aff")
    )
    logger.info(f"Updating user for e2e: '{USER_E2E_BASE.user_id}'")
    initialize_jwt_auth()
    token, _user_token_session = create_jwt_for_user(USER_E2E_BASE, db_session)
    _append_token_to_override(token)
