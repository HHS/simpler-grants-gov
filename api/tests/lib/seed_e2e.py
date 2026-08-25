import logging
import os
import uuid

from grants_shared.util.file_util import write_to_file
from pydantic import Field

from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)

###############################
# This script will
# * seed the local database with one or more test users for fake or potentially real logins from
#   automated e2e tests. Each is flagged via UserBuilder.with_e2e_test_user(), which grants
#   E2E_TEST_USER_ROLE (the READ_TEST_USER_TOKEN privilege) so its auth token can be returned via
#   POST /v1/internal/e2e-token.
# * seed a "manager" user whose API key the e2e orchestrator uses to call
#   POST /v1/internal/e2e-token (mirrors the staging manager-key flow)
# * write the primary test user's token into the e2e_token.tmp file (where it can be retrieved by
#   CI processes for frontend / e2e use)
#
# To add a new test user, add another UserBuilder(...).with_e2e_test_user()... block below with a
# static user id.
###############################

# Static UUID for the local E2E manager user. Documented to QA alongside the
# test user UUIDs.
E2E_MANAGER_USER_ID = uuid.UUID("c3d4e5f6-a7b8-4c5d-9e0f-1a2b3c4d5e6f")

# Dedicated agency for the E2E test user's grantor role. Kept separate from the
# agencies in seed_agencies_and_users so opportunities created by E2E runs stay
# isolated, and so the grantor opportunities page auto-selects a single agency.
E2E_AGENCY_ID = uuid.UUID("d4e5f6a7-b8c9-4d5e-9f0a-1b2c3d4e5f60")

# Fixed assistance listing the opportunity-creation E2E test enters on the
# Create Opportunity page. Staging has real ALN data; local/CI must seed this
# specific number or the create endpoint returns a 404.
E2E_ASSISTANCE_LISTING_ID = uuid.UUID("e5f6a7b8-c9d0-4e5f-a0b1-2c3d4e5f6a70")
E2E_ASSISTANCE_LISTING_NUMBER = "00.000"

# Dedicated organization for E2E test users that need organization membership.
# Mirrors the setup of the staging test user's organization. This id is
# local-only and does not need to match staging's organization id.
E2E_ORGANIZATION_ID = uuid.UUID("e5f6a7b8-c9d0-4e5f-8a0b-1c2d3e4f5061")

# Static id for the secondary E2E test user, a member of the E2E test organization.
E2E_ORG_MEMBER_USER_ID = uuid.UUID("a7b8c9d0-e1f2-4a3b-8c4d-5e6f7a8b9c0d")


class _SeedE2EConfig(PydanticBaseEnvConfig):
    local_test_user_manager_api_key: str = Field(alias="LOCAL_TEST_USER_MANAGER_API_KEY")


def _write_token_to_file(token: str) -> None:
    path_to_tmp_token_file = os.path.join(os.path.dirname(__file__), "..", "..", "e2e_token.tmp")
    token_declaration = 'E2E_USER_AUTH_TOKEN="' + token + '"'
    write_to_file(path_to_tmp_token_file, token_declaration)
