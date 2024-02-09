import math
from typing import Generic, Sequence, TypeVar

from sqlalchemy import Select, func

import src.adapters.db as db
from src.db.models.base import Base

DEFAULT_PAGE_SIZE = 25


T = TypeVar("T", bound=Base)


class Paginator(Generic[T]):
    """
    DB select statement paginator that helps with setting up queries
    that you want to paginate into chunks.

    Any usage of this should make sure that the select query passed in
    contains sorting information otherwise results may not be expected.

    Expected usage::
        from sqlalchemy import desc, select

        from src.db.models.opportunity_models import Opportunity
        from src.pagination.paginator import Paginator

        # Create a select statement that includes ordering and sorting
        stmt = select(User).order_by(desc("opportunity_id"))

        # Add any filters
        stmt = stmt.where(Opportunity.agency == "US-XYZ")

        # Use the paginator to get a specific page (page 2 in this case)
        paginator: Paginator[Opportunity] = Paginator(stmt, db_session, page_size=10)
        users: list[Opportunity] = paginator.page_at(page_offset=2)

    """

    def __init__(self, stmt: Select, db_session: db.Session, page_size: int = 25):
        self.stmt = stmt
        self.db_session = db_session

        if page_size <= 0:
            raise ValueError("Page size must be at least 1")

        self.page_size = page_size

        self.total_records = _get_record_count(self.db_session, self.stmt)
        self.total_pages = int(math.ceil(self.total_records / self.page_size))

    def page_at(self, page_offset: int) -> Sequence[T]:
        """
        Get a specific page for pagination
        """
        if page_offset <= 0 or page_offset > self.total_pages:
            return []

        offset = self.page_size * (page_offset - 1)

        return (
            self.db_session.execute(self.stmt.offset(offset).limit(self.page_size)).unique().scalars().all()
        )


def _get_record_count(db_session: db.Session, stmt: Select) -> int:
    # Simplify the query to instead be select count(*) from <whatever the query was>
    # and remove the order_by as we won't care for this query.
    count_stmt = stmt.order_by(None).with_only_columns(func.count(), maintain_column_froms=True)
    return db_session.execute(count_stmt).scalar_one()
