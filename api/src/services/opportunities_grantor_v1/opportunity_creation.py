import uuid

import src.adapters.db as db
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import Privilege
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import User
from src.services.opportunities_grantor_v1.get_agency import get_agency
from src.services.opportunities_grantor_v1.get_opportunity import check_opportunity_number_exists


def create_opportunity(db_session: db.Session, user: User, opportunity_data: dict) -> Opportunity:
    # Get agency and verify it exists
    agency = get_agency(db_session, opportunity_data["agency_id"])

    # Check if user has permission to create opportunities for this agency
    verify_access(user, {Privilege.CREATE_OPPORTUNITY}, agency)

    # Check if opportunity number already exists (raises 422 if it does)
    check_opportunity_number_exists(db_session, opportunity_data["opportunity_number"])

    # Create the opportunity
    opportunity = Opportunity(
        opportunity_id=uuid.uuid4(),
        opportunity_number=opportunity_data["opportunity_number"],
        opportunity_title=opportunity_data["opportunity_title"],
        agency_id=agency.agency_id,
        agency_code=agency.agency_code,
        category=opportunity_data["category"],
        category_explanation=opportunity_data.get("category_explanation"),
        legacy_opportunity_id=None,
        is_simpler_grants_opportunity=True,
        is_draft=True,
    )

    db_session.add(opportunity)

    return opportunity
