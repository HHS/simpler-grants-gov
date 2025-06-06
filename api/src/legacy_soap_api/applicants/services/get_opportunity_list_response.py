import logging
from typing import Sequence

from sqlalchemy import select

import src.adapters.db as db
from src.db.models.competition_models import Competition
from src.db.models.opportunity_models import Opportunity, OpportunityAssistanceListing
from src.legacy_soap_api.applicants.schemas import (
    CFDADetails,
    GetOpportunityListRequest,
    GetOpportunityListResponse,
    OpportunityDetails,
    OpportunityFilter,
)

logger = logging.getLogger(__name__)


def get_opportunity_list_response(
    db_session: db.Session,
    get_opportunity_list_request: GetOpportunityListRequest,
) -> GetOpportunityListResponse:
    competitions = get_competitions_from_opportunity_list_request(
        db_session, get_opportunity_list_request
    )
    opened_competitions = _get_opened_competitions(competitions)
    return _build_get_opportunity_list_response(opened_competitions)


def get_competitions_from_opportunity_list_request(
    db_session: db.Session, get_opportunity_list_request: GetOpportunityListRequest
) -> Sequence:
    return _get_competitions(
        db_session,
        get_opportunity_list_request.package_id,
        get_opportunity_list_request.opportunity_filter,
    )


def _get_competitions(
    db_session: db.Session,
    legacy_package_id: str | None,
    opportunity_filter: OpportunityFilter | None,
) -> Sequence:
    if legacy_package_id is None and opportunity_filter is None:
        return []

    stmt = select(Competition).join(Opportunity)

    if legacy_package_id is not None:
        stmt = stmt.where(Competition.legacy_package_id == legacy_package_id)
    elif opportunity_filter is not None:
        if opportunity_filter.cfda_number:
            stmt.join(
                OpportunityAssistanceListing,
                OpportunityAssistanceListing.assistance_listing_number
                == opportunity_filter.cfda_number,
            )
        if opportunity_filter.competition_id:
            stmt = stmt.where(
                Competition.public_competition_id == opportunity_filter.competition_id
            )
        if opportunity_filter.funding_opportunity_number:
            stmt = stmt.where(
                Opportunity.opportunity_number == opportunity_filter.funding_opportunity_number
            )
    return db_session.execute(stmt).scalars().all()


def _build_get_opportunity_list_response(competitions: list) -> GetOpportunityListResponse:
    opportunity_details = (
        list(map(_build_get_opportunity_details, competitions)) if competitions else []
    )
    return GetOpportunityListResponse(opportunity_details=opportunity_details)


def _build_get_opportunity_details(competition_model: Competition) -> OpportunityDetails:
    return OpportunityDetails(
        competition_title=competition_model.competition_title,
        competition_id=competition_model.public_competition_id,
        funding_opportunity_title=competition_model.opportunity.opportunity_title,
        funding_opportunity_number=competition_model.opportunity.opportunity_number,
        is_multi_project=competition_model.is_multi_package,
        closing_date=competition_model.closing_date,
        opening_date=competition_model.opening_date,
        cfda_details=_get_cfda_details(competition_model.opportunity_assistance_listing),
        offering_agency=competition_model.opportunity.agency_name,
        package_id=competition_model.legacy_package_id,
        agency_contact_info=competition_model.contact_info,
    )


def _get_cfda_details(
    opportunity_assistance_listing: OpportunityAssistanceListing | None,
) -> CFDADetails | None:
    if not opportunity_assistance_listing:
        return None
    return CFDADetails(
        number=opportunity_assistance_listing.assistance_listing_number,
        title=opportunity_assistance_listing.program_title,
    )


def _get_opened_competitions(competitions: Sequence[Competition]) -> list[Competition]:
    return list(filter(lambda competition: competition.is_open, competitions))
