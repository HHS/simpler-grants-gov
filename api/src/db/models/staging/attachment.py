from src.db.models.legacy_mixin import synopsis_mixin
from src.db.models.staging.staging_base import StagingBase, StagingParamMixin


class TsynopsisAttachment(StagingBase, synopsis_mixin.TsynopsisAttachmentMixin, StagingParamMixin):
    __tablename__ = "tsynopsis_attachment"
