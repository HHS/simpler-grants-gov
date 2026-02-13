from sqlalchemy import select

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.db.models.opportunity_models import Opportunity
from pydantic import BaseModel
import uuid
from src.constants.lookup_constants import OpportunityCategory


class OpportunityCreateRequest(BaseModel):
    agency_id: uuid.UUID
    opportunity_number: str
    opportunity_title: str
    category: OpportunityCategory
    category_explanation: str = None


def check_opportunity_number_exists(db_session: db.Session, opportunity_number: str) -> None:
    stmt = select(Opportunity).where(Opportunity.opportunity_number == opportunity_number)
    existing_opportunity = db_session.execute(stmt).scalar_one_or_none()

    if existing_opportunity is not None:
        raise_flask_error(
            422, message=f"Opportunity with number '{opportunity_number}' already exists"
        )
