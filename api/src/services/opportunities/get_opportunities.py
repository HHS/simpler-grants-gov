from sqlalchemy import select

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.db.models.opportunity_models import Opportunity
from src.db.models.staging.staging_topportunity_models import StagingTopportunity
from src.services.opportunities.opportunity_service_shared import convert_staging_opp_to_regular


def get_opportunity(db_session: db.Session, opportunity_id: int) -> Opportunity:
    # For now, only non-drafts can be fetched
    opportunity: StagingTopportunity | None = db_session.execute(
        select(StagingTopportunity)
        .where(StagingTopportunity.opportunity_id == opportunity_id)
        .where(StagingTopportunity.is_draft == "N")
    ).scalar_one_or_none()

    if opportunity is None:
        raise_flask_error(404, message=f"Could not find Opportunity with ID {opportunity_id}")

    return convert_staging_opp_to_regular(opportunity)
