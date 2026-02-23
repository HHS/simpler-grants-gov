import uuid

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.sql.elements import ColumnExpressionArgument

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import Privilege
from src.db.models.agency_models import Agency
from src.db.models.opportunity_models import (
    CurrentOpportunitySummary,
    Opportunity,
    OpportunitySummary,
)
from src.db.models.user_models import User


def check_opportunity_number_exists(db_session: db.Session, opportunity_number: str) -> None:
    stmt = select(Opportunity).where(Opportunity.opportunity_number == opportunity_number)
    existing_opportunity = db_session.execute(stmt).scalar_one_or_none()

    if existing_opportunity is not None:
        raise_flask_error(
            422, message=f"Opportunity with number '{opportunity_number}' already exists"
        )


def _get_opportunity_for_grantors(
    db_session: db.Session, where_clause: ColumnExpressionArgument[bool]
) -> Opportunity | None:
    stmt = (
        select(Opportunity)
        .where(where_clause)
        .options(
            selectinload(Opportunity.all_opportunity_summaries).options(
                selectinload(OpportunitySummary.link_funding_instruments),
                selectinload(OpportunitySummary.link_funding_categories),
                selectinload(OpportunitySummary.link_applicant_types),
            ),
            selectinload(Opportunity.agency_record).selectinload(Agency.top_level_agency),
            selectinload(Opportunity.opportunity_assistance_listings),
            selectinload(Opportunity.current_opportunity_summary).selectinload(
                CurrentOpportunitySummary.opportunity_summary
            ),
        )
    )

    opportunity = db_session.execute(stmt).unique().scalar_one_or_none()

    return opportunity


def get_opportunity_for_grantors(
    db_session: db.Session, user: User, opportunity_id: uuid.UUID
) -> Opportunity:
    opportunity = _get_opportunity_for_grantors(
        db_session,
        where_clause=Opportunity.opportunity_id == opportunity_id,
    )
    if opportunity is None:
        raise_flask_error(404, message=f"Could not find Opportunity with ID {opportunity_id}")

    verify_access(user, {Privilege.VIEW_OPPORTUNITY}, opportunity.agency_record)

    return opportunity
