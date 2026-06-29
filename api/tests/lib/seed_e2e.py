import dataclasses
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
    ORG_MEMBER,
)
from src.db.models.agency_models import Agency
from src.db.models.entity_models import Organization
from src.util.env_config import PydanticBaseEnvConfig
from tests.lib.seed_agencies_and_users import setup_agency
from tests.lib.seed_data_utils import UserBuilder
from tests.lib.seed_orgs_and_users import setup_org
from tests.src.db.models.factories import AssistanceListingFactory

logger = logging.getLogger(__name__)

###############################
# This script will
# * seed the local database with one or more test users that can be used for fake or potentially
#   real logins from automated e2e tests. Every test user is granted E2E_TEST_USER_ROLE, which
#   carries the READ_TEST_USER_TOKEN privilege -- this is what "flags" a user as available to have
#   its auth token statically returned via POST /v1/internal/e2e-token.
# * seed a "manager" user whose API key the e2e orchestrator uses to call
#   POST /v1/internal/e2e-token (mirrors the staging manager-key flow)
# * write the primary test user's token into the e2e_token.tmp file (where it can be retrieved by
#   CI processes for frontend / e2e use)
#
# To add a new test user, append an E2ETestUserConfig to E2E_TEST_USERS with a static user id.
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


@dataclasses.dataclass
class E2ETestUserConfig:
    """Declarative definition of an E2E test user.

    Every user built from this config is granted E2E_TEST_USER_ROLE, so its token can be
    fetched by the manager API key via POST /v1/internal/e2e-token.
    """

    user_id: uuid.UUID
    scenario_name: str
    api_key: str | None = None
    add_jwt_auth: bool = False
    write_token_to_file: bool = False
    in_grantor_agency: bool = False
    in_test_organization: bool = False

    def __post_init__(self) -> None:
        # The token written to e2e_token.tmp is the JWT, so writing it requires JWT auth.
        # Guard here so a bad config fails when the registry is defined rather than silently
        # writing E2E_USER_AUTH_TOKEN="None" to the file at seed time.
        if self.write_token_to_file and not self.add_jwt_auth:
            raise ValueError(
                f"write_token_to_file requires add_jwt_auth for user {self.scenario_name}"
            )


# The set of test users seeded for E2E / multi-user testing. Append to this list to add a new
# test user -- each entry needs a static user id so it can be referenced.
E2E_TEST_USERS = [
    # Primary test user. Reuses the seeded one_org_user id so the spoofed E2E session always has
    # organization membership in local/CI runs, and holds a grantor role so opportunity creation
    # E2E tests can create and publish opportunities.
    E2ETestUserConfig(
        user_id=uuid.UUID("f15c7491-7ebc-4f4f-8de6-3ac0594d9c63"),
        scenario_name="user for e2e",
        api_key="e2e-test-key",
        add_jwt_auth=True,
        write_token_to_file=True,
        in_grantor_agency=True,
    ),
    # Secondary test user with organization membership, mirroring the staging test user.
    E2ETestUserConfig(
        user_id=E2E_ORG_MEMBER_USER_ID,
        scenario_name="e2e org member test user",
        in_test_organization=True,
    ),
]


class _SeedE2EConfig(PydanticBaseEnvConfig):
    local_test_user_manager_api_key: str = Field(alias="LOCAL_TEST_USER_MANAGER_API_KEY")


def _write_token_to_file(token: str) -> None:
    path_to_tmp_token_file = os.path.join(os.path.dirname(__file__), "..", "..", "e2e_token.tmp")
    token_declaration = 'E2E_USER_AUTH_TOKEN="' + token + '"'
    write_to_file(path_to_tmp_token_file, token_declaration)


def _build_test_user(
    db_session: db.Session,
    config: E2ETestUserConfig,
    e2e_agency: Agency,
    e2e_organization: Organization,
) -> None:
    builder = UserBuilder(config.user_id, db_session, config.scenario_name).with_internal_role(
        E2E_TEST_USER_ROLE
    )

    if config.add_jwt_auth:
        builder.with_jwt_auth()
    if config.api_key:
        builder.with_api_key(config.api_key)
    if config.in_grantor_agency:
        builder.with_agency(e2e_agency, roles=[OPPORTUNITY_PUBLISHER])
    if config.in_test_organization:
        builder.with_organization(e2e_organization, roles=[ORG_MEMBER])

    builder.build()

    if config.write_token_to_file:
        _write_token_to_file(builder.jwt_token)


def _build_users_and_tokens(db_session: db.Session) -> None:
    config = _SeedE2EConfig()

    # Seed the assistance listing the create-opportunity E2E test references.
    # merge() on a fixed id keeps this idempotent across repeated seed runs so
    # get_assistance_listing's scalar_one_or_none lookup stays unambiguous.
    db_session.merge(
        AssistanceListingFactory.build(
            assistance_listing_id=E2E_ASSISTANCE_LISTING_ID,
            assistance_listing_number=E2E_ASSISTANCE_LISTING_NUMBER,
            program_title="Test ALN",
        ),
        load=True,
    )

    e2e_agency = setup_agency(
        db_session,
        agency_id=E2E_AGENCY_ID,
        agency_code="E2E",
        agency_name="E2E Test Agency",
    )
    e2e_organization = setup_org(
        db_session,
        organization_id=E2E_ORGANIZATION_ID,
        legal_business_name="E2E Test Organization",
        uei="FAKEUEIE2E01",
    )

    for test_user in E2E_TEST_USERS:
        _build_test_user(db_session, test_user, e2e_agency, e2e_organization)

    # Manager user: holds the API key the e2e orchestrator uses to request
    # tokens for any test user via POST /v1/internal/e2e-token.
    (
        UserBuilder(E2E_MANAGER_USER_ID, db_session, "e2e test user manager")
        .with_api_key(config.local_test_user_manager_api_key)
        .with_internal_role(E2E_TEST_USER_MANAGER_ROLE)
        .build()
    )
