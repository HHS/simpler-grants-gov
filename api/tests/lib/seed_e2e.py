import logging
import os
import uuid

import grants_shared.adapters.db as db
from grants_shared.util.file_util import write_to_file
from pydantic import Field

from src.constants.static_role_values import (
    E2E_TEST_USER_MANAGER_ROLE,
    E2E_TEST_USER_ROLE,
    OPPORTUNITY_PUBLISHER,
)
from src.util.env_config import PydanticBaseEnvConfig
from tests.lib.seed_agencies_and_users import setup_agency
from tests.lib.seed_data_utils import UserBuilder

logger = logging.getLogger(__name__)

###############################
# This script will
# * seed the local database with a user that can be used for fake or potentially real logins from automated e2e tests
# * seed a "manager" user whose API key the e2e orchestrator uses to call
#   POST /v1/internal/e2e-token (mirrors the staging manager-key flow)
# * create an authorization token entry tied to the test user, seeding the database accordingly
# * write the resulting token into the e2e_token.tmp file (where it can be retrieved by CI processes for frontend / e2e use)
###############################

# Static UUID for the local E2E manager user. Documented to QA alongside the
# test user UUIDs.
E2E_MANAGER_USER_ID = uuid.UUID("c3d4e5f6-a7b8-4c5d-9e0f-1a2b3c4d5e6f")

# Dedicated agency for the E2E test user's grantor role. Kept separate from the
# agencies in seed_agencies_and_users so opportunities created by E2E runs stay
# isolated, and so the grantor opportunities page auto-selects a single agency.
E2E_AGENCY_ID = uuid.UUID("d4e5f6a7-b8c9-4d5e-9f0a-1b2c3d4e5f60")


class _SeedE2EConfig(PydanticBaseEnvConfig):
    local_test_user_manager_api_key: str = Field(alias="LOCAL_TEST_USER_MANAGER_API_KEY")


def _write_token_to_file(token: str) -> None:
    path_to_tmp_token_file = os.path.join(os.path.dirname(__file__), "..", "..", "e2e_token.tmp")
    token_declaration = 'E2E_USER_AUTH_TOKEN="' + token + '"'
    write_to_file(path_to_tmp_token_file, token_declaration)


def _build_users_and_tokens(db_session: db.Session) -> None:
    config = _SeedE2EConfig()

    e2e_agency = setup_agency(
        db_session,
        agency_id=E2E_AGENCY_ID,
        agency_code="E2E",
        agency_name="E2E Test Agency",
    )

    builder = (
        # Reuse the seeded one_org_user so the spoofed E2E session always has
        # organization membership in local/CI runs.
        UserBuilder(uuid.UUID("f15c7491-7ebc-4f4f-8de6-3ac0594d9c63"), db_session, "user for e2e")
        .with_jwt_auth()
        .with_api_key("e2e-test-key")
        .with_internal_role(E2E_TEST_USER_ROLE)
        # Grantor role so the Create Opportunity link shows and opportunity
        # creation E2E tests can create and publish opportunities.
        .with_agency(e2e_agency, roles=[OPPORTUNITY_PUBLISHER])
    )

    builder.build()
    _write_token_to_file(builder.jwt_token)

    # Manager user: holds the API key the e2e orchestrator uses to request
    # tokens for any test user via POST /v1/internal/e2e-token.
    (
        UserBuilder(E2E_MANAGER_USER_ID, db_session, "e2e test user manager")
        .with_api_key(config.local_test_user_manager_api_key)
        .with_internal_role(E2E_TEST_USER_MANAGER_ROLE)
        .build()
    )
