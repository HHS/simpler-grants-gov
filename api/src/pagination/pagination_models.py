import dataclasses
from enum import StrEnum
from typing import Self

from pydantic import BaseModel

from src.pagination.paginator import Paginator


class SortDirection(StrEnum):
    ASCENDING = "ascending"
    DESCENDING = "descending"

    def short_form(self) -> str:
        if self == SortDirection.DESCENDING:
            return "desc"
        return "asc"


class SortingParamsV0(BaseModel):
    order_by: str
    sort_direction: SortDirection

    @property
    def is_ascending(self) -> bool:
        return self.sort_direction == SortDirection.ASCENDING


class PagingParamsV0(BaseModel):
    page_size: int
    page_offset: int


class PaginationParamsV0(BaseModel):
    sorting: SortingParamsV0
    paging: PagingParamsV0


class PaginationParams(BaseModel):
    page_offset: int
    page_size: int

    order_by: str
    sort_direction: SortDirection

    @property
    def is_ascending(self) -> bool:
        return self.sort_direction == SortDirection.ASCENDING


@dataclasses.dataclass
class PaginationInfo:
    page_offset: int
    page_size: int

    order_by: str
    sort_direction: SortDirection

    total_records: int
    total_pages: int

    @classmethod
    def from_pagination_params(
        cls, pagination_params: PaginationParams, paginator: Paginator
    ) -> Self:
        return cls(
            page_offset=pagination_params.page_offset,
            page_size=pagination_params.page_size,
            order_by=pagination_params.order_by,
            sort_direction=pagination_params.sort_direction,
            total_records=paginator.total_records,
            total_pages=paginator.total_pages,
        )

    @classmethod
    def from_pagination_models(
        cls, pagination_params: PaginationParamsV0, paginator: Paginator
    ) -> Self:
        return cls(
            page_offset=pagination_params.paging.page_offset,
            page_size=pagination_params.paging.page_size,
            order_by=pagination_params.sorting.order_by,
            sort_direction=pagination_params.sorting.sort_direction,
            total_records=paginator.total_records,
            total_pages=paginator.total_pages,
        )
