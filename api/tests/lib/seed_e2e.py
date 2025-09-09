import logging
import os
import uuid

import src.adapters.db as db
import tests.src.db.models.factories as factories
from src.auth.api_jwt_auth import create_jwt_for_user, initialize_jwt_auth
from src.util.file_util import write_to_file

logger = logging.getLogger(__name__)

###############################
# This script will
# * seed the local database with a user that can be used for fake or potentially real logins from automated e2e tests
# * create an authorization token entry tied to that user, seeding the database accordingly
# * write the resulting token into the overrides.env file (where it can be retrieved by CI processes for frontend / e2e use)
###############################

USER_E2E_BASE = factories.UserFactory.build(
    user_id=uuid.UUID("7edb5704-9d3b-4099-9e10-fbb9f2729aff")
)

LINK_USER_NO_ORGS = factories.LinkExternalUserFactory.build(
    link_external_user_id=uuid.UUID("786218f1-433e-4f30-b14b-ab9c1d170aff"),
    external_user_id="e2e_user",  # THIS IS WHAT WE USE TO LOGIN
    user=USER_E2E_BASE,
)


def _write_token_to_file(token: str) -> None:
    path_to_tmp_token_file = os.path.join(os.path.dirname(__file__), "..", "..", "e2e_token.tmp")
    token_declaration = 'E2E_USER_AUTH_TOKEN="' + token + '"'
    write_to_file(path_to_tmp_token_file, token_declaration)


def _build_users_and_tokens(db_session: db.Session) -> None:
    logger.info(f"Updating user for e2e: '{USER_E2E_BASE.user_id}'")
    user_e2e_base = db_session.merge(USER_E2E_BASE, load=True)
    db_session.merge(LINK_USER_NO_ORGS, load=True)
    initialize_jwt_auth()
    token, _user_token_session = create_jwt_for_user(user_e2e_base, db_session)
    _write_token_to_file(token)
