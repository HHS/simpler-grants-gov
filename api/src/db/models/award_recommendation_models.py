import uuid
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.adapters.db.type_decorators.postgres_type_decorators import LookupColumn
from src.constants.lookup_constants import (
    AwardRecommendationStatus,
    AwardRecommendationType,
    AwardSelectionMethod,
)
from src.db.models.base import ApiSchemaTable, TimestampMixin
from src.db.models.lookup_models import (
    LkAwardRecommendationStatus,
    LkAwardRecommendationType,
    LkAwardSelectionMethod,
)

if TYPE_CHECKING:
    from src.db.models.competition_models import ApplicationSubmission
    from src.db.models.opportunity_models import Opportunity


class AwardRecommendation(ApiSchemaTable, TimestampMixin):
    __tablename__ = "award_recommendation"

    award_recommendation_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    opportunity_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Opportunity.opportunity_id), nullable=False, index=True
    )
    opportunity: Mapped[Opportunity] = relationship(
        Opportunity, back_populates="award_recommendations"
    )
    # TODO - add a relationship to the funding strategy
    funding_strategy_id: Mapped[uuid.UUID | None] = mapped_column(UUID, nullable=True)
    award_recommendation_number: Mapped[str] = mapped_column(nullable=False, index=True)
    award_recommendation_status: Mapped[AwardRecommendationStatus] = mapped_column(
        "award_recommendation_status_id",
        LookupColumn(LkAwardRecommendationStatus),
        ForeignKey(LkAwardRecommendationStatus.award_recommendation_status_id),
        nullable=False,
        default=AwardRecommendationStatus.DRAFT,
    )
    additional_info: Mapped[str | None]
    award_selection_method: Mapped[AwardSelectionMethod | None] = mapped_column(
        "award_selection_method_id",
        LookupColumn(LkAwardSelectionMethod),
        ForeignKey(LkAwardSelectionMethod.award_selection_method_id),
        nullable=True,
    )
    selection_method_detail: Mapped[str | None]
    funding_strategy: Mapped[str | None]
    other_key_information: Mapped[str | None]

    award_recommendation_application_submissions: Mapped[
        list[AwardRecommendationApplicationSubmission]
    ] = relationship(
        back_populates="award_recommendation",
        uselist=True,
        cascade="all, delete-orphan",
    )


class AwardRecommendationApplicationSubmission(ApiSchemaTable, TimestampMixin):
    __tablename__ = "award_recommendation_application_submission"

    award_recommendation_application_submission_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    award_recommendation_id: Mapped[uuid.UUID] = mapped_column(
        UUID,
        ForeignKey(AwardRecommendation.award_recommendation_id),
        nullable=False,
        index=True,
    )
    award_recommendation: Mapped[AwardRecommendation] = relationship(
        AwardRecommendation, back_populates="award_recommendation_application_submissions"
    )
    application_submission_id: Mapped[uuid.UUID] = mapped_column(
        UUID,
        ForeignKey("api.application_submission.application_submission_id"),
        nullable=False,
    )
    application_submission: Mapped[ApplicationSubmission] = relationship("ApplicationSubmission")
    award_recommendation_submission_detail_id: Mapped[uuid.UUID] = mapped_column(
        UUID,
        ForeignKey(
            "api.award_recommendation_submission_detail.award_recommendation_submission_detail_id"
        ),
        nullable=False,
    )
    award_recommendation_submission_detail: Mapped[AwardRecommendationSubmissionDetail] = (
        relationship("AwardRecommendationSubmissionDetail")
    )


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
        nullable=True,
    )
    has_exception: Mapped[bool] = mapped_column(default=False)
    exception_detail: Mapped[str | None]
