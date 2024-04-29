from src.db.legacy_mixin import synopsis_mixin
from src.db.models.staging.staging_base import StagingBase, StagingParamMixin


class Tsynopsis(StagingBase, synopsis_mixin.TsynopsisMixin, StagingParamMixin):
    __tablename__ = "tsynopsis"


class TsynopsisHist(StagingBase, synopsis_mixin.TsynopsisHistMixin, StagingParamMixin):
    __tablename__ = "tsynopsis_hist"


class TapplicanttypesSynopsis(
    StagingBase, synopsis_mixin.TapplicanttypesSynopsisMixin, StagingParamMixin
):
    __tablename__ = "tapplicanttypes_synopsis"


class TapplicanttypesSynopsisHist(
    StagingBase, synopsis_mixin.TapplicanttypesSynopsisHistMixin, StagingParamMixin
):
    __tablename__ = "tapplicanttypes_synopsis_hist"


class TfundactcatSynopsis(StagingBase, synopsis_mixin.TfundactcatSynopsisMixin, StagingParamMixin):
    __tablename__ = "tfundactcat_synopsis"


class TfundactcatSynopsisHist(
    StagingBase, synopsis_mixin.TfundactcatSynopsisHistMixin, StagingParamMixin
):
    __tablename__ = "tfundactcat_synopsis_hist"


class TfundinstrSynopsis(StagingBase, synopsis_mixin.TfundinstrSynopsisMixin, StagingParamMixin):
    __tablename__ = "tfundinstr_synopsis"


class TfundinstrSynopsisHist(
    StagingBase, synopsis_mixin.TfundinstrSynopsisHistMixin, StagingParamMixin
):
    __tablename__ = "tfundinstr_synopsis_hist"
