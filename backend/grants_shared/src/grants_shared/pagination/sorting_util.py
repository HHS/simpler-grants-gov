"""Utility functions for applying sorting to SQLAlchemy queries."""

from sqlalchemy import asc, desc
from sqlalchemy.orm import InstrumentedAttribute
from sqlalchemy.sql.selectable import Select

from grants_shared.db.models.base import Base
from grants_shared.pagination.pagination_models import SortDirection, SortOrderParams


def _resolve_column(
    model_or_mapping: type[Base] | dict[str, InstrumentedAttribute], order_by: str
) -> InstrumentedAttribute:
    if isinstance(model_or_mapping, dict):
        column = model_or_mapping.get(order_by)
        if column is None:
            # This indicates a configuration error - the schema allows a sort field
            # that we don't have a mapping for. This should be caught early.
            msg = (
                f"Sort field '{order_by}' not found in column mapping. "
                f"Available fields: {list(model_or_mapping.keys())}"
            )
            raise ValueError(msg)
        return column

    return getattr(model_or_mapping, order_by)


def apply_sorting(
    stmt: Select,
    sort_order: list[SortOrderParams],
    model_or_mapping: type[Base] | dict[str, InstrumentedAttribute],
    nulls_last: bool = False,
) -> Select:
    """Apply sorting to a SQLAlchemy select statement.

    Columns to sort on are resolved one of two ways (never a mix):
      * Pass a model class to look up each sort field via ``getattr(model, field)``.
      * Pass a ``dict`` mapping sort field names to SQLAlchemy column objects, which
        is useful when sorting fields come from joined tables.
        Example: {"email": LinkExternalUser.email, "first_name": UserProfile.first_name}

    Args:
        stmt: The SQLAlchemy query statement to apply sorting to
        sort_order: List of SortOrderParams describing the sorting order
        model_or_mapping: A model class (getattr approach) or a dict mapping sort field
                          names to column objects
        nulls_last: When True, append NULLS LAST to each ordering so null values sort
                    to the end regardless of direction

    Returns:
        The modified query statement with applied sorting

    Raises:
        ValueError: If a mapping is provided and a sort field is not found in it
    """
    order_cols = []

    for order in sort_order:
        column = _resolve_column(model_or_mapping, order.order_by)

        direction = asc if order.sort_direction == SortDirection.ASCENDING else desc
        ordering = direction(column)

        if nulls_last:
            ordering = ordering.nulls_last()

        order_cols.append(ordering)

    return stmt.order_by(*order_cols)
