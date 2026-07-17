import uuid

from src.constants.lookup_constants import (
    ALLOWED_RESOURCES_FOR_PRIVILEGE,
    MgmtPrivilege,
    MgmtResourceType,
)
from src.db.models.resource_models import MgmtLinkRolePrivilege, MgmtLinkRoleResourceType, MgmtRole


def build_role(
    role_id: uuid.UUID,
    role_name: str,
    privileges: set[MgmtPrivilege],
    resource_types: set[MgmtResourceType],
) -> MgmtRole:
    """Build a core role, validating that every privilege can be assigned at the role's resource types.

    A privilege may only be included in a role when the role's resource types are a subset of the
    resource types the privilege is allowed at (see ALLOWED_RESOURCES_FOR_PRIVILEGE). This prevents
    us from, for example, granting a department-only privilege on a team-level role.

    The association proxy relationships (`privileges` and `resource_types`) are not set up during
    object initialization, so we explicitly build the underlying `link_privileges` and
    `link_role_resource_types` relationships to ensure proper linkage and persistence.
    """
    link_privileges = []
    for privilege in privileges:
        allowed_resource_types = ALLOWED_RESOURCES_FOR_PRIVILEGE.get(privilege)
        if allowed_resource_types is None:
            raise ValueError(
                f"Cannot build role `{role_name}`: privilege `{privilege}` is missing from "
                "ALLOWED_RESOURCES_FOR_PRIVILEGE"
            )

        extra_resource_types = resource_types - allowed_resource_types
        if extra_resource_types:
            raise ValueError(
                f"Cannot build role `{role_name}`: privilege `{privilege}` is not allowed at "
                f"resource type(s): {','.join(sorted(extra_resource_types))}"
            )

        link_privileges.append(
            MgmtLinkRolePrivilege(mgmt_role_id=role_id, mgmt_privilege=privilege)
        )

    return MgmtRole(
        mgmt_role_id=role_id,
        role_name=role_name,
        is_core=True,
        link_privileges=link_privileges,
        link_role_resource_types=[
            MgmtLinkRoleResourceType(mgmt_role_id=role_id, mgmt_resource_type=resource_type)
            for resource_type in resource_types
        ],
    )


############################
# Core Department Roles
############################

DEPARTMENT_ADMIN_ID = uuid.UUID("850f238f-d399-48e5-ab79-c341964126d7")
DEPARTMENT_ADMIN = build_role(
    role_id=DEPARTMENT_ADMIN_ID,
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

DEPARTMENT_VIEWER_ID = uuid.UUID("3a312190-b060-476f-ae70-358c7b078322")
DEPARTMENT_VIEWER = build_role(
    role_id=DEPARTMENT_VIEWER_ID,
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

SUBAGENCY_ADMIN_ID = uuid.UUID("6721de69-de16-49d1-beb0-1b147539d8dd")
SUBAGENCY_ADMIN = build_role(
    role_id=SUBAGENCY_ADMIN_ID,
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

SUBAGENCY_VIEWER_ID = uuid.UUID("1840dea7-273e-4cff-8e16-764856c14232")
SUBAGENCY_VIEWER = build_role(
    role_id=SUBAGENCY_VIEWER_ID,
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

TEAM_ADMIN_ID = uuid.UUID("5f50c493-9db6-45ce-b9ac-11f02a144f6d")
TEAM_ADMIN = build_role(
    role_id=TEAM_ADMIN_ID,
    role_name="Team Admin",
    privileges={
        MgmtPrivilege.VIEW_TEAM,
        MgmtPrivilege.UPDATE_TEAM,
        MgmtPrivilege.MANAGE_TEAM_MEMBERS,
    },
    resource_types={MgmtResourceType.TEAM},
)

TEAM_VIEWER_ID = uuid.UUID("93783b62-2b62-4f3f-a2b4-d026eed253d2")
TEAM_VIEWER = build_role(
    role_id=TEAM_VIEWER_ID,
    role_name="Team Viewer",
    privileges={
        MgmtPrivilege.VIEW_TEAM,
    },
    resource_types={MgmtResourceType.TEAM},
)

TEAM_USER_MANAGER_ID = uuid.UUID("d045fcf0-de20-46b7-b12c-1f38cdfeb0ab")
TEAM_USER_MANAGER = build_role(
    role_id=TEAM_USER_MANAGER_ID,
    role_name="Team User Manager",
    privileges={
        MgmtPrivilege.VIEW_TEAM,
        MgmtPrivilege.MANAGE_TEAM_MEMBERS,
    },
    resource_types={MgmtResourceType.TEAM},
)

# Our sync logic grabs this list to sync to the DB.
# Note: "Team Contributor" is intentionally not a role - it describes what most other
# team-level roles we build later will roughly look like (see the tech spec).
CORE_ROLES = [
    DEPARTMENT_ADMIN,
    DEPARTMENT_VIEWER,
    SUBAGENCY_ADMIN,
    SUBAGENCY_VIEWER,
    TEAM_ADMIN,
    TEAM_VIEWER,
    TEAM_USER_MANAGER,
]
