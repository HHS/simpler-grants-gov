#
# SQLAlchemy models for foreign tables.
#
# The order of the columns must match the remote Oracle database. The names are not required to
# match by oracle_fdw, but we are matching them for maintainability.

from src.db.models.legacy_mixin import user_mixin

from . import foreignbase


class TuserAccountMapper(foreignbase.ForeignBase, user_mixin.TuserAccountMapperMixin):
    __tablename__ = "tuser_account_mapper"


class TuserAccount(foreignbase.ForeignBase, user_mixin.TuserAccountMixin):
    __tablename__ = "tuser_account"


class TsubscriptionMixin(foreignbase.ForeignBase, user_mixin.TsubscriptionMixin):
    __tablename__ = "tsubscription"


class TsubscriptionSearchMixin(foreignbase.ForeignBase, user_mixin.TsubscriptionSearchMixin):
    __tablename__ = "tsubscription_search"


class TsubscriptionOpportunityMixin(
    foreignbase.ForeignBase, user_mixin.TsubscriptionOpportunityMixin
):
    __tablename__ = "tsubscription_opportunity"
