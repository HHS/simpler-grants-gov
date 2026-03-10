"""Transformation utilities for transforming SGG v1 models to/from CG models."""

import logging
from datetime import date, datetime

from common_grants_sdk.schemas.pydantic import (
    CustomField,
    CustomFieldType,
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
from pydantic import BaseModel, Field, HttpUrl, ValidationError

import src.util.datetime_util as datetime_util
from src.api.response import ValidationErrorDetail
from src.constants.lookup_constants import CommonGrantsEvent, OpportunityStatus
from src.db.models.opportunity_models import Opportunity
from src.validation.validation_constants import ValidationErrorType

logger = logging.getLogger(__name__)


class UrlValidator(BaseModel):
    """Validator for a URL string using Pydantic's HttpUrl with strict mode enabled.

    Mirrors the HttpUrl field in OpportunityBase and other CommonGrants models.
    TODO(@widal001): Replace this with a new field from SDK or relax strictness in SDK
    """

    url: HttpUrl = Field(strict=True)


def transform_status_to_cg(v1_status: OpportunityStatus) -> OppStatusOptions:
    """
    Transform v1 enum to CG enum.

    Args:
        OpportunityStatus: The v1 enum value

    Returns:
        OppStatusOptions: The CG enum value
    """

    STATUS_TO_CG_MAP = {
        OpportunityStatus.FORECASTED: OppStatusOptions.FORECASTED,
        OpportunityStatus.POSTED: OppStatusOptions.OPEN,
        OpportunityStatus.CLOSED: OppStatusOptions.CLOSED,
        OpportunityStatus.ARCHIVED: OppStatusOptions.CUSTOM,
    }

    cg_status = STATUS_TO_CG_MAP.get(v1_status, None)
    if not cg_status:
        logger.error(
            f"Transform failed for field `status`: unexpected OpportunityStatus value: {v1_status}"
        )
        cg_status = OppStatusOptions.FORECASTED

    return cg_status


def transform_status_from_cg(cg_status: OppStatusOptions) -> str:
    """
    Transform CG enum value to v1 enum value.

    Args:
        OppStatusOptions: The CG enum value

    Returns:
        v1_status: The v1 enum value
    """

    STATUS_FROM_CG_MAP = {
        OppStatusOptions.FORECASTED: OpportunityStatus.FORECASTED,
        OppStatusOptions.OPEN: OpportunityStatus.POSTED,
        OppStatusOptions.CLOSED: OpportunityStatus.CLOSED,
        OppStatusOptions.CUSTOM: OpportunityStatus.ARCHIVED,
    }

    v1_status = STATUS_FROM_CG_MAP.get(cg_status, None)
    if not v1_status:
        logger.error(
            f"Transform failed for field `status`: unexpected OpportunityStatusOptions value: {cg_status}"
        )
        v1_status = OpportunityStatus.FORECASTED

    return v1_status


def transform_sorting_from_cg(cg_sort_by: OppSortBy) -> str:
    """
    Transform CG enum value to v1 enum value.

    Args:
        OppSortBy: The CG enum value

    Returns:
        sort_by: The v1 enum value
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

    v1_sort_by = SORT_FIELD_MAPPING.get(cg_sort_by, None)

    if not v1_sort_by:
        logger.error(
            f"Transform failed for field `sort_by`: unexpected OppSortBy value: {cg_sort_by}"
        )
        v1_sort_by = OppSortBy.LAST_MODIFIED_AT

    return v1_sort_by


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

    return date_value


def validate_url(value: str | None) -> str | None:
    """
    Validate a URL string using Pydantic's HttpUrl validation.

    This ensures URLs are validated with the same strict rules that Pydantic
    uses, preventing validation errors when creating OpportunityBase objects.

    We use a minimal model with the same field definition as OpportunityBase
    to ensure we use the exact same validation rules.

    Args:
        value: The string to validate

    Returns:
        A valid URL string or None if validation fails
    """
    if value is None or value == "":
        return None
    try:
        valid = UrlValidator.model_validate({"url": value})
        return str(valid.url)
    except ValidationError:
        logger.info(
            f"URL validation failed for: {value}",
            extra={
                "cg_event": CommonGrantsEvent.URL_VALIDATION_ERROR,
                "url": value,
            },
        )
        return None


def transform_opportunity_to_cg(v1_opportunity: Opportunity) -> OpportunityBase | None:
    """
    Transform a v1 Opportunity model to CG format.

    Args:
        opportunity: A v1 Opportunity model instance

    Returns:
        OpportunityBase: A CommonGrants Protocol model instance
    """
    # Convert model to dict
    opp_data = {
        "opportunity_id": v1_opportunity.opportunity_id,
        "opportunity_title": v1_opportunity.opportunity_title or "Untitled Opportunity",
        "opportunity_status": v1_opportunity.opportunity_status,
        "legacy_opportunity_id": v1_opportunity.legacy_opportunity_id,
        "opportunity_number": v1_opportunity.opportunity_number,
        "category": v1_opportunity.category,
        "agency_code": v1_opportunity.agency_code,
        "agency_name": v1_opportunity.agency_name,
        "top_level_agency_name": v1_opportunity.top_level_agency_name,
        "opportunity_assistance_listings": [
            {
                "assistance_listing_number": listing.assistance_listing_number,
                "program_title": listing.program_title,
            }
            for listing in v1_opportunity.opportunity_assistance_listings
        ],
        "created_at": v1_opportunity.created_at,
        "updated_at": v1_opportunity.updated_at,
        "summmary": {},
    }

    # Extract opportunity summary
    if v1_opportunity.summary:
        opp_data["summary"] = {
            "summary_description": v1_opportunity.summary.summary_description,
            "post_date": v1_opportunity.summary.post_date,
            "close_date": v1_opportunity.summary.close_date,
            "estimated_total_program_funding": v1_opportunity.summary.estimated_total_program_funding,
            "award_ceiling": v1_opportunity.summary.award_ceiling,
            "award_floor": v1_opportunity.summary.award_floor,
            "additional_info_url": v1_opportunity.summary.additional_info_url,
            "additional_info_url_description": v1_opportunity.summary.additional_info_url_description,
            "agency_contact_description": v1_opportunity.summary.agency_contact_description,
            "agency_email_address": v1_opportunity.summary.agency_email_address,
            "agency_email_address_description": v1_opportunity.summary.agency_email_address_description,
            "fiscal_year": v1_opportunity.summary.fiscal_year,
            "is_cost_sharing": v1_opportunity.summary.is_cost_sharing,
            "created_at": v1_opportunity.summary.created_at,
            "updated_at": v1_opportunity.summary.updated_at,
        }

    opp_data["opportunity_attachments"] = [
        {
            "download_path": attachment.download_path,
            "file_name": attachment.file_name,
            "file_description": attachment.file_description,
            "file_size_bytes": attachment.file_size_bytes,
            "mime_type": attachment.mime_type,
            "created_at": attachment.created_at,
            "updated_at": attachment.updated_at,
        }
        for attachment in v1_opportunity.opportunity_attachments
    ]

    return transform_search_result_to_cg(opp_data)


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
        description = summary.get("summary_description") or "No description available"

        # Transform status
        v1_status = opp_data.get("opportunity_status", OpportunityStatus.POSTED)
        cg_status = transform_status_to_cg(v1_status)

        # Create timeline
        post_date = summary.get("post_date") if isinstance(summary, dict) else summary.post_date
        close_date = summary.get("close_date") if isinstance(summary, dict) else summary.close_date
        # TODO: summary.close_date is not the correct value! deadlines are stored in competitions
        timeline = OppTimeline(
            postDate=(
                SingleDateEvent(
                    name="Opportunity Posted",
                    date=_transform_date_to_cg(post_date),
                    description="Date when the opportunity was first posted",
                )
                if post_date
                else None
            ),
            closeDate=(
                SingleDateEvent(
                    name="Application Deadline",
                    date=_transform_date_to_cg(close_date),
                    description="Deadline for submitting applications",
                )
                if close_date
                else None
            ),
        )

        # Create money objects
        total_amount_money = None
        max_award_money = None
        min_award_money = None

        if summary.get("estimated_total_program_funding") is not None:
            total_amount_money = Money(
                amount=str(summary["estimated_total_program_funding"]),
                currency="USD",
            )
        if summary.get("award_ceiling") is not None:
            max_award_money = Money(
                amount=str(summary["award_ceiling"]),
                currency="USD",
            )
        if summary.get("award_floor") is not None:
            min_award_money = Money(
                amount=str(summary["award_floor"]),
                currency="USD",
            )

        return OpportunityBase(
            id=opportunity_id,
            title=title,
            description=description,
            status=OppStatus(value=cg_status),
            keyDates=timeline,
            funding=OppFunding(
                totalAmountAvailable=total_amount_money,
                maxAwardAmount=max_award_money,
                minAwardAmount=min_award_money,
            ),
            source=validate_url(summary.get("additional_info_url")),
            customFields=populate_custom_fields(opp_data),
            createdAt=summary.get("created_at") or datetime_util.utcnow(),
            lastModifiedAt=summary.get("updated_at") or datetime_util.utcnow(),
        )
    except Exception as e:
        logger.warning(
            f"Failed to transform search result to CommonGrants format: {e}",
            extra={
                "cg_event": CommonGrantsEvent.OPPORTUNITY_VALIDATION_ERROR,
                "opportunity_id": opportunity_id,
            },
        )
        return None


def populate_custom_fields(opp_data: dict) -> dict[str, CustomField] | None:
    """
    Helper function to assemble custom fields from the data and pass them back as part of the response.

    Args:
        opp_data: Opportunity data from the SGG database

    Returns:
        custom_fields: A dict with the values recovered from the input and stored in the appropriate field
    """

    custom_fields: dict[str, CustomField] = {}
    summary = opp_data.get("summary")

    attachments = opp_data.get("opportunity_attachments")
    if attachments:
        attachment_values = [
            {
                "downloadUrl": attachment.get("download_path"),
                "name": attachment.get("file_name"),
                "description": attachment.get("file_description"),
                "sizeInBytes": attachment.get("file_size_bytes"),
                "mimeType": attachment.get("mime_type"),
                "createdAt": attachment.get("created_at"),
                "lastModifiedAt": attachment.get("updated_at"),
            }
            for attachment in attachments
        ]
        custom_fields["attachments"] = CustomField(
            name="attachments",
            fieldType=CustomFieldType.ARRAY,
            value=attachment_values,
            description="Attachments such as NOFOs and supplemental documents for the opportunity",
        )

    legacy_opportunity_id = opp_data.get("legacy_opportunity_id")
    if legacy_opportunity_id is not None:
        custom_fields["legacyId"] = CustomField(
            name="legacyId",
            fieldType=CustomFieldType.INTEGER,
            value=legacy_opportunity_id,
            description="An integer ID for the opportunity, needed for compatibility with legacy systems",
        )

    federal_opportunity_number = opp_data.get("opportunity_number")
    if federal_opportunity_number is not None:
        custom_fields["federalOpportunityNumber"] = CustomField(
            name="federalOpportunityNumber",
            fieldType=CustomFieldType.STRING,
            value=federal_opportunity_number,
            description="The federal opportunity number assigned to this grant opportunity",
        )

    listings = opp_data.get("opportunity_assistance_listings")
    if listings:
        listing_values = [
            {
                "assistanceListingNumber": listing.get("assistance_listing_number"),
                "programTitle": listing.get("program_title"),
            }
            for listing in listings
        ]
        custom_fields["assistanceListing"] = CustomField(
            name="assistanceListing",
            fieldType=CustomFieldType.ARRAY,
            value=listing_values,
            description="The assistance listing number and program title for this opportunity",
        )

    category = opp_data.get("category")
    if category is not None:
        custom_fields["category"] = CustomField(
            name="category",
            fieldType=CustomFieldType.STRING,
            value=str(category),
            description="The category type of the grant opportunity",
        )

    agency = opp_data.get("agency_code")
    if agency is not None:
        custom_fields["agency"] = CustomField(
            name="agency",
            fieldType=CustomFieldType.OBJECT,
            value={
                "agencyCode": agency,
                "agencyName": opp_data.get("agency_name"),
                "topLevelAgencyName": opp_data.get("top_level_agency_name"),
            },
            description="Information about the agency offering this opportunity",
        )

    if summary:
        agency_contact_description = summary.get("agency_contact_description")
        agency_email_address = summary.get("agency_email_address")
        agency_email_address_description = summary.get("agency_email_address_description")
        if any(
            [agency_contact_description, agency_email_address, agency_email_address_description]
        ):
            custom_fields["agencyContact"] = CustomField(
                name="agencyContact",
                fieldType=CustomFieldType.OBJECT,
                value={
                    "description": agency_contact_description,
                    "emailAddress": agency_email_address,
                    "emailDescription": agency_email_address_description,
                },
                description="Contact information for the agency managing this opportunity",
            )

        additional_info_url = summary.get("additional_info_url")
        additional_info_url_description = summary.get("additional_info_url_description")
        if additional_info_url is not None:
            custom_fields["additionalInfo"] = CustomField(
                name="additionalInfo",
                fieldType=CustomFieldType.OBJECT,
                value={
                    "url": additional_info_url,
                    "description": additional_info_url_description,
                },
                description="URL and description for additional information about the opportunity",
            )

        fiscal_year = summary.get("fiscal_year")
        if fiscal_year is not None:
            custom_fields["fiscalYear"] = CustomField(
                name="fiscalYear",
                fieldType=CustomFieldType.NUMBER,
                value=fiscal_year,
                description="The fiscal year associated with this opportunity",
            )

        is_cost_sharing = summary.get("is_cost_sharing")
        if is_cost_sharing is not None:
            custom_fields["costSharing"] = CustomField(
                name="costSharing",
                fieldType=CustomFieldType.BOOLEAN,
                value=is_cost_sharing,
                description="Whether cost sharing or matching funds are required for this opportunity",
            )

    if custom_fields:
        return custom_fields
    else:
        return None


def build_money_range_filter(
    money_range_filter: MoneyRangeFilter | None, v1_field_name: str, v1_filters: dict
) -> None:
    """
    Helper function to build money range filters for v1 search format.

    Args:
        money_range_filter: The CommonGrants money range filter
        v1_field_name: The field name in v1 search format
        v1_filters: The v1 filters dict to update
    """
    if not money_range_filter:
        return

    if money_range_filter.value.min:
        v1_filters[v1_field_name] = {"min": int(float(money_range_filter.value.min.amount))}
    if money_range_filter.value.max:
        if v1_field_name not in v1_filters:
            v1_filters[v1_field_name] = {}
        v1_filters[v1_field_name]["max"] = int(float(money_range_filter.value.max.amount))


def build_filter_info(filters: OppFilters | None) -> FilterInfo:
    """
    Helper function to build FilterInfo from CommonGrants filters.

    Args:
        filters: The CommonGrants filters to transform

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
    search_term: str | None,
) -> dict:
    """
    Transform CG search request to v1 search format.

    Args:
        filters: CommonGrants filters to transform
        sorting: CommonGrants sorting parameters to transform
        pagination: CommonGrants pagination parameters to transform
        search_query: Optional search query string

    Returns:
        dict: search parameters in v1 format
    """
    # Convert pagination
    v1_pagination = {
        "page_offset": pagination.page,
        "page_size": pagination.page_size,
        "sort_order": [],
    }

    # Convert sorting
    sort_field = transform_sorting_from_cg(sorting.sort_by)
    sort_direction = "descending" if sorting.sort_order == "desc" else "ascending"

    v1_pagination["sort_order"] = [{"order_by": sort_field, "sort_direction": sort_direction}]

    # Convert filters
    v1_filters = {}

    if filters.status and filters.status.value:
        v1_statuses = [transform_status_from_cg(cg_status) for cg_status in filters.status.value]
        v1_filters["opportunity_status"] = {"one_of": v1_statuses}

    if filters.close_date_range:
        if filters.close_date_range.value.min:
            v1_filters["close_date"] = {
                "start_date": filters.close_date_range.value.min.isoformat()
            }
        if filters.close_date_range.value.max:
            if "close_date" not in v1_filters:
                v1_filters["close_date"] = {}
            v1_filters["close_date"]["end_date"] = filters.close_date_range.value.max.isoformat()

    # Build money range filters
    build_money_range_filter(
        filters.total_funding_available_range, "estimated_total_program_funding", v1_filters
    )
    build_money_range_filter(filters.min_award_amount_range, "award_floor", v1_filters)
    build_money_range_filter(filters.max_award_amount_range, "award_ceiling", v1_filters)

    # Build the complete v1 search parameters
    v1_params: dict[str, object] = {
        "pagination": v1_pagination,
        "experimental": {"scoring_rule": "default"},
    }

    if search_term:
        v1_params["query"] = search_term
        v1_params["query_operator"] = "AND"

    if v1_filters:
        v1_params["filters"] = v1_filters

    return v1_params


def transform_validation_error_from_cg(
    validation_error: ValidationError,
) -> list[ValidationErrorDetail]:
    """Transform a CG ValidationError to v1 format.

    Args:
        ValidationError: CG error object

    Returns:
        List of v1 error objects
    """
    validation_details: list[ValidationErrorDetail] = []

    # Handle pydantic ValidationError
    # Pydantic structures errors as: [{'loc': ('field',), 'msg': 'message', 'type': 'error_type'}]
    for error in validation_error.errors():
        field_path = ".".join(str(loc) for loc in error["loc"]) if error["loc"] else None
        message = error["msg"]

        detail = ValidationErrorDetail(
            field=field_path, message=message, type=ValidationErrorType.INVALID
        )
        validation_details.append(detail)

    return validation_details
