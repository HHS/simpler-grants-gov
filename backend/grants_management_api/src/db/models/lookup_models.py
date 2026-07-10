from grants_shared.db.models.base import TimestampMixin
from grants_shared.db.models.lookup import (
    Lookup,
    LookupConfig,
    LookupRegistry,
    LookupStr,
    LookupTable,
)
from sqlalchemy.orm import Mapped, mapped_column

from src.constants.lookup_constants import ExternalUserType, MgmtUserType
from src.db.models.grantor_schema_table import GrantorSchemaTable

#######################################################
# LookupConfig mappings
#
# Put all mappings of lookup values to their DB integer
# representations in this section
#######################################################

MGMT_USER_TYPE_CONFIG: LookupConfig[MgmtUserType] = LookupConfig(
    [
        LookupStr(MgmtUserType.STANDARD, 1),
        LookupStr(MgmtUserType.INTERNAL_FRONTEND, 2),
    ]
)

EXTERNAL_USER_TYPE_CONFIG: LookupConfig[ExternalUserType] = LookupConfig(
    [LookupStr(ExternalUserType.LOGIN_GOV, 1)]
)

#######################################################
# GrantorLookupTable
#
# Base table that all lookup tables are derived from
#######################################################


class GrantorLookupTable(LookupTable, GrantorSchemaTable):
    """
    Base lookup table class that includes the GrantorSchemasTable as well
    so that the tables end up in the grantor schema.
    """

    __abstract__ = True


#######################################################
# Lookup Tables
#
# Put all lookup table definitions in this section and
# connect them to the lookup configurations defined above
#######################################################


@LookupRegistry.register_lookup(MGMT_USER_TYPE_CONFIG)
class LkMgmtUserType(GrantorLookupTable, TimestampMixin):
    __tablename__ = "lk_mgmt_user_type"

    mgmt_user_type_id: Mapped[int] = mapped_column(primary_key=True)
    description: Mapped[str]

    @classmethod
    def from_lookup(cls, lookup: Lookup) -> LkMgmtUserType:
        return LkMgmtUserType(
            mgmt_user_type_id=lookup.lookup_val, description=lookup.get_description()
        )


@LookupRegistry.register_lookup(EXTERNAL_USER_TYPE_CONFIG)
class LkExternalUserType(GrantorLookupTable, TimestampMixin):
    __tablename__ = "lk_external_user_type"

    external_user_type_id: Mapped[int] = mapped_column(primary_key=True)
    description: Mapped[str]

    @classmethod
    def from_lookup(cls, lookup: Lookup) -> LkExternalUserType:
        return LkExternalUserType(
            external_user_type_id=lookup.lookup_val, description=lookup.get_description()
        )
