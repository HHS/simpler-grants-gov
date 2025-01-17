import uuid

from enum import StrEnum

from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from src.db.models.base import ApiSchemaTable, TimestampMixin


class JobStatus(StrEnum):
    STARTED = "started"
    COMPLETED = "completed"
    FAILED = "failed"


class JobTable(ApiSchemaTable, TimestampMixin):
    __tablename__ = "job"

    job_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    job_type: Mapped[str]
    job_status: Mapped[str]
