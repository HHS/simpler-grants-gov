from src.db.models.legacy_mixin import synopsis_mixin
from src.db.models.staging.staging_base import StagingBase, StagingParamMixin
from .opportunity import Topportunity
from sqlalchemy.orm import Mapped, relationship


class TsynopsisAttachment(StagingBase, synopsis_mixin.TsynopsisAttachmentMixin, StagingParamMixin):
    __tablename__ = "tsynopsisattachment"

    opportunity: Mapped[Topportunity | None] = relationship(
        Topportunity,
        primaryjoin="TsynopsisAttachment.opportunity_id == foreign(Topportunity.opportunity_id)",
        uselist=False,
        overlaps="opportunity",
    )