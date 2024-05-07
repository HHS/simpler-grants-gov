from sqlalchemy.orm import Mapped, relationship

from src.db.legacy_mixin import synopsis_mixin
from src.db.models.staging.staging_base import StagingBase, StagingParamMixin

from .opportunity import Topportunity


class Tsynopsis(StagingBase, synopsis_mixin.TsynopsisMixin, StagingParamMixin):
    __tablename__ = "tsynopsis"

    opportunity: Mapped[Topportunity | None] = relationship(
        Topportunity,
        primaryjoin="Tsynopsis.opportunity_id == foreign(Topportunity.opportunity_id)",
        uselist=False,
        overlaps="opportunity",
    )

    @property
    def is_forecast(self) -> bool:
        return False


class TsynopsisHist(StagingBase, synopsis_mixin.TsynopsisHistMixin, StagingParamMixin):
    __tablename__ = "tsynopsis_hist"

    opportunity: Mapped[Topportunity | None] = relationship(
        Topportunity,
        primaryjoin="TsynopsisHist.opportunity_id == foreign(Topportunity.opportunity_id)",
        uselist=False,
        overlaps="opportunity",
    )

    @property
    def is_forecast(self) -> bool:
        return False


class TapplicanttypesSynopsis(
    StagingBase, synopsis_mixin.TapplicanttypesSynopsisMixin, StagingParamMixin
):
    __tablename__ = "tapplicanttypes_synopsis"

    synopsis: Mapped[Tsynopsis | None] = relationship(
        Tsynopsis,
        primaryjoin="TapplicanttypesSynopsis.opportunity_id == foreign(Tsynopsis.opportunity_id)",
        uselist=False,
        overlaps="synopsis",
    )


class TapplicanttypesSynopsisHist(
    StagingBase, synopsis_mixin.TapplicanttypesSynopsisHistMixin, StagingParamMixin
):
    __tablename__ = "tapplicanttypes_synopsis_hist"

    synopsis: Mapped[TsynopsisHist | None] = relationship(
        TsynopsisHist,
        primaryjoin="and_(TapplicanttypesSynopsisHist.opportunity_id == foreign(TsynopsisHist.opportunity_id), TapplicanttypesSynopsisHist.revision_number == foreign(TsynopsisHist.revision_number))",
        uselist=False,
        overlaps="synopsis",
    )


class TfundactcatSynopsis(StagingBase, synopsis_mixin.TfundactcatSynopsisMixin, StagingParamMixin):
    __tablename__ = "tfundactcat_synopsis"

    synopsis: Mapped[Tsynopsis | None] = relationship(
        Tsynopsis,
        primaryjoin="TfundactcatSynopsis.opportunity_id == foreign(Tsynopsis.opportunity_id)",
        uselist=False,
        overlaps="synopsis",
    )


class TfundactcatSynopsisHist(
    StagingBase, synopsis_mixin.TfundactcatSynopsisHistMixin, StagingParamMixin
):
    __tablename__ = "tfundactcat_synopsis_hist"

    synopsis: Mapped[TsynopsisHist | None] = relationship(
        TsynopsisHist,
        primaryjoin="and_(TfundactcatSynopsisHist.opportunity_id == foreign(TsynopsisHist.opportunity_id), TfundactcatSynopsisHist.revision_number == foreign(TsynopsisHist.revision_number))",
        uselist=False,
        overlaps="synopsis",
    )


class TfundinstrSynopsis(StagingBase, synopsis_mixin.TfundinstrSynopsisMixin, StagingParamMixin):
    __tablename__ = "tfundinstr_synopsis"

    synopsis: Mapped[Tsynopsis | None] = relationship(
        Tsynopsis,
        primaryjoin="TfundinstrSynopsis.opportunity_id == foreign(Tsynopsis.opportunity_id)",
        uselist=False,
        overlaps="synopsis",
    )


class TfundinstrSynopsisHist(
    StagingBase, synopsis_mixin.TfundinstrSynopsisHistMixin, StagingParamMixin
):
    __tablename__ = "tfundinstr_synopsis_hist"

    synopsis: Mapped[TsynopsisHist | None] = relationship(
        TsynopsisHist,
        primaryjoin="and_(TfundinstrSynopsisHist.opportunity_id == foreign(TsynopsisHist.opportunity_id), TfundinstrSynopsisHist.revision_number == foreign(TsynopsisHist.revision_number))",
        uselist=False,
        overlaps="synopsis",
    )
