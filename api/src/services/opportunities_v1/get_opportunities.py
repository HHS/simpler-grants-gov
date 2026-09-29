from collections.abc import Iterator, Sequence

from sqlalchemy import Select, select
from sqlalchemy.orm import selectinload
from sqlalchemy.sql.base import ExecutableOption

import src.adapters.db as db
from src.db.models.agency_models import Agency
from src.db.models.opportunity_models import (
    CurrentOpportunitySummary,
    Opportunity,
    OpportunityChangeAudit,
    OpportunitySummary,
)


def get_searchable_opportunities(
    db_session: db.Session, batch_size: int | None = None
) -> Iterator[Sequence[Opportunity]]:
    """Get indexed opportunities

    This method returns opportunities that are indexed by our search
    library. Currently, that is AWS OpenSearch.

    The requirements for an opportunity to be indexed by our search library are as follows:
        - Is not a draft opportunity (is_draft = False)
        - Has an associated current_opportunity_summary with a valid status
    """
    stmt = _searchable_opportunities_query()

    return _get_opportunities(db_session, stmt, batch_size)


def get_changed_searchable_opportunities(
    db_session: db.Session, batch_size: int | None = None
) -> Iterator[Sequence[Opportunity]]:
    """
    Get searchable opportunities that have changed since they were last loaded to search
    """
    stmt = (
        _searchable_opportunities_query()
        .join(
            OpportunityChangeAudit,
            Opportunity.opportunity_id == OpportunityChangeAudit.opportunity_id,
        )
        .where(OpportunityChangeAudit.is_loaded_to_search.isnot(True))
    )

    return _get_opportunities(db_session, stmt, batch_size)


def _searchable_opportunities_query() -> Select[tuple[Opportunity]]:
    """Base query for opportunities that can be loaded into search"""
    return (
        select(Opportunity)
        .join(CurrentOpportunitySummary)
        .where(
            Opportunity.is_draft.is_(False),
            CurrentOpportunitySummary.opportunity_status.isnot(None),
        )
        .options(
            # Opportunity summary
            selectinload(Opportunity.current_opportunity_summary)
            .selectinload(CurrentOpportunitySummary.opportunity_summary)
            .options(
                selectinload(OpportunitySummary.link_funding_instruments),
                selectinload(OpportunitySummary.link_funding_categories),
                selectinload(OpportunitySummary.link_applicant_types),
            ),
            # Assistance listing number
            selectinload(Opportunity.opportunity_assistance_listings),
            # Agency
            selectinload(Opportunity.agency_record).selectinload(Agency.top_level_agency),
        )
    )


def _get_opportunities(
    db_session: db.Session, stmt: Select[tuple[Opportunity]], batch_size: int | None
) -> Iterator[Sequence[Opportunity]]:
    if batch_size is None:
        return iter([db_session.execute(stmt).scalars().all()])
    return db_session.execute(stmt.execution_options(yield_per=batch_size)).scalars().partitions()
