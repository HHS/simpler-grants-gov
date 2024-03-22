import logging
from typing import Any, Sequence, Tuple

from pydantic import BaseModel, Field
from sqlalchemy import Select, asc, desc, nulls_last, or_, select
from sqlalchemy.orm import InstrumentedAttribute, noload, selectinload

import src.adapters.db as db
from src.db.models.opportunity_models import (
    CurrentOpportunitySummary,
    LinkOpportunitySummaryApplicantType,
    LinkOpportunitySummaryFundingCategory,
    LinkOpportunitySummaryFundingInstrument,
    Opportunity,
    OpportunityAssistanceListing,
    OpportunitySummary,
)
from src.pagination.pagination_models import PaginationInfo, PaginationParams
from src.pagination.paginator import Paginator

logger = logging.getLogger(__name__)


class SearchOpportunityFilters(BaseModel):
    funding_instrument: dict | None = Field(default=None)
    funding_category: dict | None = Field(default=None)
    applicant_type: dict | None = Field(default=None)
    opportunity_status: dict | None = Field(default=None)
    agency: dict | None = Field(default=None)


class SearchOpportunityParams(BaseModel):
    pagination: PaginationParams

    query: str | None = Field(default=None)
    filters: SearchOpportunityFilters | None = Field(default=None)


def _join_stmt_to_current_summary(stmt: Select[tuple[Any]]) -> Select[tuple[Any]]:
    # Utility method to add this join to a select statement as we do this in a few places
    #
    # We need to add joins so that the where/order_by clauses
    # can query against the tables that are relevant for these filters
    return stmt.join(CurrentOpportunitySummary).join(
        OpportunitySummary,
        CurrentOpportunitySummary.opportunity_summary_id
        == OpportunitySummary.opportunity_summary_id,
    )


def _add_query_filters(stmt: Select[tuple[Any]], query: str | None) -> Select[tuple[Any]]:
    if query is None or len(query) == 0:
        return stmt

    ilike_query = f"%{query}%"

    # Add a left join to the assistance listing table to filter by any of its values
    stmt = stmt.outerjoin(
        OpportunityAssistanceListing,
        Opportunity.opportunity_id == OpportunityAssistanceListing.opportunity_id,
    )

    """
    This adds the following to the inner query (assuming the query value is "example")

    WHERE
        (opportunity.opportunity_title ILIKE '%example%'
        OR opportunity.opportunity_number ILIKE '%example%'
        OR opportunity.agency ILIKE '%example%'
        OR opportunity_summary.summary_description ILIKE '%example%'
        OR opportunity_assistance_listing.assistance_listing_number = 'example'
        OR opportunity_assistance_listing.program_title ILIKE '%example%'))

    Note that SQLAlchemy escapes everything and queries are actually written like:

        opportunity.opportunity_number ILIKE % (opportunity_number_1)
    """
    stmt = stmt.where(
        or_(
            # Title partial match
            Opportunity.opportunity_title.ilike(ilike_query),
            # Number partial match
            Opportunity.opportunity_number.ilike(ilike_query),
            # Agency (code) partial match
            Opportunity.agency.ilike(ilike_query),
            # Summary description partial match
            OpportunitySummary.summary_description.ilike(ilike_query),
            # assistance listing number matches exactly or program title partial match
            OpportunityAssistanceListing.assistance_listing_number == query,
            OpportunityAssistanceListing.program_title.ilike(ilike_query),
        )
    )

    return stmt


def _add_filters(
    stmt: Select[tuple[Any]], filters: SearchOpportunityFilters | None
) -> Select[tuple[Any]]:
    if filters is None:
        return stmt

    if filters.opportunity_status is not None:
        one_of_opportunity_statuses = filters.opportunity_status.get("one_of")

        if one_of_opportunity_statuses:
            stmt = stmt.where(
                CurrentOpportunitySummary.opportunity_status.in_(one_of_opportunity_statuses)
            )

    if filters.funding_instrument is not None:
        stmt = stmt.join(LinkOpportunitySummaryFundingInstrument)

        one_of_funding_instruments = filters.funding_instrument.get("one_of")
        if one_of_funding_instruments:
            stmt = stmt.where(
                LinkOpportunitySummaryFundingInstrument.funding_instrument.in_(
                    one_of_funding_instruments
                )
            )

    if filters.funding_category is not None:
        stmt = stmt.join(LinkOpportunitySummaryFundingCategory)

        one_of_funding_categories = filters.funding_category.get("one_of")
        if one_of_funding_categories:
            stmt = stmt.where(
                LinkOpportunitySummaryFundingCategory.funding_category.in_(
                    one_of_funding_categories
                )
            )

    if filters.applicant_type is not None:
        stmt = stmt.join(LinkOpportunitySummaryApplicantType)

        one_of_applicant_types = filters.applicant_type.get("one_of")
        if one_of_applicant_types:
            stmt = stmt.where(
                LinkOpportunitySummaryApplicantType.applicant_type.in_(one_of_applicant_types)
            )

    if filters.agency is not None:
        # Note that we filter against the agency code in the opportunity, not in the summary
        one_of_agencies = filters.agency.get("one_of")
        if one_of_agencies:
            # This produces something like:
            #   ..WHERE ((opportunity.agency ILIKE 'US-ABC%') OR (opportunity.agency ILIKE 'HHS%'))
            stmt = stmt.where(
                or_(*[Opportunity.agency.istartswith(agency) for agency in one_of_agencies])
            )

    return stmt


def _add_order_by(
    stmt: Select[tuple[Opportunity]], pagination: PaginationParams
) -> Select[tuple[Opportunity]]:
    # This generates an order by command like:
    #
    #   ORDER BY opportunity.opportunity_id DESC NULLS LAST

    # This determines whether we use ascending or descending when building the query
    sort_fn = asc if pagination.is_ascending else desc

    match pagination.order_by:
        case "opportunity_id":
            field: InstrumentedAttribute = Opportunity.opportunity_id
        case "opportunity_number":
            field = Opportunity.opportunity_number
        case "opportunity_title":
            field = Opportunity.opportunity_title
        case "post_date":
            field = OpportunitySummary.post_date
            # Need to add joins to the query stmt to order by field from opportunity summary
            stmt = _join_stmt_to_current_summary(stmt)
        case "close_date":
            field = OpportunitySummary.close_date
            # Need to add joins to the query stmt to order by field from opportunity summary
            stmt = _join_stmt_to_current_summary(stmt)
        case "agency_code":
            field = Opportunity.agency
        case _:
            # If this exception happens, it means our API schema
            # allows for values we don't have implemented. This
            # means we can't determine how to sort / need to correct
            # the mismatch.
            msg = f"Unconfigured sort_by parameter {pagination.order_by} provided, cannot determine how to sort."
            raise Exception(msg)

    # Any values that are null will automatically be sorted to the end
    return stmt.order_by(nulls_last(sort_fn(field)))


def search_opportunities(
    db_session: db.Session, raw_search_params: dict
) -> Tuple[Sequence[Opportunity], PaginationInfo]:
    search_params = SearchOpportunityParams.model_validate(raw_search_params)

    """
    We create an inner query which handles all of the filtering and returns
    a set of opportunity IDs for the outer query to filter against. This query
    ends up looking like (varying based on exact filters):

        SELECT DISTINCT
            opportunity.opportunity_id
        FROM opportunity
            JOIN current_opportunity_summary ON opportunity.opportunity_id = current_opportunity_summary.opportunity_id
            JOIN opportunity_summary ON current_opportunity_summary.opportunity_summary_id = opportunity_summary.opportunity_summary_id
            JOIN link_opportunity_summary_funding_instrument ON opportunity_summary.opportunity_summary_id = link_opportunity_summary_funding_instrument.opportunity_summary_id
            JOIN link_opportunity_summary_funding_category ON opportunity_summary.opportunity_summary_id = link_opportunity_summary_funding_category.opportunity_summary_id
            JOIN link_opportunity_summary_applicant_type ON opportunity_summary.opportunity_summary_id = link_opportunity_summary_applicant_type.opportunity_summary_id
        WHERE
            opportunity.is_draft IS FALSE
            AND(EXISTS (
                SELECT
                    1 FROM current_opportunity_summary
                WHERE
                    opportunity.opportunity_id = current_opportunity_summary.opportunity_id))
        AND link_opportunity_summary_funding_instrument.funding_instrument_id IN(1, 2, 3, 4))
    """
    inner_stmt = (
        select(Opportunity.opportunity_id).where(
            Opportunity.is_draft.is_(False)
        )  # Only ever return non-drafts
        # Filter anything without a current opportunity summary
        .where(Opportunity.current_opportunity_summary != None)  # noqa: E711
        # Distinct the opportunity IDs returned so that the outer query
        # has fewer results to query against
        .distinct()
    )

    # Current + Opportunity Summary are always needed so just add them here
    inner_stmt = _join_stmt_to_current_summary(inner_stmt)
    inner_stmt = _add_query_filters(inner_stmt, search_params.query)
    inner_stmt = _add_filters(inner_stmt, search_params.filters)

    #
    #
    """
    The outer query handles sorting and filters against the inner query described above.
    This ends up looking like (joins to current opportunity if ordering by other fields):

    SELECT
            opportunity.opportunity_id,
            opportunity.opportunity_title,
            -- and so on for the opportunity table fields
        FROM opportunity
        WHERE
            opportunity.opportunity_id in ( /* the above subquery */ )
        ORDER BY
            opportunity.opportunity_id DESC NULLS LAST
        LIMIT 25 OFFSET 100
    """
    stmt = (
        select(Opportunity).where(Opportunity.opportunity_id.in_(inner_stmt))
        # selectinload makes it so all relationships are loaded and attached to the Opportunity
        # records that we end up fetching. It emits a separate "select * from table where opportunity_id in (x, y ,z)"
        # for each relationship. This is used instead of joinedload as it ends up more performant for complex models
        # Note that we set all_opportunity_summaries to noload as we don't need it in this API, and it would make the queries load more than necessary
        #
        # See: https://docs.sqlalchemy.org/en/20/orm/queryguide/relationships.html#what-kind-of-loading-to-use
        .options(selectinload("*"), noload(Opportunity.all_opportunity_summaries))
    )

    stmt = _add_order_by(stmt, search_params.pagination)

    paginator: Paginator[Opportunity] = Paginator(
        Opportunity, stmt, db_session, page_size=search_params.pagination.page_size
    )
    opportunities = paginator.page_at(page_offset=search_params.pagination.page_offset)
    pagination_info = PaginationInfo.from_pagination_params(search_params.pagination, paginator)

    return opportunities, pagination_info
