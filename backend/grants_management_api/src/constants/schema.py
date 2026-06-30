from enum import StrEnum


class Schemas(StrEnum):
    # Database schemas
    # NOTE - this must match the ALL_DB_SCHEMAS environment variable
    #        in local.env and in our terraform.
    GRANTOR = "grantor"
    STAGING = "staging"
    LEGACY = "legacy"
