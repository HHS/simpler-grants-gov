#
# SQLAlchemy models for foreign tables.
#
# The order of the columns must match the remote Oracle database. The names are not required to
# match by oracle_fdw, but we are matching them for maintainability.
from sqlalchemy import Index

from src.db.models.legacy_mixin import user_mixin
from src.db.models.staging.staging_base import StagingBase, StagingParamMixin


class TuserAccountMapper(StagingBase, user_mixin.TuserAccountMapperMixin, StagingParamMixin):
    __tablename__ = "tuser_account_mapper"


class TuserAccount(StagingBase, user_mixin.TuserAccountMixin, StagingParamMixin):
    __tablename__ = "tuser_account"


class TsubscriptionMixin(StagingBase, user_mixin.TsubscriptionMixin, StagingParamMixin):
    __tablename__ = "tsubscription"


class TsubscriptionSearchMixin(StagingBase, user_mixin.TsubscriptionSearchMixin, StagingParamMixin):
    __tablename__ = "tsubscription_search"


class TsubscriptionOpportunityMixin(
    StagingBase, user_mixin.TsubscriptionOpportunityMixin, StagingParamMixin
):
    __tablename__ = "tsubscription_opportunity"