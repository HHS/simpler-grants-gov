import logging
from typing import Sequence, Tuple

from pydantic import BaseModel, Field
from sqlalchemy import Select, asc, desc, or_, select
from sqlalchemy.orm import noload, selectinload

import src.adapters.db as db
from src.db.models.opportunity_models import (
    CurrentOpportunitySummary,
    LinkOpportunitySummaryApplicantType,
    LinkOpportunitySummaryFundingCategory,
    LinkOpportunitySummaryFundingInstrument,
    Opportunity,
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


def _add_query_filters(
    stmt: Select[tuple[Opportunity]], query: str | None
) -> Select[tuple[Opportunity]]:
    if query is None or len(query) == 0:
        return stmt

    # TODO - will implement this in https://github.com/HHS/simpler-grants-gov/issues/1455

    return stmt


def _add_filters(
    stmt: Select[tuple[Opportunity]], filters: SearchOpportunityFilters | None
) -> Select[tuple[Opportunity]]:
    if filters is None:
        return stmt

    # We need to add joins so that the where clauses
    # can query against the tables that are relevant for these filters
    # Current + Opportunity Summary are always needed so just add them here
    stmt = stmt.join(CurrentOpportunitySummary).join(
        OpportunitySummary,
        CurrentOpportunitySummary.opportunity_summary_id
        == OpportunitySummary.opportunity_summary_id,
    )

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


def search_opportunities(
    db_session: db.Session, raw_search_params: dict
) -> Tuple[Sequence[Opportunity], PaginationInfo]:
    search_params = SearchOpportunityParams.model_validate(raw_search_params)

    sort_fn = asc if search_params.pagination.is_ascending else desc
    stmt = (
        select(Opportunity)
        # TODO - when we want to sort by non-opportunity table fields we'll need to change this
        .order_by(sort_fn(getattr(Opportunity, search_params.pagination.order_by))).where(
            Opportunity.is_draft.is_(False)
        )  # Only ever return non-drafts
        # Filter anything without a current opportunity summary
        .where(Opportunity.current_opportunity_summary != None)  # noqa: E711
        # selectinload makes it so all relationships are loaded and attached to the Opportunity
        # records that we end up fetching. It emits a separate "select * from table where opportunity_id in (x, y ,z)"
        # for each relationship. This is used instead of joinedload as it ends up more performant for complex models
        # Note that we set all_opportunity_summaries to noload as we don't need it in this API, and it would make the queries load more than necessary
        #
        # See: https://docs.sqlalchemy.org/en/20/orm/queryguide/relationships.html#what-kind-of-loading-to-use
        .options(selectinload("*"), noload(Opportunity.all_opportunity_summaries))
        # Distinct is necessary as the joins may add duplicate rows when multiple one-to-many relationships match
        # While SQLAlchemy will unique those rows for us, the SQL query still ends up with far less than the limit
        # we specify as that is done outside of the DB.
        # By having distinct, we do that ourselves in the query so that the limit we specify will be the actual amount
        # of records returned (assuming there at least that number to return)
        .distinct()
    )

    stmt = _add_query_filters(stmt, search_params.query)
    stmt = _add_filters(stmt, search_params.filters)

    paginator: Paginator[Opportunity] = Paginator(
        Opportunity, stmt, db_session, page_size=search_params.pagination.page_size
    )
    opportunities = paginator.page_at(page_offset=search_params.pagination.page_offset)
    pagination_info = PaginationInfo.from_pagination_params(search_params.pagination, paginator)

    return opportunities, pagination_info
