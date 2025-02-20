from typing import Type

from sqlalchemy import asc, desc
from sqlalchemy.sql import Select

from src.pagination.pagination_models import SortDirection


def apply_sorting(stmt: Select, model: Type, sort_order: list) -> Select:
    """
    Applies sorting to a SQLAlchemy select statement based on the provided sorting orders.

    :param stmt: The SQLAlchemy query statement to which sorting should be applied.
    :param model: The model class on which the sorting should be applied.
    :param sort_order: A list of object describing the sorting order for a column.
    :return: The modified query statement with the applied sorting.
    """

    order_cols: list = []
    for order in sort_order:
        column = getattr(model, order.order_by)
        if order.sort_direction == SortDirection.ASCENDING:
            order_cols.append(asc(column))
        elif order.sort_direction == SortDirection.DESCENDING:
            order_cols.append(desc(column))

    return stmt.order_by(*order_cols)


import logging

from src.adapters import db
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
    opp_obj = opportunity.for_json()

    # Add new OpportunityVersion instance to the database session
    opportunity_version = OpportunityVersion(
        opportunity_id=opp_obj["opportunity_id"],
        opportunity_data=opp_obj,
    )

    db_session.add(opportunity_version)

    db_session.commit()
