from src.db.legacy_mixin import tgroups_mixin
from src.db.models.staging.staging_base import StagingBase, StagingParamMixin


class Tgroups(StagingBase, tgroups_mixin.TGroupsMixin, StagingParamMixin):
    __tablename__ = "tgroups"
