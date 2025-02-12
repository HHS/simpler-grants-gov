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
