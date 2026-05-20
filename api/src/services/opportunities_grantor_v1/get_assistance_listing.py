import uuid

from sqlalchemy import select

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.db.models.opportunity_models import AssistanceListing, OpportunityAssistanceListing


def get_assistance_listing(db_session: db.Session, assist_list_nbr: str) -> AssistanceListing:
    stmt = select(AssistanceListing).where(
        AssistanceListing.assistance_listing_number == assist_list_nbr
    )
    record = db_session.execute(stmt).scalar_one_or_none()

    if record is None:
        raise_flask_error(
            404, message=f"Could not find Assistance Listing Number {assist_list_nbr}"
        )

    return record


def get_opportunity_assistance_listing(
    db_session: db.Session, opportunity_id: uuid.UUID, assistance_listing_number: str
) -> OpportunityAssistanceListing:
    """
    Get an OpportunityAssistanceListing for a specific opportunity and assistance listing number.
    """
    stmt = select(OpportunityAssistanceListing).where(
        OpportunityAssistanceListing.opportunity_id == opportunity_id,
        OpportunityAssistanceListing.assistance_listing_number == assistance_listing_number,
    )
    record = db_session.execute(stmt).scalar_one_or_none()

    if record is None:
        raise_flask_error(
            404, message=f"Assistance listing {assistance_listing_number} not found on opportunity"
        )

    return record
