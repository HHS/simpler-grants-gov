from collections.abc import Iterator, Sequence
from datetime import datetime

from sqlalchemy import Select, func, select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.constants.lookup_constants import OpportunityStatus
from src.db.models.agency_models import Agency
from src.db.models.opportunity_models import (
    CurrentOpportunitySummary,
    Opportunity,
    OpportunityChangeAudit,
    OpportunitySummary,
    OpportunityVersion,
)

PUBLICLY_VISIBLE_STATUSES = [OpportunityStatus.FORECASTED, OpportunityStatus.POSTED]


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


def get_new_searchable_opportunities(
    db_session: db.Session, window_start: datetime, window_end: datetime
) -> Sequence[Opportunity]:
    """
    Get searchable opportunities that first became publicly visible within [window_start, window_end)

    An opportunity first became visible when its earliest forecasted or posted
    opportunity_version was created, so a status change (forecasted -> posted)
    does not make an opportunity new again. Opportunities from test agencies are excluded.
    """
    first_visible_at = func.min(OpportunityVersion.created_at)
    new_opportunity_ids = (
        select(OpportunityVersion.opportunity_id)
        .where(
            OpportunityVersion.opportunity_data["opportunity_status"].astext.in_(
                PUBLICLY_VISIBLE_STATUSES
            )
        )
        .group_by(OpportunityVersion.opportunity_id)
        .having(first_visible_at >= window_start, first_visible_at < window_end)
    )

    stmt = (
        _searchable_opportunities_query()
        .join(Agency, Opportunity.agency_id == Agency.agency_id)
        .where(
            CurrentOpportunitySummary.opportunity_status.in_(PUBLICLY_VISIBLE_STATUSES),
            Agency.is_test_agency.is_(False),
            Opportunity.opportunity_id.in_(new_opportunity_ids),
        )
        .order_by(Opportunity.opportunity_title, Opportunity.opportunity_id)
    )

    return db_session.execute(stmt).scalars().all()


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
