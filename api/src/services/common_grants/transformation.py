"""Transformation utilities for converting native models to CommonGrants Protocol format."""

import logging
from datetime import date, datetime

from common_grants_sdk.schemas.pydantic import (
    FilterInfo,
    Money,
    MoneyRangeFilter,
    OppFilters,
    OppFunding,
    OpportunityBase,
    OppSortBy,
    OppSorting,
    OppStatus,
    OppStatusOptions,
    OppTimeline,
    PaginatedBodyParams,
    SingleDateEvent,
)

from src.constants.lookup_constants import OpportunityStatus
from src.db.models.opportunity_models import Opportunity, OpportunitySummary

logger = logging.getLogger(__name__)


def transform_status_to_cg(status_value: str) -> OppStatusOptions:
    """
    Transform opportunity status value to CommonGrants status.

    Args:
        status_value: The status string value

    Returns:
        OppStatusOptions: The CommonGrants status enum value
    """

    STATUS_TO_CG_MAP = {
        OpportunityStatus.FORECASTED.value: OppStatusOptions.FORECASTED,
        OpportunityStatus.POSTED.value: OppStatusOptions.OPEN,
        OpportunityStatus.CLOSED.value: OppStatusOptions.CLOSED,
        OpportunityStatus.ARCHIVED.value: OppStatusOptions.CUSTOM,
    }
    return STATUS_TO_CG_MAP.get(status_value, OppStatusOptions.CUSTOM)


def transform_status_from_cg(status: OppStatusOptions) -> str:
    """
    Transform CommonGrants opportunity status to legacy format.

    Args:
        OppStatusOptions: The CommonGrants status value

    Returns:
        status_value: The legacy format status value
    """

    STATUS_FROM_CG_MAP = {
        OppStatusOptions.FORECASTED: OpportunityStatus.FORECASTED,
        OppStatusOptions.OPEN: OpportunityStatus.POSTED,
        OppStatusOptions.CLOSED: OpportunityStatus.CLOSED,
        OppStatusOptions.CUSTOM: OpportunityStatus.ARCHIVED,
    }

    return STATUS_FROM_CG_MAP.get(status, OppStatusOptions.CUSTOM)


def transform_sorting_from_cg(sortBy: OppSortBy) -> str:
    """
    Transform CommonGrants sorting field to legacy format.

    Args:
        OppSortBy: The CommonGrants sorting field value

    Returns:
        status_value: The legacy format sorting field value
    """

    SORT_FIELD_MAPPING = {
        OppSortBy.LAST_MODIFIED_AT: "updated_at",
        OppSortBy.CREATED_AT: "created_at",
        OppSortBy.TITLE: "opportunity_title",
        OppSortBy.STATUS: "opportunity_status",
        OppSortBy.CLOSE_DATE: "close_date",
        OppSortBy.MAX_AWARD_AMOUNT: "award_ceiling",
        OppSortBy.MIN_AWARD_AMOUNT: "award_floor",
        OppSortBy.TOTAL_FUNDING_AVAILABLE: "estimated_total_program_funding",
    }

    return SORT_FIELD_MAPPING.get(sortBy, "updated_at")


def _get_opportunity_summary(opportunity: Opportunity) -> OpportunitySummary | None:
    """
    Helper function to safely access the opportunity summary.

    Args:
        opportunity: The opportunity model

    Returns:
        The opportunity summary if available, None otherwise
    """
    if (
        opportunity.current_opportunity_summary
        and opportunity.current_opportunity_summary.opportunity_summary
    ):
        return opportunity.current_opportunity_summary.opportunity_summary
    return None


def _transform_date_to_cg(date_value: date | datetime | None) -> date | None:
    """
    Transform a date or datetime value to a date for CommonGrants format.

    Args:
        date_value: The date or datetime value to transform

    Returns:
        A date object or None if the input is None
    """
    if date_value is None:
        return None

    if isinstance(date_value, datetime):
        return date_value.date()

    # At this point, date_value must be a date object
    return date_value


def validate_url(url: str | None) -> str | None:
    """
    Validate and fix a URL string.

    Args:
        url: The URL string to validate and fix

    Returns:
        A valid URL string or None if the URL cannot be fixed
    """
    if not url:
        return None

    # If the URL already has a protocol, return it as is
    if url.startswith(("http://", "https://")):
        return url

    # If it's a domain without protocol, add https://
    if "." in url and not url.startswith(("http://", "https://", "ftp://", "file://")):
        return f"https://{url}"

    # If it's not a valid URL format, return None
    return None


def transform_opportunity_to_cg(opportunity: Opportunity) -> OpportunityBase:
    """
    Transform a native Opportunity model to CommonGrants Protocol format.

    Args:
        opportunity: The native Opportunity model from the database

    Returns:
        OpportunityBase: The opportunity in CommonGrants Protocol format
    """
    # Transform status
    status_value = (
        opportunity.opportunity_status.value
        if opportunity.opportunity_status
        else OpportunityStatus.POSTED
    )
    opp_status = transform_status_to_cg(status_value)

    # Extract opportunity summary
    summary = _get_opportunity_summary(opportunity)

    # Create timeline
    timeline = OppTimeline(
        postDate=(
            SingleDateEvent(
                name="Opportunity Posted",
                date=_transform_date_to_cg(opportunity.created_at),
                description="Date when the opportunity was first posted",
            )
            if opportunity.created_at
            else None
        ),
        closeDate=(
            SingleDateEvent(
                name="Application Deadline",
                date=_transform_date_to_cg(summary.close_date),
                description="Deadline for submitting applications",
            )
            if summary and summary.close_date
            else None
        ),
    )

    # Create funding objects
    total_amount_money = None
    if summary and summary.estimated_total_program_funding is not None:
        total_amount_money = Money(
            amount=str(summary.estimated_total_program_funding),
            currency="USD",
        )

    max_award_money = None
    if summary and summary.award_ceiling is not None:
        max_award_money = Money(
            amount=str(summary.award_ceiling),
            currency="USD",
        )

    min_award_money = None
    if summary and summary.award_floor is not None:
        min_award_money = Money(
            amount=str(summary.award_floor),
            currency="USD",
        )

    funding = OppFunding(
        totalAmountAvailable=total_amount_money,
        maxAwardAmount=max_award_money,
        minAwardAmount=min_award_money,
    )

    return OpportunityBase(
        id=opportunity.opportunity_id,
        title=opportunity.opportunity_title or "Untitled Opportunity",
        description=(
            summary.summary_description
            if summary and summary.summary_description
            else "No description available"
        ),
        status=OppStatus(value=opp_status),
        keyDates=timeline,
        funding=funding,
        source=validate_url(summary.additional_info_url if summary else None),
        custom_fields={},
        createdAt=opportunity.created_at,
        lastModifiedAt=opportunity.updated_at,
    )


def transform_search_result_to_cg(opp_data: dict) -> OpportunityBase | None:
    """
    Transform a search result dictionary to CommonGrants OpportunityBase format.

    Args:
        opp_data: Dictionary containing opportunity data from search results

    Returns:
        OpportunityBase: The opportunity in CommonGrants format, or None if transformation fails
    """
    try:
        # Extract basic fields from dict
        opportunity_id = opp_data.get("opportunity_id")
        title = opp_data.get("opportunity_title", "Untitled Opportunity")
        summary = opp_data.get("summary", {})
        description = summary.get("summary_description", "No description available")

        # Map status
        status_value = opp_data.get("opportunity_status", OpportunityStatus.POSTED)
        opp_status = transform_status_to_cg(status_value)

        # Create timeline
        timeline = OppTimeline(
            postDate=(
                SingleDateEvent(
                    name="Opportunity Posted",
                    date=_transform_date_to_cg(opp_data.get("created_at")),
                    description="Date when the opportunity was first posted",
                )
                if opp_data.get("created_at")
                else None
            ),
            closeDate=(
                SingleDateEvent(
                    name="Application Deadline",
                    date=_transform_date_to_cg(summary.get("close_date")),
                    description="Deadline for submitting applications",
                )
                if summary.get("close_date")
                else None
            ),
        )

        # Create funding objects
        total_amount_money = None
        if summary.get("estimated_total_program_funding") is not None:
            total_amount_money = Money(
                amount=str(summary["estimated_total_program_funding"]),
                currency="USD",
            )

        max_award_money = None
        if summary.get("award_ceiling") is not None:
            max_award_money = Money(
                amount=str(summary["award_ceiling"]),
                currency="USD",
            )

        min_award_money = None
        if summary.get("award_floor") is not None:
            min_award_money = Money(
                amount=str(summary["award_floor"]),
                currency="USD",
            )

        funding = OppFunding(
            totalAmountAvailable=total_amount_money,
            maxAwardAmount=max_award_money,
            minAwardAmount=min_award_money,
        )

        return OpportunityBase(
            id=opportunity_id,
            title=title,
            description=description,
            status=OppStatus(value=opp_status),
            keyDates=timeline,
            funding=funding,
            source=validate_url(summary.get("additional_info_url")),
            custom_fields={},
            createdAt=opp_data.get("created_at"),
            lastModifiedAt=opp_data.get("updated_at"),
        )
    except Exception as e:
        logger.error(f"Failed to transform search result to CommonGrants format: {e}")
        return None


def build_money_range_filter(
    money_range_filter: MoneyRangeFilter | None, legacy_field_name: str, legacy_filters: dict
) -> None:
    """
    Helper function to build money range filters for legacy search format.

    Args:
        money_range_filter: The CommonGrants money range filter
        legacy_field_name: The field name in legacy search format
        legacy_filters: The legacy filters dict to update
    """
    if not money_range_filter:
        return

    if money_range_filter.value.min:
        legacy_filters[legacy_field_name] = {"min": int(float(money_range_filter.value.min.amount))}
    if money_range_filter.value.max:
        if legacy_field_name not in legacy_filters:
            legacy_filters[legacy_field_name] = {}
        legacy_filters[legacy_field_name]["max"] = int(float(money_range_filter.value.max.amount))


def build_filter_info(filters: OppFilters | None) -> FilterInfo:
    """
    Helper function to build FilterInfo from CommonGrants filters.

    Args:
        filters: The CommonGrants filters to convert

    Returns:
        FilterInfo: The filter info for the response
    """
    applied_filters = {}
    if filters:
        if filters.status is not None:
            applied_filters["status"] = filters.status.model_dump()
        if filters.close_date_range is not None:
            applied_filters["closeDateRange"] = filters.close_date_range.model_dump()
        if filters.total_funding_available_range is not None:
            applied_filters["totalFundingAvailableRange"] = (
                filters.total_funding_available_range.model_dump()
            )
        if filters.min_award_amount_range is not None:
            applied_filters["minAwardAmountRange"] = filters.min_award_amount_range.model_dump()
        if filters.max_award_amount_range is not None:
            applied_filters["maxAwardAmountRange"] = filters.max_award_amount_range.model_dump()
        if filters.custom_filters is not None:
            applied_filters["customFilters"] = filters.custom_filters

    return FilterInfo(
        filters=applied_filters,
        errors=[],
    )


def transform_search_request_from_cg(
    filters: OppFilters,
    sorting: OppSorting,
    pagination: PaginatedBodyParams,
    search_query: str | None,
) -> dict:
    """
    Convert CommonGrants search parameters to legacy search format.

    This function maps CommonGrants protocol parameters to the legacy
    search API format used by the search client.

    Args:
        filters: CommonGrants filters to convert
        sorting: CommonGrants sorting parameters to convert
        pagination: CommonGrants pagination parameters to convert
        search_query: Optional search query string

    Returns:
        dict: Legacy search parameters in the format expected by the search client
    """
    # Convert pagination
    legacy_pagination = {
        "page_offset": pagination.page,
        "page_size": pagination.page_size,
        "sort_order": [],
    }

    # Convert sorting
    sort_field = transform_sorting_from_cg(sorting.sort_by)
    sort_direction = "descending" if sorting.sort_order == "desc" else "ascending"

    legacy_pagination["sort_order"] = [{"order_by": sort_field, "sort_direction": sort_direction}]

    # Convert filters
    legacy_filters = {}

    if filters.status and filters.status.value:
        legacy_statuses = [
            transform_status_from_cg(status_value) for status_value in filters.status.value
        ]
        legacy_filters["opportunity_status"] = {"one_of": legacy_statuses}

    if filters.close_date_range:
        if filters.close_date_range.value.min:
            legacy_filters["close_date"] = {
                "start_date": filters.close_date_range.value.min.isoformat()
            }
        if filters.close_date_range.value.max:
            if "close_date" not in legacy_filters:
                legacy_filters["close_date"] = {}
            legacy_filters["close_date"][
                "end_date"
            ] = filters.close_date_range.value.max.isoformat()

    # Build money range filters
    build_money_range_filter(
        filters.total_funding_available_range, "estimated_total_program_funding", legacy_filters
    )
    build_money_range_filter(filters.min_award_amount_range, "award_floor", legacy_filters)
    build_money_range_filter(filters.max_award_amount_range, "award_ceiling", legacy_filters)

    # Build the complete legacy search parameters
    legacy_params: dict[str, object] = {
        "pagination": legacy_pagination,
        "experimental": {"scoring_rule": "default"},
    }

    if search_query:
        legacy_params["query"] = search_query
        legacy_params["query_operator"] = "AND"

    if legacy_filters:
        legacy_params["filters"] = legacy_filters

    return legacy_params
