#
# SQLAlchemy models for foreign tables.
#
# The order of the columns must match the remote Oracle database. The names are not required to
# match by oracle_fdw, but we are matching them for maintainability.
#
from sqlalchemy.orm import Mapped, foreign, relationship

from src.db.models.legacy_mixin import opportunity_mixin

from . import foreignbase


class Topportunity(foreignbase.ForeignBase, opportunity_mixin.TopportunityMixin):
    __tablename__ = "topportunity"

    cfdas: Mapped[list["TopportunityCfda"]] = relationship(
        primaryjoin=lambda: Topportunity.opportunity_id == foreign(TopportunityCfda.opportunity_id),
        uselist=True,
    )


class TopportunityCfda(foreignbase.ForeignBase, opportunity_mixin.TopportunityCfdaMixin):
    __tablename__ = "topportunity_cfda"

    opportunity: Mapped[Topportunity | None] = relationship(
        primaryjoin=lambda: TopportunityCfda.opportunity_id == foreign(Topportunity.opportunity_id),
        uselist=False,
    )
