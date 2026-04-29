import uuid
from collections.abc import Sequence

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import OpportunityStatus, Privilege
from src.db.models.agency_models import Agency
from src.db.models.competition_models import Application, Competition, CompetitionForm, Form
from src.db.models.opportunity_models import (
    CurrentOpportunitySummary,
    Opportunity,
    OpportunitySummary,
)
from src.db.models.user_models import User
from src.pagination.pagination_models import PaginationInfo, PaginationParams, SortOrder
from src.pagination.paginator import Paginator
from src.services.opportunities_grantor_v1.get_agency import get_agency
from src.services.service_utils import apply_sorting


class OpportunityFilterSchema(BaseModel):
    """Optional filters for opportunity list"""

    award_recommendation_ready: bool | None = Field(
        default=None,
        description="Filter for opportunities ready for award recommendations. If True, returns only opportunities that can have award recommendations created for them.",
    )


class ListOpportunitiesParams(BaseModel):
    """Parameters for listing opportunities"""

    pagination: PaginationParams = Field(
        default_factory=lambda: PaginationParams(page_offset=1, page_size=25)
    )
    filters: OpportunityFilterSchema | None = Field(default=None)


def list_opportunities_with_filters(
    db_session: db.Session,
    agency_id: uuid.UUID,
    params: ListOpportunitiesParams,
) -> tuple[Sequence[Opportunity], PaginationInfo]:
    """
    List opportunities with filtering, sorting, pagination.

    Args:
        db_session: Database session
        agency_id: Agency ID to list opportunities for
        params: Query parameters

    Returns:
        List of Opportunity objects and pagination_info
    """
    stmt = (
        select(Opportunity)
        .options(
            selectinload(Opportunity.agency_record).selectinload(Agency.top_level_agency),
            selectinload(Opportunity.opportunity_assistance_listings),
            selectinload(Opportunity.all_opportunity_summaries).options(
                selectinload(OpportunitySummary.link_funding_instruments),
                selectinload(OpportunitySummary.link_funding_categories),
                selectinload(OpportunitySummary.link_applicant_types),
            ),
            selectinload(Opportunity.current_opportunity_summary)
            .selectinload(CurrentOpportunitySummary.opportunity_summary)
            .options(
                selectinload(OpportunitySummary.link_funding_instruments),
                selectinload(OpportunitySummary.link_funding_categories),
                selectinload(OpportunitySummary.link_applicant_types),
            ),
            selectinload(Opportunity.opportunity_attachments),
            selectinload(Opportunity.competitions).options(
                selectinload(Competition.competition_forms)
                .selectinload(CompetitionForm.form)
                .selectinload(Form.form_instruction),
                selectinload(Competition.competition_instructions),
                selectinload(Competition.opportunity_assistance_listing),
                selectinload(Competition.link_competition_open_to_applicant),
                selectinload(Competition.applications).selectinload(
                    Application.application_submissions
                ),
            ),
            selectinload(Opportunity.award_recommendations),
        )
        .outerjoin(
            Agency,
            (Opportunity.agency_id == Agency.agency_id)
            | ((Opportunity.agency_id.is_(None)) & (Opportunity.agency_code == Agency.agency_code)),
        )
        .where(Agency.agency_id == agency_id)
    )

    if params.filters and params.filters.award_recommendation_ready is True:
        stmt = stmt.where(
            Opportunity.current_opportunity_summary.has(
                CurrentOpportunitySummary.opportunity_status == OpportunityStatus.POSTED
            ),
            Opportunity.is_simpler_grants_opportunity.is_(True),
            Opportunity.competitions.any(
                Competition.applications.any(Application.application_submissions.any())
            ),
            ~Opportunity.award_recommendations.any(),
        )

    stmt = apply_sorting(stmt, Opportunity, params.pagination.sort_order)

    paginator: Paginator[Opportunity] = Paginator(
        table_model=Opportunity,
        stmt=stmt,
        db_session=db_session,
        page_size=params.pagination.page_size,
    )

    opportunities = paginator.page_at(params.pagination.page_offset)

    pagination_info = PaginationInfo(
        total_records=paginator.total_records,
        page_offset=params.pagination.page_offset,
        page_size=params.pagination.page_size,
        total_pages=paginator.total_pages,
        sort_order=[SortOrder(p.order_by, p.sort_direction) for p in params.pagination.sort_order],
    )

    return opportunities, pagination_info


def get_opportunity_list_for_grantors(
    db_session: db.Session,
    user: User,
    agency_id: uuid.UUID,
    json_data: dict,
) -> tuple[Sequence[Opportunity], PaginationInfo]:
    """
    Get a paginated list of opportunities for grantors

    Args:
        db_session: Database session
        user: User making the request
        agency_id: Agency ID to get opportunities for
        json_data: Request JSON data

    Returns:
        Tuple of (opportunities, pagination_info)
    """
    # Validate parameters
    params = ListOpportunitiesParams.model_validate(json_data)

    # Get agency and verify it exists
    agency = get_agency(db_session, agency_id)

    # If filtering by award_recommendation_ready, verify user has VIEW_AWARD_RECOMMENDATION privilege
    if params.filters and params.filters.award_recommendation_ready:
        verify_access(user, {Privilege.VIEW_AWARD_RECOMMENDATION}, agency)
    else:
        # Verify user has VIEW_OPPORTUNITY privilege for the agency
        verify_access(user, {Privilege.VIEW_OPPORTUNITY}, agency)

    # Get opportunities with filters and pagination
    opportunities, pagination_info = list_opportunities_with_filters(
        db_session=db_session,
        agency_id=agency_id,
        params=params,
    )

    return opportunities, pagination_info
