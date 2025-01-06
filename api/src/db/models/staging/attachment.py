from sqlalchemy.orm import Mapped, foreign, relationship

from src.db.models.legacy_mixin import synopsis_mixin
from src.db.models.staging.staging_base import StagingBase, StagingParamMixin

from .opportunity import Topportunity


class TsynopsisAttachment(StagingBase, synopsis_mixin.TsynopsisAttachmentMixin, StagingParamMixin):
    __tablename__ = "tsynopsisattachment"

    opportunity: Mapped[Topportunity | None] = relationship(
        Topportunity,
        primaryjoin=lambda: TsynopsisAttachment.opportunity_id
        == foreign(Topportunity.opportunity_id),
        uselist=False,
        overlaps="opportunity",
    )
