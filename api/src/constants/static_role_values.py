import uuid

from src.constants.lookup_constants import Privilege, RoleType
from src.db.models.user_models import LinkRolePrivilege, LinkRoleRoleType, Role

# The association proxy relationships (`privileges` and `role_types`) are not set up during
# object initialization, so when defining static Role instances, we need to explicitly
# define the underlying relationships (`link_privileges` and `link_role_types`) to ensure
# proper linkage and persistence.


def get_link_privileges(role_id: uuid.UUID, privilege: list[Privilege]) -> list[LinkRolePrivilege]:
    return [LinkRolePrivilege(role_id=role_id, privilege=priv) for priv in privilege]


############################
# Core Organization Roles
############################

ORG_ADMIN_ID = uuid.UUID("446bafb9-41ee-46ac-8584-889aedcd5142")
ORG_ADMIN = Role(
    role_id=ORG_ADMIN_ID,
    role_name="Organization Admin",
    is_core=True,
    link_privileges=get_link_privileges(
        ORG_ADMIN_ID,
        [
            Privilege.MANAGE_ORG_MEMBERS,
            Privilege.VIEW_ORG_MEMBERSHIP,
            Privilege.START_APPLICATION,
            Privilege.LIST_APPLICATION,
            Privilege.VIEW_APPLICATION,
            Privilege.MODIFY_APPLICATION,
            Privilege.SUBMIT_APPLICATION,
            Privilege.VIEW_ORG_SAVED_OPPORTUNITIES,
            Privilege.MODIFY_ORG_SAVED_OPPORTUNITIES,
        ],
    ),
    link_role_types=[LinkRoleRoleType(role_id=ORG_ADMIN_ID, role_type=RoleType.ORGANIZATION)],
)

ORG_MEMBER_ID = uuid.UUID("336a530f-a356-4fbd-85ef-bc0ce18f89c8")
ORG_MEMBER = Role(
    role_id=ORG_MEMBER_ID,
    role_name="Organization Member",
    is_core=True,
    link_privileges=get_link_privileges(
        ORG_MEMBER_ID,
        [
            Privilege.VIEW_ORG_MEMBERSHIP,
            Privilege.START_APPLICATION,
            Privilege.LIST_APPLICATION,
            Privilege.VIEW_APPLICATION,
            Privilege.MODIFY_APPLICATION,
            Privilege.SUBMIT_APPLICATION,
            Privilege.VIEW_ORG_SAVED_OPPORTUNITIES,
            Privilege.MODIFY_ORG_SAVED_OPPORTUNITIES,
        ],
    ),
    link_role_types=[LinkRoleRoleType(role_id=ORG_MEMBER_ID, role_type=RoleType.ORGANIZATION)],
)

############################
# Core Application Roles
############################

APPLICATION_OWNER_ID = uuid.UUID("f1e72876-ad13-4734-be5c-b43c8cef8d67")
APPLICATION_OWNER = Role(
    role_id=APPLICATION_OWNER_ID,
    role_name="Application Owner",
    is_core=True,
    link_privileges=get_link_privileges(
        APPLICATION_OWNER_ID,
        [
            Privilege.START_APPLICATION,
            Privilege.LIST_APPLICATION,
            Privilege.VIEW_APPLICATION,
            Privilege.MODIFY_APPLICATION,
            Privilege.SUBMIT_APPLICATION,
        ],
    ),
    link_role_types=[
        LinkRoleRoleType(role_id=APPLICATION_OWNER_ID, role_type=RoleType.APPLICATION)
    ],
)

APPLICATION_CONTRIBUTOR_ID = uuid.UUID("d8c73cba-e4c9-4d3f-b661-b79609d4b7dd")
APPLICATION_CONTRIBUTOR = Role(
    role_id=APPLICATION_CONTRIBUTOR_ID,
    role_name="Application Contributor",
    is_core=True,
    link_privileges=get_link_privileges(
        APPLICATION_CONTRIBUTOR_ID,
        [
            Privilege.LIST_APPLICATION,
            Privilege.VIEW_APPLICATION,
            Privilege.MODIFY_APPLICATION,
        ],
    ),
    link_role_types=[
        LinkRoleRoleType(role_id=APPLICATION_CONTRIBUTOR_ID, role_type=RoleType.APPLICATION)
    ],
)

############################
# Core Agency Roles
############################

LEGACY_AGENCY_S2S_ROLE_ID = uuid.UUID("8e7b6c9d-a3f1-4b2e-9d8c-1e2f3a4b5c6d")
LEGACY_AGENCY_S2S_ROLE = Role(
    role_id=LEGACY_AGENCY_S2S_ROLE_ID,
    role_name="Legacy Agency S2S Role",
    is_core=True,
    link_privileges=get_link_privileges(
        LEGACY_AGENCY_S2S_ROLE_ID,
        [
            Privilege.LEGACY_AGENCY_VIEWER,
            Privilege.LEGACY_AGENCY_GRANT_RETRIEVER,
            Privilege.LEGACY_AGENCY_ASSIGNER,
        ],
    ),
    link_role_types=[
        LinkRoleRoleType(role_id=LEGACY_AGENCY_S2S_ROLE_ID, role_type=RoleType.AGENCY)
    ],
)

############################
# Core Opportunity Roles
############################

OPPORTUNITY_EDITOR_ID = uuid.UUID("5e612395-9e66-4c12-aae0-b62204221916")
OPPORTUNITY_EDITOR = Role(
    role_id=OPPORTUNITY_EDITOR_ID,
    role_name="Opportunity Editor",
    is_core=True,
    link_privileges=get_link_privileges(
        OPPORTUNITY_EDITOR_ID,
        [
            Privilege.VIEW_OPPORTUNITY,
            Privilege.CREATE_OPPORTUNITY,
            Privilege.UPDATE_OPPORTUNITY,
        ],
    ),
    link_role_types=[LinkRoleRoleType(role_id=OPPORTUNITY_EDITOR_ID, role_type=RoleType.AGENCY)],
)

OPPORTUNITY_PUBLISHER_ID = uuid.UUID("d1654d1e-01f8-437c-bdf0-636e1f182451")
OPPORTUNITY_PUBLISHER = Role(
    role_id=OPPORTUNITY_PUBLISHER_ID,
    role_name="Opportunity Publisher",
    is_core=True,
    link_privileges=get_link_privileges(
        OPPORTUNITY_PUBLISHER_ID,
        [
            Privilege.VIEW_OPPORTUNITY,
            Privilege.PUBLISH_OPPORTUNITY,
            Privilege.CREATE_OPPORTUNITY,
            Privilege.UPDATE_OPPORTUNITY,
        ],
    ),
    link_role_types=[LinkRoleRoleType(role_id=OPPORTUNITY_PUBLISHER_ID, role_type=RoleType.AGENCY)],
)

############################
# Core Internal Roles
############################

NAVA_INTERNAL_ROLE_ID = uuid.UUID("57e8875f-c154-41be-a5f6-602f4c92d6e6")
NAVA_INTERNAL_ROLE = Role(
    role_id=NAVA_INTERNAL_ROLE_ID,
    role_name="Nava Internal Admin Role",
    is_core=True,
    link_privileges=get_link_privileges(
        NAVA_INTERNAL_ROLE_ID,
        [Privilege.UPDATE_FORM, Privilege.MANAGE_INTERNAL_ROLES, Privilege.MANAGE_COMPETITION],
    ),
    link_role_types=[LinkRoleRoleType(role_id=NAVA_INTERNAL_ROLE_ID, role_type=RoleType.INTERNAL)],
)

E2E_TEST_USER_ROLE_ID = uuid.UUID("a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d")
E2E_TEST_USER_ROLE = Role(
    role_id=E2E_TEST_USER_ROLE_ID,
    role_name="E2E Test User",
    is_core=True,
    link_privileges=get_link_privileges(
        E2E_TEST_USER_ROLE_ID,
        [
            Privilege.READ_TEST_USER_TOKEN,
        ],
    ),
    link_role_types=[LinkRoleRoleType(role_id=E2E_TEST_USER_ROLE_ID, role_type=RoleType.INTERNAL)],
)

SYSTEM_WORKFLOW_USER_ROLE_ID = uuid.UUID("18258804-a281-41cd-9afb-06061fa7593c")
SYSTEM_WORKFLOW_USER_ROLE = Role(
    role_id=SYSTEM_WORKFLOW_USER_ROLE_ID,
    role_name="System Workflow Role",
    is_core=True,
    link_privileges=get_link_privileges(
        SYSTEM_WORKFLOW_USER_ROLE_ID, [Privilege.INTERNAL_WORKFLOW_ACCESS]
    ),
    link_role_types=[
        LinkRoleRoleType(role_id=SYSTEM_WORKFLOW_USER_ROLE_ID, role_type=RoleType.INTERNAL),
    ],
)

CORE_ROLES = [
    ORG_ADMIN,
    ORG_MEMBER,
    APPLICATION_OWNER,
    APPLICATION_CONTRIBUTOR,
    E2E_TEST_USER_ROLE,
    LEGACY_AGENCY_S2S_ROLE,
    OPPORTUNITY_EDITOR,
    OPPORTUNITY_PUBLISHER,
    NAVA_INTERNAL_ROLE,
    SYSTEM_WORKFLOW_USER_ROLE,
]
