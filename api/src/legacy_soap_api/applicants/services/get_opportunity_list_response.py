import logging
from collections.abc import Sequence
from dataclasses import dataclass

from sqlalchemy import select

import src.adapters.db as db
from src.db.models.competition_models import Competition
from src.db.models.opportunity_models import Opportunity, OpportunityAssistanceListing
from src.db.models.staging.instructions import Tinstructions
from src.legacy_soap_api.applicants.schemas import (
    CFDADetails,
    GetOpportunityListRequest,
    GetOpportunityListResponse,
    OpportunityDetails,
    OpportunityFilter,
)
from src.legacy_soap_api.legacy_soap_api_config import get_soap_config
from src.legacy_soap_api.legacy_soap_api_utils import bool_to_string, ensure_dot_prefix
from src.util import file_util

logger = logging.getLogger(__name__)


@dataclass
class TinstructionsURL:
    schema_url: str | None = None
    instructions_url: str | None = None


def get_opportunity_list_response(
    db_session: db.Session,
    get_opportunity_list_request: GetOpportunityListRequest,
) -> GetOpportunityListResponse:
    competitions = get_competitions_from_opportunity_list_request(
        db_session, get_opportunity_list_request
    )
    opened_competitions = _get_opened_competitions(competitions)
    tinstructions_map = get_tinstructions_map(db_session, opened_competitions)
    return _build_get_opportunity_list_response(opened_competitions, tinstructions_map)


def get_competitions_from_opportunity_list_request(
    db_session: db.Session, get_opportunity_list_request: GetOpportunityListRequest
) -> Sequence:
    return _get_competitions(
        db_session,
        get_opportunity_list_request.package_id,
        get_opportunity_list_request.opportunity_filter,
    )


def get_tinstructions_map(db_session: db.Session, competitions: list) -> dict:
    """Get instructions extension for competitions

    This method returns a map of extension string from the staging.tinstructions table
    that is needed to build the instructions_url property of the competition for the
    GetOpportunityListResponse.

    This will return a map of Competition.legacy_competition_id: staging.tinstructions.extension.
    """
    legacy_competition_ids = [
        c.legacy_competition_id for c in competitions if c.legacy_competition_id is not None
    ]
    tinstructions = (
        db_session.execute(
            select(Tinstructions.extension, Tinstructions.comp_id).where(
                Tinstructions.comp_id.in_(legacy_competition_ids)
            )
        )
        .mappings()
        .all()
    )
    return {tinstruction.comp_id: tinstruction.extension for tinstruction in tinstructions}


def get_tinstructions_urls(competition: Competition, tinstructions_map: dict) -> TinstructionsURL:
    url = TinstructionsURL()
    if not competition.legacy_package_id:
        return url
    base_url = file_util.join(get_soap_config().grants_gov_uri, "apply", "opportunities")
    url.schema_url = file_util.join(
        base_url, "schemas", "applicant", f"{competition.legacy_package_id}.xsd"
    )
    if extension := tinstructions_map.get(competition.legacy_competition_id):
        url.instructions_url = file_util.join(
            base_url,
            "instructions",
            f"{competition.legacy_package_id}-instructions{ensure_dot_prefix(extension)}",
        )
    return url


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


def _build_get_opportunity_list_response(
    competitions: list, tcompetitions_map: dict
) -> GetOpportunityListResponse:
    opportunity_details = []
    if competitions:
        opportunity_details = [
            _build_get_opportunity_details(
                competition, get_tinstructions_urls(competition, tcompetitions_map)
            )
            for competition in competitions
        ]
    return GetOpportunityListResponse(opportunity_details=opportunity_details)


def _build_get_opportunity_details(
    competition_model: Competition, tinstructions_urls: TinstructionsURL
) -> OpportunityDetails:
    return OpportunityDetails(
        competition_title=competition_model.competition_title,
        competition_id=competition_model.public_competition_id,
        funding_opportunity_title=competition_model.opportunity.opportunity_title,
        funding_opportunity_number=competition_model.opportunity.opportunity_number,
        is_multi_project=bool_to_string(competition_model.is_multi_package),
        closing_date=competition_model.closing_date,
        opening_date=competition_model.opening_date,
        cfda_details=_get_cfda_details(competition_model.opportunity_assistance_listing),
        offering_agency=competition_model.opportunity.agency_name,
        package_id=competition_model.legacy_package_id,
        agency_contact_info=competition_model.contact_info,
        instructions_url=tinstructions_urls.instructions_url,
        schema_url=tinstructions_urls.schema_url,
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
    return list(filter(lambda competition: competition.has_open_date, competitions))
