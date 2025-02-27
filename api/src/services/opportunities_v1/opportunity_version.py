import logging

from src.adapters import db
from src.api.opportunities_v1.opportunity_schemas import OpportunityV1Schema
from src.db.models.opportunity_models import Opportunity, OpportunityVersion

logger = logging.getLogger(__name__)


def save_opportunity_version(db_session: db.Session, opportunity: Opportunity) -> None:
    """
    Saves a new version of an Opportunity record in the OpportunityVersion table.

    This function extracts the opportunity data from the provided Opportunity model instance,
    creates a new OpportunityVersion record with the data, and saves it in the database.

    :param  db_session: The active SQLAlchemy session used to interact with the database.
    :param opportunity: An instance of the Opportunity model containing the data to be saved.
    :return: This function does not return a value. It saves a new version of the opportunity in the database.
    """
    #  Extracts the opportunity data as JSON object
    schema = OpportunityV1Schema()
    schema_data = schema.dump(opportunity)

    # Add new OpportunityVersion instance to the database session
    opportunity_version = OpportunityVersion(
        opportunity_id=opportunity.opportunity_id,
        opportunity_data=schema_data,
    )

    db_session.add(opportunity_version)

    db_session.commit()
