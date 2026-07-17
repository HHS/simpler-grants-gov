from enum import StrEnum


class JobType(StrEnum):
    MIGRATE_UP = "migrate-up"
    MIGRATE_DOWN = "migrate-down"
    MIGRATE_DOWNALL = "migrate-downall"


class MgmtUserType(StrEnum):
    STANDARD = "standard"
    INTERNAL_FRONTEND = "internal_frontend"


class ExternalUserType(StrEnum):
    LOGIN_GOV = "login_gov"


class MgmtPrivilege(StrEnum):
    VIEW_DEPARTMENT = "view_department"
    UPDATE_DEPARTMENT = "update_department"
    MANAGE_DEPARTMENT_MEMBERS = "manage_department_members"

    VIEW_SUBAGENCY = "view_subagency"
    UPDATE_SUBAGENCY = "update_subagency"
    MANAGE_SUBAGENCY_MEMBERS = "manage_subagency_members"

    VIEW_TEAM = "view_team"
    UPDATE_TEAM = "update_team"
    MANAGE_TEAM_MEMBERS = "manage_team_members"
    CREATE_TEAM = "create_team"
    DELETE_TEAM = "delete_team"


class MgmtResourceType(StrEnum):
    INTERNAL = "internal"
    DEPARTMENT = "department"
    SUBAGENCY = "subagency"
    TEAM = "team"
    OPPORTUNITY = "opportunity"


# The resource types each privilege is allowed to be assigned at. A privilege may only be
# included in a role when the role's resource types are a subset of the privilege's allowed
# resource types (validated in src/constants/static_role_values.py::build_role). This prevents
# assigning, for example, a department-only privilege on a team-level role.
ALLOWED_RESOURCES_FOR_PRIVILEGE: dict[MgmtPrivilege, set[MgmtResourceType]] = {
    MgmtPrivilege.VIEW_DEPARTMENT: {MgmtResourceType.DEPARTMENT},
    MgmtPrivilege.UPDATE_DEPARTMENT: {MgmtResourceType.DEPARTMENT},
    MgmtPrivilege.MANAGE_DEPARTMENT_MEMBERS: {MgmtResourceType.DEPARTMENT},
    MgmtPrivilege.VIEW_SUBAGENCY: {MgmtResourceType.DEPARTMENT, MgmtResourceType.SUBAGENCY},
    MgmtPrivilege.UPDATE_SUBAGENCY: {MgmtResourceType.DEPARTMENT, MgmtResourceType.SUBAGENCY},
    MgmtPrivilege.MANAGE_SUBAGENCY_MEMBERS: {
        MgmtResourceType.DEPARTMENT,
        MgmtResourceType.SUBAGENCY,
    },
    MgmtPrivilege.VIEW_TEAM: {
        MgmtResourceType.DEPARTMENT,
        MgmtResourceType.SUBAGENCY,
        MgmtResourceType.TEAM,
    },
    MgmtPrivilege.MANAGE_TEAM_MEMBERS: {
        MgmtResourceType.DEPARTMENT,
        MgmtResourceType.SUBAGENCY,
        MgmtResourceType.TEAM,
    },
    MgmtPrivilege.UPDATE_TEAM: {
        MgmtResourceType.DEPARTMENT,
        MgmtResourceType.SUBAGENCY,
        MgmtResourceType.TEAM,
    },
    MgmtPrivilege.CREATE_TEAM: {MgmtResourceType.DEPARTMENT, MgmtResourceType.SUBAGENCY},
    MgmtPrivilege.DELETE_TEAM: {MgmtResourceType.DEPARTMENT, MgmtResourceType.SUBAGENCY},
}
