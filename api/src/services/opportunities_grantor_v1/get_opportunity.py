import uuid

from sqlalchemy import ColumnExpressionArgument, select
from sqlalchemy.orm import lazyload, selectinload

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.db.models.agency_models import Agency
from src.db.models.opportunity_models import Opportunity

def check_opportunity_number_exists(db_session: db.Session, opportunity_number: str) -> None:
    """Check if an opportunity with the given number already exists and raise an error if it does.

    Args:
        db_session: Database session
        opportunity_number: The opportunity number to check

    Raises:
        FlaskError: 422 if opportunity number already exists
    """
    stmt = select(Opportunity).where(Opportunity.opportunity_number == opportunity_number)
    existing_opportunity = db_session.execute(stmt).scalar_one_or_none()

    if existing_opportunity is not None:
        raise_flask_error(
            422,
            message=f"Opportunity with number '{opportunity_number}' already exists"
        )
