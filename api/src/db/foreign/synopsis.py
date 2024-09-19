#
# SQLAlchemy models for foreign tables.
#
# The order of the columns must match the remote Oracle database. The names are not required to
# match by oracle_fdw, but we are matching them for maintainability.
#
from sqlalchemy import and_
from sqlalchemy.orm import Mapped, foreign, relationship

from src.db.legacy_mixin import synopsis_mixin

from . import foreignbase
from .opportunity import Topportunity


class Tsynopsis(foreignbase.ForeignBase, synopsis_mixin.TsynopsisMixin):
    __tablename__ = "tsynopsis"

    opportunity: Mapped[Topportunity | None] = relationship(
        Topportunity,
        primaryjoin=lambda: Tsynopsis.opportunity_id == foreign(Topportunity.opportunity_id),
        uselist=False,
        overlaps="opportunity",
    )


class TsynopsisHist(foreignbase.ForeignBase, synopsis_mixin.TsynopsisHistMixin):
    __tablename__ = "tsynopsis_hist"

    opportunity: Mapped[Topportunity | None] = relationship(
        Topportunity,
        primaryjoin=lambda: TsynopsisHist.opportunity_id == foreign(Topportunity.opportunity_id),
        uselist=False,
        overlaps="opportunity",
    )


class TapplicanttypesSynopsis(foreignbase.ForeignBase, synopsis_mixin.TapplicanttypesSynopsisMixin):
    __tablename__ = "tapplicanttypes_synopsis"

    synopsis: Mapped[Tsynopsis | None] = relationship(
        Tsynopsis,
        primaryjoin=lambda: TapplicanttypesSynopsis.opportunity_id
        == foreign(Tsynopsis.opportunity_id),
        uselist=False,
        overlaps="synopsis",
    )


class TapplicanttypesSynopsisHist(
    foreignbase.ForeignBase, synopsis_mixin.TapplicanttypesSynopsisHistMixin
):
    __tablename__ = "tapplicanttypes_synopsis_hist"

    synopsis: Mapped[TsynopsisHist | None] = relationship(
        TsynopsisHist,
        primaryjoin=lambda: and_(
            TapplicanttypesSynopsisHist.opportunity_id == foreign(TsynopsisHist.opportunity_id),
            TapplicanttypesSynopsisHist.revision_number == foreign(TsynopsisHist.revision_number),
        ),
        uselist=False,
        overlaps="synopsis",
    )


class TfundactcatSynopsis(foreignbase.ForeignBase, synopsis_mixin.TfundactcatSynopsisMixin):
    __tablename__ = "tfundactcat_synopsis"

    synopsis: Mapped[Tsynopsis | None] = relationship(
        Tsynopsis,
        primaryjoin=lambda: TfundactcatSynopsis.opportunity_id == foreign(Tsynopsis.opportunity_id),
        uselist=False,
        overlaps="synopsis",
    )


class TfundactcatSynopsisHist(foreignbase.ForeignBase, synopsis_mixin.TfundactcatSynopsisHistMixin):
    __tablename__ = "tfundactcat_synopsis_hist"

    synopsis: Mapped[TsynopsisHist | None] = relationship(
        TsynopsisHist,
        primaryjoin=lambda: and_(
            TfundactcatSynopsisHist.opportunity_id == foreign(TsynopsisHist.opportunity_id),
            TfundactcatSynopsisHist.revision_number == foreign(TsynopsisHist.revision_number),
        ),
        uselist=False,
        overlaps="synopsis",
    )


class TfundinstrSynopsis(foreignbase.ForeignBase, synopsis_mixin.TfundinstrSynopsisMixin):
    __tablename__ = "tfundinstr_synopsis"

    synopsis: Mapped[Tsynopsis | None] = relationship(
        Tsynopsis,
        primaryjoin=lambda: TfundinstrSynopsis.opportunity_id == foreign(Tsynopsis.opportunity_id),
        uselist=False,
        overlaps="synopsis",
    )


class TfundinstrSynopsisHist(foreignbase.ForeignBase, synopsis_mixin.TfundinstrSynopsisHistMixin):
    __tablename__ = "tfundinstr_synopsis_hist"

    synopsis: Mapped[TsynopsisHist | None] = relationship(
        TsynopsisHist,
        primaryjoin=lambda: and_(
            TfundinstrSynopsisHist.opportunity_id == foreign(TsynopsisHist.opportunity_id),
            TfundinstrSynopsisHist.revision_number == foreign(TsynopsisHist.revision_number),
        ),
        uselist=False,
        overlaps="synopsis",
    )
