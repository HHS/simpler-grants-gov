#
# SQLAlchemy models for foreign tables.
#
# The order of the columns must match the remote Oracle database. The names are not required to
# match by oracle_fdw, but we are matching them for maintainability.
#
from src.db.models.legacy_mixin import subscription_mixin

from . import foreignbase


class TsubscriptionMixin(foreignbase.ForeignBase, subscription_mixin.TsubscriptionMixin):
    __tablename__ = "tsubscription"


class TsubscriptionSearchMixin(
    foreignbase.ForeignBase, subscription_mixin.TsubscriptionSearchMixin
):
    __tablename__ = "tsubscription_search"


class TsubscriptionOpportunityMixin(
    foreignbase.ForeignBase, subscription_mixin.TsubscriptionOpportunityMixin
):
    __tablename__ = "tsubscription_opportunity"
