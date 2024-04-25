import src.db.legacy_mixins.opportunity_mixin as opportunity_mixin
from src.db.models.staging.staging_base import StagingBase, StagingParamMixin


class Topportunity(StagingBase, opportunity_mixin.TopportunityMixin, StagingParamMixin):
    __tablename__ = "topportunity"


class TopportunityCfda(StagingBase, opportunity_mixin.TopportunityCfdaMixin, StagingParamMixin):
    __tablename__ = "topportunity_cfda"
