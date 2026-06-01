import uuid
from datetime import datetime

from grants_shared.db.models.base import TimestampMixin
from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.adapters.db.type_decorators.postgres_type_decorators import LookupColumn
from src.db.models.api_schema_table import ApiSchemaTable
from src.db.models.lookup_models import JobStatus, JobType, LkJobStatus, LkJobType


class JobLog(ApiSchemaTable, TimestampMixin):
    __tablename__ = "job_log"

    job_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    job_type: Mapped[str]
    job_status: Mapped[JobStatus] = mapped_column(
        "job_status_id",
        LookupColumn(LkJobStatus),
        ForeignKey(LkJobStatus.job_status_id),
    )
    metrics: Mapped[dict | None] = mapped_column(JSONB)


class JobLock(ApiSchemaTable, TimestampMixin):
    __tablename__ = "job_lock"
    job_lock_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    job_type: Mapped[JobType] = mapped_column(
        "job_type_id",
        LookupColumn(LkJobType),
        ForeignKey(LkJobType.job_type_id),
        unique=True,
    )
    is_locked: Mapped[bool]
    locked_until: Mapped[datetime]
    locked_by: Mapped[uuid.UUID]
