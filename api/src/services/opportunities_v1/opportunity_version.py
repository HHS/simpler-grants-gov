import logging

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.adapters import db
from src.api.opportunities_v1.opportunity_schemas import OpportunityV1Schema
from src.db.models.opportunity_models import Opportunity, OpportunityVersion
from src.util.dict_util import diff_nested_dicts

logger = logging.getLogger(__name__)

SCHEMA = OpportunityV1Schema()


def save_opportunity_version(db_session: db.Session, opportunity: Opportunity) -> None:
    """
    Saves a new version of an Opportunity record in the OpportunityVersion table if there are changes and the opportunity is not in draft status.

    This function first fetches the most recent version of the Opportunity record stored in the OpportunityVersion table.
    It compares the existing data with the current Opportunity record, and if there are any differences, it creates
    a new OpportunityVersion record and saves it in the database in a JSON format.

    :param  db_session: The active SQLAlchemy session used to interact with the database.
    :param opportunity: An instance of the Opportunity model containing the data to be saved.
    :return: This function does not return a value. It saves a new version of the opportunity in the database.
    """

    if opportunity.is_draft:
        return

    # Fetch latest opportunity version stored
    latest_opp_version = db_session.execute(
        select(OpportunityVersion)
        .where(OpportunityVersion.opportunity_id == opportunity.opportunity_id)
        .order_by(OpportunityVersion.created_at.desc())
        .options(selectinload("*"))
    ).scalar_one_or_none()

    # Extracts the opportunity data as JSON object
    opportunity_new = SCHEMA.dump(opportunity)

    diffs = []

    if latest_opp_version:
        diffs = diff_nested_dicts(opportunity_new, latest_opp_version.opportunity_data)

    if diffs or latest_opp_version is None:
        # Add new OpportunityVersion instance to the database session
        opportunity_version = OpportunityVersion(
            opportunity_id=opportunity.opportunity_id,
            opportunity_data=opportunity_new,
        )

        db_session.add(opportunity_version)
