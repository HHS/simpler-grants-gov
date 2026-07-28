import uuid

from src.constants.lookup_constants import MgmtPrivilege, MgmtResourceType
from src.util.role_util import build_role

############################
# Core Department Roles
############################

DEPARTMENT_ADMIN = build_role(
    role_id=uuid.UUID("850f238f-d399-48e5-ab79-c341964126d7"),
    role_name="Department Admin",
    privileges={
        MgmtPrivilege.VIEW_DEPARTMENT,
        MgmtPrivilege.UPDATE_DEPARTMENT,
        MgmtPrivilege.MANAGE_DEPARTMENT_MEMBERS,
        MgmtPrivilege.VIEW_SUBAGENCY,
        MgmtPrivilege.UPDATE_SUBAGENCY,
        MgmtPrivilege.MANAGE_SUBAGENCY_MEMBERS,
        MgmtPrivilege.VIEW_TEAM,
        MgmtPrivilege.UPDATE_TEAM,
        MgmtPrivilege.MANAGE_TEAM_MEMBERS,
        MgmtPrivilege.CREATE_TEAM,
        MgmtPrivilege.DELETE_TEAM,
    },
    resource_types={MgmtResourceType.DEPARTMENT},
)

DEPARTMENT_VIEWER = build_role(
    role_id=uuid.UUID("3a312190-b060-476f-ae70-358c7b078322"),
    role_name="Department Viewer",
    privileges={
        MgmtPrivilege.VIEW_DEPARTMENT,
        MgmtPrivilege.VIEW_SUBAGENCY,
        MgmtPrivilege.VIEW_TEAM,
    },
    resource_types={MgmtResourceType.DEPARTMENT},
)

############################
# Core Subagency Roles
############################

SUBAGENCY_ADMIN = build_role(
    role_id=uuid.UUID("6721de69-de16-49d1-beb0-1b147539d8dd"),
    role_name="Subagency Admin",
    privileges={
        MgmtPrivilege.VIEW_SUBAGENCY,
        MgmtPrivilege.UPDATE_SUBAGENCY,
        MgmtPrivilege.MANAGE_SUBAGENCY_MEMBERS,
        MgmtPrivilege.VIEW_TEAM,
        MgmtPrivilege.UPDATE_TEAM,
        MgmtPrivilege.MANAGE_TEAM_MEMBERS,
        MgmtPrivilege.CREATE_TEAM,
        MgmtPrivilege.DELETE_TEAM,
    },
    resource_types={MgmtResourceType.SUBAGENCY},
)

SUBAGENCY_VIEWER = build_role(
    role_id=uuid.UUID("1840dea7-273e-4cff-8e16-764856c14232"),
    role_name="Subagency Viewer",
    privileges={
        MgmtPrivilege.VIEW_SUBAGENCY,
        MgmtPrivilege.VIEW_TEAM,
    },
    resource_types={MgmtResourceType.SUBAGENCY},
)

############################
# Core Team Roles
############################

TEAM_ADMIN = build_role(
    role_id=uuid.UUID("5f50c493-9db6-45ce-b9ac-11f02a144f6d"),
    role_name="Team Admin",
    privileges={
        MgmtPrivilege.VIEW_TEAM,
        MgmtPrivilege.UPDATE_TEAM,
        MgmtPrivilege.MANAGE_TEAM_MEMBERS,
    },
    resource_types={MgmtResourceType.TEAM},
)

TEAM_VIEWER = build_role(
    role_id=uuid.UUID("93783b62-2b62-4f3f-a2b4-d026eed253d2"),
    role_name="Team Viewer",
    privileges={
        MgmtPrivilege.VIEW_TEAM,
    },
    resource_types={MgmtResourceType.TEAM},
)

TEAM_USER_MANAGER = build_role(
    role_id=uuid.UUID("d045fcf0-de20-46b7-b12c-1f38cdfeb0ab"),
    role_name="Team User Manager",
    privileges={
        MgmtPrivilege.VIEW_TEAM,
        MgmtPrivilege.MANAGE_TEAM_MEMBERS,
    },
    resource_types={MgmtResourceType.TEAM},
)

# Our sync logic grabs this list to sync to the DB.
CORE_ROLES = [
    DEPARTMENT_ADMIN,
    DEPARTMENT_VIEWER,
    SUBAGENCY_ADMIN,
    SUBAGENCY_VIEWER,
    TEAM_ADMIN,
    TEAM_VIEWER,
    TEAM_USER_MANAGER,
]
