from pydantic import BaseModel

from src.adapters import search
from src.search.search_models import (
    BoolSearchFilter,
    DateSearchFilter,
    IntSearchFilter,
    StrSearchFilter,
)


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
