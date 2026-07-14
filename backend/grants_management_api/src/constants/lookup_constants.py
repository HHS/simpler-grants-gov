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
