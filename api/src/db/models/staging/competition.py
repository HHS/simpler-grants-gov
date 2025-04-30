from src.db.models.legacy_mixin import competition_mixin
from src.db.models.staging.staging_base import StagingBase, StagingParamMixin


class Tcompetition(StagingBase, competition_mixin.TcompetitionMixin, StagingParamMixin):
    __tablename__ = "tcompetition"
