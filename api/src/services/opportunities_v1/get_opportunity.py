import uuid

import grants_shared.adapters.db as db
from grants_shared.api.route_utils import raise_flask_error
from sqlalchemy import ColumnExpressionArgument, select
from sqlalchemy.orm import selectinload

from src.db.models.agency_models import Agency
from src.db.models.competition_models import Competition, CompetitionForm, Form
from src.db.models.opportunity_models import (
    CurrentOpportunitySummary,
    Opportunity,
    OpportunitySummary,
)


def _get_opportunity(
    db_session: db.Session, where_clause: ColumnExpressionArgument[bool]
) -> Opportunity | None:
    stmt = (
        select(Opportunity)
        .where(where_clause)
        .where(Opportunity.is_draft.is_(False))
        .options(
            # Opportunity summary
            selectinload(Opportunity.current_opportunity_summary)
            .selectinload(CurrentOpportunitySummary.opportunity_summary)
            .options(
                selectinload(OpportunitySummary.link_funding_instruments),
                selectinload(OpportunitySummary.link_funding_categories),
                selectinload(OpportunitySummary.link_applicant_types),
            ),
            # Attachments
            selectinload(Opportunity.opportunity_attachments),
            # Competitions
            selectinload(Opportunity.competitions).options(
                selectinload(Competition.competition_instructions),
                selectinload(Competition.opportunity_assistance_listing),
                selectinload(Competition.link_competition_open_to_applicant),
                selectinload(Competition.competition_forms)
                .selectinload(CompetitionForm.form)
                .selectinload(Form.form_instruction),
            ),
            # Assistance listing number
            selectinload(Opportunity.opportunity_assistance_listings),
            # Agency
            selectinload(Opportunity.agency_record).selectinload(Agency.top_level_agency),
        )
    )

    opportunity = db_session.execute(stmt).unique().scalar_one_or_none()

    return opportunity


def get_opportunity(db_session: db.Session, opportunity_id: uuid.UUID) -> Opportunity:
    opportunity = _get_opportunity(
        db_session,
        where_clause=Opportunity.opportunity_id == opportunity_id,
    )
    if opportunity is None:
        raise_flask_error(404, message=f"Could not find Opportunity with ID {opportunity_id}")

    return opportunity


def get_opportunity_by_legacy_id(db_session: db.Session, legacy_opportunity_id: int) -> Opportunity:
    opportunity = _get_opportunity(
        db_session,
        where_clause=Opportunity.legacy_opportunity_id == legacy_opportunity_id,
    )
    if opportunity is None:
        raise_flask_error(
            404, message=f"Could not find Opportunity with Legacy ID {legacy_opportunity_id}"
        )

    return opportunity
