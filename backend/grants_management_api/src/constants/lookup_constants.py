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
