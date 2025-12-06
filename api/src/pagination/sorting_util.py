"""Utility functions for applying sorting to SQLAlchemy queries."""

from sqlalchemy import asc, desc
from sqlalchemy.sql.selectable import Select

from src.pagination.pagination_models import SortDirection


def apply_sorting(stmt: Select, sort_order: list, column_mapping: dict) -> Select:
    """Apply sorting to a query using a custom column mapping.

    This utility is useful when sorting fields come from joined tables.

    Args:
        stmt: The SQLAlchemy query statement to apply sorting to
        sort_order: List of SortOrderParams describing the sorting order
        column_mapping: Dictionary mapping sort field names to SQLAlchemy column objects
                       Example: {"email": LinkExternalUser.email, "first_name": UserProfile.first_name}

    Returns:
        The modified query statement with applied sorting

    Raises:
        ValueError: If a sort field is not found in the column_mapping
    """
    order_cols = []

    for order in sort_order:
        column = column_mapping.get(order.order_by)

        if column is None:
            # This indicates a configuration error - the schema allows a sort field
            # that we don't have a mapping for. This should be caught early.
            raise ValueError(
                f"Sort field '{order.order_by}' not found in column mapping. "
                f"Available fields: {list(column_mapping.keys())}"
            )

        if order.sort_direction == SortDirection.ASCENDING:
            order_cols.append(asc(column).nulls_last())
        elif order.sort_direction == SortDirection.DESCENDING:
            order_cols.append(desc(column).nulls_last())

    return stmt.order_by(*order_cols)
