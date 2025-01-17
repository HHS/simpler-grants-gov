import uuid

from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.adapters.db.type_decorators.postgres_type_decorators import LookupColumn
from src.db.models.base import ApiSchemaTable, TimestampMixin
from src.db.models.lookup_models import JobStatus, LkJobStatus


class JobTable(ApiSchemaTable, TimestampMixin):
    __tablename__ = "job"

    job_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    job_type: Mapped[str]
    job_status: Mapped[JobStatus] = mapped_column(
        "job_status_id",
        LookupColumn(LkJobStatus),
        ForeignKey(LkJobStatus.job_status_id),
    )
    metrics: Mapped[dict | None] = mapped_column(JSONB)
