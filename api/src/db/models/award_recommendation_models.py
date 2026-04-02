from __future__ import annotations

import uuid
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.adapters.db.type_decorators.postgres_type_decorators import LookupColumn
from src.constants.lookup_constants import (
    AwardRecommendationAttachmentType,
    AwardRecommendationAuditEvent,
    AwardRecommendationReviewType,
    AwardRecommendationRiskType,
    AwardRecommendationStatus,
    AwardRecommendationType,
    AwardSelectionMethod,
)
from src.db.models.base import ApiSchemaTable, TimestampMixin
from src.db.models.lookup_models import (
    LkAwardRecommendationAttachmentType,
    LkAwardRecommendationAuditEvent,
    LkAwardRecommendationReviewType,
    LkAwardRecommendationRiskType,
    LkAwardRecommendationStatus,
    LkAwardRecommendationType,
    LkAwardSelectionMethod,
)
from src.db.models.user_models import User
from src.db.models.workflow_models import Workflow, WorkflowApproval
from src.util.file_util import pre_sign_file_location

if TYPE_CHECKING:
    from src.db.models.competition_models import ApplicationSubmission
    from src.db.models.opportunity_models import Opportunity


class AwardRecommendation(ApiSchemaTable, TimestampMixin):
    __tablename__ = "award_recommendation"

    award_recommendation_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    opportunity_id: Mapped[uuid.UUID] = mapped_column(
        UUID,
        ForeignKey("api.opportunity.opportunity_id"),
        index=True,
    )
    opportunity: Mapped[Opportunity] = relationship(
        "Opportunity", back_populates="award_recommendations"
    )
    award_recommendation_number: Mapped[str] = mapped_column(index=True)
    award_recommendation_status: Mapped[AwardRecommendationStatus] = mapped_column(
        "award_recommendation_status_id",
        LookupColumn(LkAwardRecommendationStatus),
        ForeignKey(LkAwardRecommendationStatus.award_recommendation_status_id),
        default=AwardRecommendationStatus.DRAFT,
    )
    additional_info: Mapped[str | None]
    award_selection_method: Mapped[AwardSelectionMethod | None] = mapped_column(
        "award_selection_method_id",
        LookupColumn(LkAwardSelectionMethod),
        ForeignKey(LkAwardSelectionMethod.award_selection_method_id),
    )
    selection_method_detail: Mapped[str | None]
    other_key_information: Mapped[str | None]

    is_deleted: Mapped[bool] = mapped_column(default=False)

    review_workflow_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID, ForeignKey("api.workflow.workflow_id")
    )
    review_workflow: Mapped[Workflow | None] = relationship(Workflow)

    award_recommendation_application_submissions: Mapped[
        list[AwardRecommendationApplicationSubmission]
    ] = relationship(
        back_populates="award_recommendation",
        uselist=True,
        cascade="all, delete-orphan",
    )
    award_recommendation_attachments: Mapped[list[AwardRecommendationAttachment]] = relationship(
        "AwardRecommendationAttachment",
        back_populates="award_recommendation",
        uselist=True,
        cascade="all, delete-orphan",
    )
    award_recommendation_risks: Mapped[list[AwardRecommendationRisk]] = relationship(
        "AwardRecommendationRisk",
        back_populates="award_recommendation",
        uselist=True,
        cascade="all, delete-orphan",
    )
    award_recommendation_reviews: Mapped[list[AwardRecommendationReview]] = relationship(
        back_populates="award_recommendation",
        uselist=True,
        cascade="all, delete-orphan",
    )
    award_recommendation_audit_events: Mapped[list[AwardRecommendationAudit]] = relationship(
        back_populates="award_recommendation",
        uselist=True,
        cascade="all, delete-orphan",
    )


class AwardRecommendationAttachment(ApiSchemaTable, TimestampMixin):
    __tablename__ = "award_recommendation_attachment"

    award_recommendation_attachment_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    award_recommendation_id: Mapped[uuid.UUID] = mapped_column(
        UUID,
        ForeignKey(AwardRecommendation.award_recommendation_id),
        index=True,
    )
    award_recommendation: Mapped[AwardRecommendation] = relationship(
        AwardRecommendation, back_populates="award_recommendation_attachments"
    )
    file_location: Mapped[str]
    file_name: Mapped[str]
    award_recommendation_attachment_type: Mapped[AwardRecommendationAttachmentType] = mapped_column(
        "award_recommendation_attachment_type_id",
        LookupColumn(LkAwardRecommendationAttachmentType),
        ForeignKey(LkAwardRecommendationAttachmentType.award_recommendation_attachment_type_id),
    )
    uploading_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID,
        ForeignKey("api.user.user_id"),
    )
    uploading_user: Mapped[User] = relationship(User)
    is_deleted: Mapped[bool] = mapped_column(default=False)

    @property
    def download_path(self) -> str:
        return pre_sign_file_location(self.file_location)


class AwardRecommendationRisk(ApiSchemaTable, TimestampMixin):
    __tablename__ = "award_recommendation_risk"

    award_recommendation_risk_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    award_recommendation_id: Mapped[uuid.UUID] = mapped_column(
        UUID,
        ForeignKey(AwardRecommendation.award_recommendation_id),
        index=True,
    )
    award_recommendation: Mapped[AwardRecommendation] = relationship(
        AwardRecommendation, back_populates="award_recommendation_risks"
    )
    award_recommendation_risk_number: Mapped[str] = mapped_column(index=True)
    award_recommendation_risk_type: Mapped[AwardRecommendationRiskType] = mapped_column(
        "award_recommendation_risk_type_id",
        LookupColumn(LkAwardRecommendationRiskType),
        ForeignKey(LkAwardRecommendationRiskType.award_recommendation_risk_type_id),
    )
    comment: Mapped[str]
    is_deleted: Mapped[bool] = mapped_column(default=False)

    award_recommendation_risk_submissions: Mapped[list[AwardRecommendationRiskSubmission]] = (
        relationship(
            back_populates="award_recommendation_risk",
            cascade="all, delete-orphan",
        )
    )


class AwardRecommendationApplicationSubmission(ApiSchemaTable, TimestampMixin):
    __tablename__ = "award_recommendation_application_submission"

    award_recommendation_application_submission_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    award_recommendation_id: Mapped[uuid.UUID] = mapped_column(
        UUID,
        ForeignKey(AwardRecommendation.award_recommendation_id),
        index=True,
    )
    award_recommendation: Mapped[AwardRecommendation] = relationship(
        AwardRecommendation, back_populates="award_recommendation_application_submissions"
    )
    application_submission_id: Mapped[uuid.UUID] = mapped_column(
        UUID,
        ForeignKey("api.application_submission.application_submission_id"),
    )
    application_submission: Mapped[ApplicationSubmission] = relationship("ApplicationSubmission")
    award_recommendation_submission_detail_id: Mapped[uuid.UUID] = mapped_column(
        UUID,
        ForeignKey(
            "api.award_recommendation_submission_detail.award_recommendation_submission_detail_id"
        ),
    )
    award_recommendation_submission_detail: Mapped[AwardRecommendationSubmissionDetail] = (
        relationship("AwardRecommendationSubmissionDetail")
    )

    award_recommendation_risk_submissions: Mapped[list[AwardRecommendationRiskSubmission]] = (
        relationship(
            back_populates="award_recommendation_application_submission",
            cascade="all, delete-orphan",
        )
    )


class AwardRecommendationRiskSubmission(ApiSchemaTable, TimestampMixin):
    """Links an award recommendation risk to an award recommendation application submission."""

    __tablename__ = "award_recommendation_risk_submission"

    award_recommendation_risk_id: Mapped[uuid.UUID] = mapped_column(
        UUID,
        ForeignKey("api.award_recommendation_risk.award_recommendation_risk_id"),
        primary_key=True,
    )
    award_recommendation_risk: Mapped[AwardRecommendationRisk] = relationship(
        back_populates="award_recommendation_risk_submissions"
    )
    award_recommendation_application_submission_id: Mapped[uuid.UUID] = mapped_column(
        UUID,
        ForeignKey(
            "api.award_recommendation_application_submission.award_recommendation_application_submission_id"
        ),
        primary_key=True,
    )
    award_recommendation_application_submission: Mapped[
        AwardRecommendationApplicationSubmission
    ] = relationship(back_populates="award_recommendation_risk_submissions")


class AwardRecommendationSubmissionDetail(ApiSchemaTable, TimestampMixin):
    __tablename__ = "award_recommendation_submission_detail"

    award_recommendation_submission_detail_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    recommended_amount: Mapped[Decimal | None] = mapped_column(Numeric)
    scoring_comment: Mapped[str | None]
    general_comment: Mapped[str | None]
    award_recommendation_type: Mapped[AwardRecommendationType | None] = mapped_column(
        "award_recommendation_type_id",
        LookupColumn(LkAwardRecommendationType),
        ForeignKey(LkAwardRecommendationType.award_recommendation_type_id),
    )
    has_exception: Mapped[bool] = mapped_column(default=False)
    exception_detail: Mapped[str | None]


class AwardRecommendationReview(ApiSchemaTable, TimestampMixin):
    __tablename__ = "award_recommendation_review"

    award_recommendation_review_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    award_recommendation_id: Mapped[uuid.UUID] = mapped_column(
        UUID,
        ForeignKey(AwardRecommendation.award_recommendation_id),
        index=True,
    )
    award_recommendation: Mapped[AwardRecommendation] = relationship(
        AwardRecommendation, back_populates="award_recommendation_reviews"
    )
    award_recommendation_review_type: Mapped[AwardRecommendationReviewType] = mapped_column(
        "award_recommendation_review_type_id",
        LookupColumn(LkAwardRecommendationReviewType),
        ForeignKey(LkAwardRecommendationReviewType.award_recommendation_review_type_id),
    )
    is_reviewed: Mapped[bool] = mapped_column(default=False)


class AwardRecommendationAudit(ApiSchemaTable, TimestampMixin):
    """Audit row for events on an award recommendation (and related entities)."""

    __tablename__ = "award_recommendation_audit_event"

    award_recommendation_audit_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    award_recommendation_id: Mapped[uuid.UUID] = mapped_column(
        UUID,
        ForeignKey(AwardRecommendation.award_recommendation_id),
        index=True,
    )
    award_recommendation: Mapped[AwardRecommendation] = relationship(
        AwardRecommendation, back_populates="award_recommendation_audit_events"
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey("api.user.user_id"))
    user: Mapped[User] = relationship(User)
    award_recommendation_audit_event: Mapped[AwardRecommendationAuditEvent] = mapped_column(
        "award_recommendation_audit_event_id",
        LookupColumn(LkAwardRecommendationAuditEvent),
        ForeignKey(LkAwardRecommendationAuditEvent.award_recommendation_audit_event_id),
    )
    award_recommendation_risk_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID,
        ForeignKey("api.award_recommendation_risk.award_recommendation_risk_id"),
    )
    award_recommendation_risk: Mapped[AwardRecommendationRisk | None] = relationship(
        "AwardRecommendationRisk"
    )
    award_recommendation_attachment_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID,
        ForeignKey("api.award_recommendation_attachment.award_recommendation_attachment_id"),
    )
    award_recommendation_attachment: Mapped[AwardRecommendationAttachment | None] = relationship(
        "AwardRecommendationAttachment"
    )
    award_recommendation_review_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID,
        ForeignKey("api.award_recommendation_review.award_recommendation_review_id"),
    )
    award_recommendation_review: Mapped[AwardRecommendationReview | None] = relationship(
        "AwardRecommendationReview"
    )
    award_recommendation_application_submission_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID,
        ForeignKey(
            "api.award_recommendation_application_submission.award_recommendation_application_submission_id"
        ),
    )
    award_recommendation_application_submission: Mapped[
        AwardRecommendationApplicationSubmission | None
    ] = relationship("AwardRecommendationApplicationSubmission")
    workflow_approval_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID,
        ForeignKey("api.workflow_approval.workflow_approval_id"),
    )
    workflow_approval: Mapped[WorkflowApproval | None] = relationship(WorkflowApproval)
    audit_metadata: Mapped[dict | None] = mapped_column(JSONB)
