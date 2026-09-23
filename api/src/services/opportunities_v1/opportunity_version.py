import logging
from operator import attrgetter

from src.adapters import db
from src.api.opportunities_v1.opportunity_schemas import OpportunityVersionSchema
from src.db.models.opportunity_models import Opportunity, OpportunityVersion
from src.util.dict_util import diff_nested_dicts

logger = logging.getLogger(__name__)

SCHEMA = OpportunityVersionSchema()


def save_opportunity_version(db_session: db.Session, opportunity: Opportunity) -> bool:
    """
    Saves a new version of an Opportunity record in the OpportunityVersion table if there are changes and the opportunity is not in draft status.

    This function first fetches the most recent version of the Opportunity record stored in the OpportunityVersion table.
    It compares the existing data with the current Opportunity record, and if there are any differences, it creates
    a new OpportunityVersion record and saves it in the database in a JSON format.

    :param  db_session: The active SQLAlchemy session used to interact with the database.
    :param opportunity: An instance of the Opportunity model containing the data to be saved.
    :return: This function returns a boolean indicating whether the opportunity was successfully saved.
    """

    if opportunity.is_draft:
        return False

    # Get the latest version
    latest_opp_version: OpportunityVersion | None = None
    if len(opportunity.versions) > 0:
        latest_opp_version = max(opportunity.versions, key=attrgetter("created_at"))

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

        return True

    return False
