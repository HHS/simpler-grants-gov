from uuid import UUID

from grants_shared.adapters import db
from sqlalchemy import select

from src.api.response import ValidationErrorDetail
from src.api.route_utils import raise_flask_error
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import UserSavedOpportunity
from src.validation.validation_constants import ValidationErrorType


def delete_saved_opportunity(
    db_session: db.Session, user_id: UUID, opportunity_id: UUID | int
) -> None:

    if isinstance(opportunity_id, UUID):
        saved_opp = db_session.execute(
            select(UserSavedOpportunity).where(
                UserSavedOpportunity.user_id == user_id,
                UserSavedOpportunity.opportunity_id == opportunity_id,
            )
        ).scalar_one_or_none()
    else:
        # Handle legacy opportunity ID by joining with Opportunity table
        saved_opp = db_session.execute(
            select(UserSavedOpportunity)
            .join(Opportunity, UserSavedOpportunity.opportunity_id == Opportunity.opportunity_id)
            .where(
                UserSavedOpportunity.user_id == user_id,
                Opportunity.legacy_opportunity_id == opportunity_id,
            )
        ).scalar_one_or_none()

    if not saved_opp:
        raise_flask_error(
            404,
            "Saved opportunity not found",
            validation_issues=[
                ValidationErrorDetail(
                    type=ValidationErrorType.SAVED_ITEM_NOT_FOUND,
                    message="Saved opportunity not found",
                    field="opportunity_id",
                )
            ],
        )

    saved_opp.is_deleted = True
