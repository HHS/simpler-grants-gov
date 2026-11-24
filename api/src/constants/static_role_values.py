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

# Role for collaborators within an organization.
# Grants no application privileges - those are granted separately via the
# granular application roles below. is_core=False initially so it does not
# appear in the organization role-management endpoint's selectable list.
# This role's is_core will be set to True when it becomes a core role in
# the future, replacing Member.
ORG_COLLABORATOR_ID = uuid.UUID("1850d6f8-588d-4d0e-a65a-753d4ca005b1")
ORG_COLLABORATOR = Role(
    role_id=ORG_COLLABORATOR_ID,
    role_name="Collaborator",
    is_core=False,
    link_privileges=get_link_privileges(
        ORG_COLLABORATOR_ID,
        [
            Privilege.VIEW_ORG_MEMBERSHIP,
            Privilege.VIEW_ORG_SAVED_OPPORTUNITIES,
            Privilege.MODIFY_ORG_SAVED_OPPORTUNITIES,
        ],
    ),
    link_role_types=[
        LinkRoleRoleType(role_id=ORG_COLLABORATOR_ID, role_type=RoleType.ORGANIZATION)
    ],
)

#######################################
# Non-Core Granular Application Roles
#######################################

# These granular roles can be granted organization-wide or per application,
# so they carry both the ORGANIZATION and APPLICATION role types. They are
# is_core=False so they never appear in the organization
# role-management endpoint's selectable list.

VIEW_APPLICATIONS_ID = uuid.UUID("ce52a5ae-704f-42ce-85ae-ce79d2587ea2")
VIEW_APPLICATIONS = Role(
    role_id=VIEW_APPLICATIONS_ID,
    role_name="View Applications",
    is_core=False,
    link_privileges=get_link_privileges(
        VIEW_APPLICATIONS_ID,
        [
            Privilege.VIEW_APPLICATION,
        ],
    ),
    link_role_types=[
        LinkRoleRoleType(role_id=VIEW_APPLICATIONS_ID, role_type=RoleType.ORGANIZATION),
        LinkRoleRoleType(role_id=VIEW_APPLICATIONS_ID, role_type=RoleType.APPLICATION),
    ],
)

MODIFY_APPLICATIONS_ID = uuid.UUID("5a90ec3f-dd41-468d-96f6-9db31ea8610b")
MODIFY_APPLICATIONS = Role(
    role_id=MODIFY_APPLICATIONS_ID,
    role_name="Modify Applications",
    is_core=False,
    link_privileges=get_link_privileges(
        MODIFY_APPLICATIONS_ID,
        [
            Privilege.START_APPLICATION,
            Privilege.MODIFY_APPLICATION,
        ],
    ),
    link_role_types=[
        LinkRoleRoleType(role_id=MODIFY_APPLICATIONS_ID, role_type=RoleType.ORGANIZATION),
        LinkRoleRoleType(role_id=MODIFY_APPLICATIONS_ID, role_type=RoleType.APPLICATION),
    ],
)

SUBMIT_APPLICATIONS_ID = uuid.UUID("40a03a19-c0c2-425e-90aa-63cff3b5d73f")
SUBMIT_APPLICATIONS = Role(
    role_id=SUBMIT_APPLICATIONS_ID,
    role_name="Submit Applications",
    is_core=False,
    link_privileges=get_link_privileges(
        SUBMIT_APPLICATIONS_ID,
        [
            Privilege.SUBMIT_APPLICATION,
        ],
    ),
    link_role_types=[
        LinkRoleRoleType(role_id=SUBMIT_APPLICATIONS_ID, role_type=RoleType.ORGANIZATION),
        LinkRoleRoleType(role_id=SUBMIT_APPLICATIONS_ID, role_type=RoleType.APPLICATION),
    ],
)

# Every organization user has exactly one of these base roles
ORGANIZATION_BASE_ROLE_IDS = frozenset({ORG_ADMIN_ID, ORG_MEMBER_ID, ORG_COLLABORATOR_ID})

GRANULAR_APPLICATION_ROLE_IDS = frozenset(
    {VIEW_APPLICATIONS_ID, MODIFY_APPLICATIONS_ID, SUBMIT_APPLICATIONS_ID}
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

INTERNAL_S3_SCANNER_ROLE_ID = uuid.UUID("49388bd7-c36a-4977-b8e7-bac32c7a8f77")
INTERNAL_S3_SCANNER_ROLE = Role(
    role_id=INTERNAL_S3_SCANNER_ROLE_ID,
    role_name="Internal S3 Scanner",
    is_core=True,
    link_privileges=get_link_privileges(INTERNAL_S3_SCANNER_ROLE_ID, [Privilege.INTERNAL_S3_SCAN]),
    link_role_types=[
        LinkRoleRoleType(role_id=INTERNAL_S3_SCANNER_ROLE_ID, role_type=RoleType.INTERNAL),
    ],
)

E2E_TEST_USER_MANAGER_ROLE_ID = uuid.UUID("b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e")
E2E_TEST_USER_MANAGER_ROLE = Role(
    role_id=E2E_TEST_USER_MANAGER_ROLE_ID,
    role_name="E2E Test User Manager",
    is_core=True,
    link_privileges=get_link_privileges(
        E2E_TEST_USER_MANAGER_ROLE_ID,
        [Privilege.MANAGE_TEST_USER_TOKEN],
    ),
    link_role_types=[
        LinkRoleRoleType(role_id=E2E_TEST_USER_MANAGER_ROLE_ID, role_type=RoleType.INTERNAL),
    ],
)

CORE_ROLES = [
    ORG_ADMIN,
    ORG_MEMBER,
    APPLICATION_OWNER,
    APPLICATION_CONTRIBUTOR,
    E2E_TEST_USER_ROLE,
    LEGACY_AGENCY_S2S_ROLE,
    NAVA_INTERNAL_ROLE,
    INTERNAL_S3_SCANNER_ROLE,
    E2E_TEST_USER_MANAGER_ROLE,
]

NON_CORE_ROLES = [
    ORG_COLLABORATOR,
    VIEW_APPLICATIONS,
    MODIFY_APPLICATIONS,
    SUBMIT_APPLICATIONS,
]

# All statically-defined roles that get synced to the DB
STATIC_ROLES = CORE_ROLES + NON_CORE_ROLES
