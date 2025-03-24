#
# SQLAlchemy models for foreign tables.
#
# The order of the columns must match the remote Oracle database. The names are not required to
# match by oracle_fdw, but we are matching them for maintainability.
#
from src.db.models.legacy_mixin import subscription_mixin
from src.db.models.staging.staging_base import StagingBase, StagingParamMixin


class TsubscriptionMixin(StagingBase, subscription_mixin.TsubscriptionMixin, StagingParamMixin):
    __tablename__ = "tsubscription"


class TsubscriptionSearchMixin(
    StagingBase, subscription_mixin.TsubscriptionSearchMixin, StagingParamMixin
):
    __tablename__ = "tsubscription_search"


class TsubscriptionOpportunityMixin(
    StagingBase, subscription_mixin.TsubscriptionOpportunityMixin, StagingParamMixin
):
    __tablename__ = "tsubscription_opportunity"
