from pydantic import BaseModel
from sqlalchemy import asc, desc
from sqlalchemy.sql import Select

from src.adapters import search
from src.pagination.pagination_models import SortDirection
from src.search.search_models import (
    BoolSearchFilter,
    DateSearchFilter,
    IntSearchFilter,
    StrSearchFilter,
)


def apply_sorting(stmt: Select, model: type, sort_order: list) -> Select:
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


def _adjust_field_name(field: str, request_field_name_mapping: dict) -> str:
    return request_field_name_mapping.get(field, field)


def _add_search_filters(
    builder: search.SearchQueryBuilder,
    request_field_name_mapping: dict,
    filters: BaseModel | None = None,
) -> None:
    if filters is None:
        return

    for field in filters.model_fields_set:
        field_filters = getattr(filters, field)
        field_name = _adjust_field_name(field, request_field_name_mapping)
        # We use the type of the search filter to determine what methods
        # we call on the builder. This way we can make sure we have the proper
        # type mappings.
        if isinstance(field_filters, StrSearchFilter) and field_filters.one_of:
            builder.filter_terms(field_name, field_filters.one_of)

        elif isinstance(field_filters, BoolSearchFilter) and field_filters.one_of:
            builder.filter_terms(field_name, field_filters.one_of)
        elif isinstance(field_filters, IntSearchFilter):
            builder.filter_int_range(field_name, field_filters.min, field_filters.max)

        elif isinstance(field_filters, DateSearchFilter):
            start_date = (
                field_filters.start_date
                if field_filters.start_date
                else field_filters.start_date_relative
            )
            end_date = (
                field_filters.end_date
                if field_filters.end_date
                else field_filters.end_date_relative
            )
            builder.filter_date_range(
                field_name,
                start_date,
                end_date,
            )
