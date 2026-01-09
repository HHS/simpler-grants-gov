import logging
import os
import uuid

import src.adapters.db as db
from src.util.file_util import write_to_file
from tests.lib.seed_data_utils import UserBuilder

logger = logging.getLogger(__name__)

###############################
# This script will
# * seed the local database with a user that can be used for fake or potentially real logins from automated e2e tests
# * create an authorization token entry tied to that user, seeding the database accordingly
# * write the resulting token into the e2e_token.tmp file (where it can be retrieved by CI processes for frontend / e2e use)
###############################


def _write_token_to_file(token: str) -> None:
    path_to_tmp_token_file = os.path.join(os.path.dirname(__file__), "..", "..", "e2e_token.tmp")
    token_declaration = 'E2E_USER_AUTH_TOKEN="' + token + '"'
    write_to_file(path_to_tmp_token_file, token_declaration)


def _build_users_and_tokens(db_session: db.Session) -> None:
    builder = UserBuilder(
        uuid.UUID("7edb5704-9d3b-4099-9e10-fbb9f2729aff"), db_session, "user for e2e"
    ).with_jwt_auth()
    builder.build()
    _write_token_to_file(builder.jwt_token)
