import uuid

from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.models.base import ApiSchemaTable, TimestampMixin


class ApplicationSubmissionRetrieved(ApiSchemaTable, TimestampMixin):
    __tablename__ = "application_submission_retrieved"

    application_submission_retrieved_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    application_submission_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey("api.application_submission.application_submission_id"), nullable=False
    )
    created_by_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey("api.user.user_id"), nullable=False
    )
    modified_by_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey("api.user.user_id"), nullable=False
    )

    application_submission = relationship("ApplicationSubmission")
    created_by_user = relationship("User", foreign_keys=[created_by_user_id])
    modified_by_user = relationship("User", foreign_keys=[modified_by_user_id])
