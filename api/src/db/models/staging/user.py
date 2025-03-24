#
# SQLAlchemy models for foreign tables.
#
# The order of the columns must match the remote Oracle database. The names are not required to
# match by oracle_fdw, but we are matching them for maintainability.

from src.db.models.legacy_mixin import user_mixin
from src.db.models.staging.staging_base import StagingBase, StagingParamMixin


class TuserAccountMapper(StagingBase, user_mixin.TuserAccountMapperMixin, StagingParamMixin):
    __tablename__ = "tuser_account_mapper"


class TuserAccount(StagingBase, user_mixin.TuserAccountMixin, StagingParamMixin):
    __tablename__ = "tuser_account"
