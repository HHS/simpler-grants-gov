import uuid

from sqlalchemy import text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.db.models.legacy_mixin.certificates_mixin import TcertificatesMixin
from src.db.models.staging.staging_base import StagingBase, StagingParamMixin


class Tcertificates(StagingBase, TcertificatesMixin, StagingParamMixin):
    __tablename__ = "tcertificates"

    tcertificates_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID, server_default=text("gen_random_uuid()"), unique=True
    )
