import dataclasses
import math
from enum import StrEnum
from typing import Self

from pydantic import BaseModel, Field

from src.adapters.search.opensearch_response import SearchResponse
from src.pagination.paginator import Paginator


class SortDirection(StrEnum):
    ASCENDING = "ascending"
    DESCENDING = "descending"

    def short_form(self) -> str:
        if self == SortDirection.DESCENDING:
            return "desc"
        return "asc"


class SortOrderParams(BaseModel):
    order_by: str
    sort_direction: SortDirection


class PaginationParams(BaseModel):
    page_offset: int
    page_size: int

    sort_order: list[SortOrderParams] = Field(default_factory=list)


@dataclasses.dataclass
class SortOrder:
    order_by: str
    sort_direction: SortDirection


@dataclasses.dataclass
class PaginationInfo:
    page_offset: int
    page_size: int

    total_records: int
    total_pages: int

    sort_order: list[SortOrder]

    @classmethod
    def from_pagination_params(
        cls, pagination_params: PaginationParams, paginator: Paginator
    ) -> Self:
        return cls(
            page_offset=pagination_params.page_offset,
            page_size=pagination_params.page_size,
            total_records=paginator.total_records,
            total_pages=paginator.total_pages,
            sort_order=[
                SortOrder(p.order_by, p.sort_direction) for p in pagination_params.sort_order
            ],
        )

    @classmethod
    def from_search_response(
        cls, pagination_params: PaginationParams, search_response: SearchResponse
    ) -> Self:
        # OpenSearch cannot return records past 10,000, so even if the count
        # is greater, reduce it to 10,000 exactly.
        total_records = search_response.total_records
        if total_records > 10000:
            total_records = 10000

        # If the total records was reduced, the page count will get reduced
        # accordingly. It's fine if the last page partially goes over 10k as
        # in our request building logic to OpenSearch we will make sure this page
        # fully fits within the 10k.
        total_pages = int(math.ceil(total_records / pagination_params.page_size))  # noqa: RUF046

        return cls(
            page_offset=pagination_params.page_offset,
            page_size=pagination_params.page_size,
            total_records=total_records,
            total_pages=total_pages,
            sort_order=[
                SortOrder(order_by=p.order_by, sort_direction=p.sort_direction)
                for p in pagination_params.sort_order
            ],
        )
