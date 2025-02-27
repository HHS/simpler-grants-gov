import logging
from datetime import date, datetime
from decimal import Decimal
from importlib.metadata.diagnose import inspect
from uuid import UUID

from sqlalchemy.orm import RelationshipProperty, class_mapper

from src.adapters import db
from src.adapters.db import PostgresDBClient
from src.db.models.base import Base
from src.db.models.opportunity_models import Opportunity
from tests.src.db.models.factories import OpportunityFactory

logger = logging.getLogger(__name__)

all_model_dict = {}


def save_opportunity_json(
    db_session: db.Session, opportunity_model: Base, visited=None, relationship_name=None
) -> None:
    # Initialize visited dictionary if it doesn't exist

    if visited is None:
        visited = {}

    # Get the class of the instance
    model_class = opportunity_model.__class__

    # Prevent infinite recursion in case of circular relationships
    if model_class in visited:
        if opportunity_model not in visited[model_class]:
            visited[model_class].append(opportunity_model)

    else:
        visited[model_class] = [opportunity_model]


    global all_model_dict
    try:
        model_dict = {}
        for column in class_mapper(model_class).columns:
            # skip over relationships
            if column.foreign_keys:
                continue

            value = getattr(opportunity_model, column.name)
            # can maybe use for_json() for these
            if isinstance(value, UUID) or isinstance(value, Decimal):
                model_dict[column.name] = str(value)
            if isinstance(value, date) or isinstance(value, datetime):
                model_dict[column.name] = value.isoformat()
            elif isinstance(value, list):  # Handle relationships (like many-to-many or one-to-many)
                model_dict[column.name] = [
                    save_opportunity_json(db_session, item, visited) for item in value
                ]
            else:
                model_dict[column.name] = value

        if isinstance(opportunity_model, Opportunity):
            all_model_dict = model_dict
        elif isinstance(all_model_dict[relationship_name], list):
            all_model_dict[relationship_name].append(model_dict)
        else:
            all_model_dict[relationship_name] = model_dict



        for relationship_name, relationship_property in class_mapper(
            opportunity_model.__class__
        ).relationships.items():
            if relationship_name != "opportunity":
                relationship_value = getattr(opportunity_model, relationship_name, None)

                if relationship_value:

                    if isinstance(
                        relationship_value, list
                    ):  # Handle one-to-many or many-to-many relationships
                        all_model_dict[relationship_name] = []
                        for item in relationship_value:
                            save_opportunity_json(db_session, item, visited, relationship_name)

                    else:  # Handle one-to-one or many-to-one relationships
                        all_model_dict[relationship_name] = None
                        save_opportunity_json(
                            db_session, relationship_value, visited, relationship_name
                        )
                        logger.error(model_dict[relationship_name])


    except Exception as e:
        print(f"Error : {e}")
        raise e
