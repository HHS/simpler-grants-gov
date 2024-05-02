from sqlalchemy.orm import Mapped, relationship

from src.db.legacy_mixin import opportunity_mixin
from src.db.models.staging.staging_base import StagingBase, StagingParamMixin


class Topportunity(StagingBase, opportunity_mixin.TopportunityMixin, StagingParamMixin):
    __tablename__ = "topportunity"

    cfdas: Mapped[list["TopportunityCfda"]] = relationship(
        primaryjoin="Topportunity.opportunity_id == foreign(TopportunityCfda.opportunity_id)",
        uselist=True,
    )

    # synopsis: Mapped[Tsynopsis] = relationship(primaryjoin="Topportunity.opportunity_id == foreign(Tsynopsis.opportunity_id)", uselist=False)


class TopportunityCfda(StagingBase, opportunity_mixin.TopportunityCfdaMixin, StagingParamMixin):
    __tablename__ = "topportunity_cfda"

    opportunity: Mapped[Topportunity | None] = relationship(
        primaryjoin="TopportunityCfda.opportunity_id == foreign(Topportunity.opportunity_id)",
        uselist=False,
    )
