"""Complete Marshmallow schemas for CommonGrants Protocol models.

This file contains all Marshmallow schemas that correspond to Pydantic models,
organized by category for better maintainability.

NOTICE: This file is COPIED directly from
simpler-grants-protocol/lib/python-sdk/common_grants_sdk/schemas/marshmallow/
and then MODIFIED to change imports as described below.

    ORIGINAL:
        from marshmallow import Schema, fields, validate
    MODIFIED
        from src.api.schemas.extension import Schema, fields, validators as validate
"""

from typing import Any

from src.api.schemas.extension import Schema, fields
from src.api.schemas.extension import validators as validate

# =============================================================================
# BASIC FIELD TYPES
# =============================================================================


class Money(Schema):
    """Represents a monetary amount in a specific currency."""

    amount = fields.String(required=True, metadata={"description": "The amount of money"})
    currency = fields.String(
        required=True,
        metadata={"description": "The ISO 4217 currency code (e.g., 'USD', 'EUR')"},
    )


class SingleDateEvent(Schema):
    """Represents a single date event."""

    name = fields.String(
        allow_none=True, metadata={"description": "Human-readable name of the event"}
    )
    eventType = fields.String(allow_none=True, metadata={"description": "Type of event"})
    description = fields.String(
        allow_none=True,
        metadata={"description": "Description of what this event represents"},
    )
    date = fields.Date(
        allow_none=True,
        metadata={"description": "Date of the event in ISO 8601 format: YYYY-MM-DD"},
    )
    time = fields.Time(
        allow_none=True,
        metadata={"description": "Time of the event in ISO 8601 format: HH:MM:SS"},
    )


class DateRange(Schema):
    """Range filter for date values."""

    # Note: The `min` and `max` field types are `Raw` instead of `Date` because
    # when they are `Date` type they cause a runtime serialization error in an
    # APIFlask api implementation (e.g. simpler-grants-gov/api), and the only
    # currently known workaround is to use the `Raw` type instead
    min = fields.Raw(allow_none=True, metadata={"description": "The minimum date in the range"})
    max = fields.Raw(allow_none=True, metadata={"description": "The maximum date in the range"})


class MoneyRange(Schema):
    """Range filter for money values."""

    min = fields.Nested(
        Money,
        allow_none=True,
        metadata={"description": "The minimum amount in the range"},
    )
    max = fields.Nested(
        Money,
        allow_none=True,
        metadata={"description": "The maximum amount in the range"},
    )


# =============================================================================
# FIELD MODELS
# =============================================================================


class EventType(fields.String):
    """Enum field for event types."""

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(
            validate=validate.OneOf(["singleDate", "dateRange", "other"]),
            metadata={
                "description": "Type of event (e.g., a single date, a date range, or a custom event)"
            },
            **kwargs
        )


class EventBase(Schema):
    """Base model for all events."""

    name = fields.String(
        required=True,
        metadata={
            "description": "Human-readable name of the event (e.g., 'Application posted', 'Question deadline')"
        },
    )
    eventType = EventType(
        required=True,
    )
    description = fields.String(
        allow_none=True,
        metadata={"description": "Description of what this event represents"},
    )


class DateRangeEvent(EventBase):
    """Description of an event that has a start and end date (and possible time) associated with it."""

    startDate = fields.Date(
        required=True,
        metadata={"description": "Start date of the event in ISO 8601 format: YYYY-MM-DD"},
    )
    startTime = fields.Time(
        allow_none=True,
        metadata={"description": "Start time of the event in ISO 8601 format: HH:MM:SS"},
    )
    endDate = fields.Date(
        required=True,
        metadata={"description": "End date of the event in ISO 8601 format: YYYY-MM-DD"},
    )
    endTime = fields.Time(
        allow_none=True,
        metadata={"description": "End time of the event in ISO 8601 format: HH:MM:SS"},
    )


class OtherEvent(EventBase):
    """Description of an event that is not a single date or date range."""

    details = fields.String(
        allow_none=True,
        metadata={"description": "Details of the event's timeline (e.g. 'Every other Tuesday')"},
    )


class SystemMetadata(Schema):
    """System-managed metadata fields for tracking record creation and modification."""

    createdAt = fields.DateTime(
        required=True,
        metadata={"description": "The timestamp (in UTC) at which the record was created."},
    )
    lastModifiedAt = fields.DateTime(
        required=True,
        metadata={"description": "The timestamp (in UTC) at which the record was last modified."},
    )


class CustomFieldType(fields.String):
    """Enum field for custom field types."""

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(
            validate=validate.OneOf(["string", "number", "integer", "boolean", "object", "array"]),
            metadata={
                "description": "The JSON schema type to use when de-serializing the value field"
            },
            **kwargs
        )


class CustomField(Schema):
    """Schema for defining custom fields on a record."""

    name = fields.String(required=True)
    fieldType = CustomFieldType(required=True)
    schema = fields.URL(allow_none=True)
    value = fields.Raw(required=True)
    description = fields.String(allow_none=True)


# =============================================================================
# FILTER INFO MODELS
# =============================================================================


class FilterInfo(Schema):
    """Information about applied filters."""

    filters = fields.Raw(
        required=True,
        metadata={"description": "The filters applied to the response items"},
    )
    errors = fields.List(
        fields.String,
        load_default=[],
        metadata={"description": "Non-fatal errors that occurred during filtering"},
    )


# =============================================================================
# MODEL MODELS
# =============================================================================


class OppStatusOptions(fields.String):
    """Enum field for opportunity status options."""

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(
            validate=validate.OneOf(["forecasted", "open", "custom", "closed"]),
            metadata={"description": "The status of the opportunity"},
            **kwargs
        )


class OppStatus(Schema):
    """Status of an opportunity."""

    value = fields.String(
        allow_none=True,
        metadata={"description": "The status value, from a predefined set of options"},
    )
    customValue = fields.String(allow_none=True, metadata={"description": "A custom status value"})
    description = fields.String(
        allow_none=True,
        metadata={"description": "A human-readable description of the status"},
    )


class OppFunding(Schema):
    """Funding details for an opportunity."""

    details = fields.String(
        allow_none=True,
        metadata={
            "description": "Details about the funding available for this opportunity that don't fit other fields"
        },
    )
    totalAmountAvailable = fields.Nested(
        Money,
        allow_none=True,
        metadata={"description": "Total amount of funding available for this opportunity"},
    )
    minAwardAmount = fields.Nested(
        Money,
        allow_none=True,
        metadata={"description": "Minimum amount of funding granted per award"},
    )
    maxAwardAmount = fields.Nested(
        Money,
        allow_none=True,
        metadata={"description": "Maximum amount of funding granted per award"},
    )
    minAwardCount = fields.Integer(
        allow_none=True,
        metadata={"description": "Minimum number of awards granted"},
    )
    maxAwardCount = fields.Integer(
        allow_none=True,
        metadata={"description": "Maximum number of awards granted"},
    )
    estimatedAwardCount = fields.Integer(
        allow_none=True,
        metadata={"description": "Estimated number of awards that will be granted"},
    )


class OppTimeline(Schema):
    """Timeline for an opportunity."""

    postDate = fields.Nested(
        SingleDateEvent,
        allow_none=True,
        metadata={"description": "The date (and time) at which the opportunity is posted"},
    )
    closeDate = fields.Nested(
        SingleDateEvent,
        allow_none=True,
        metadata={"description": "The date (and time) at which the opportunity closes"},
    )
    otherDates = fields.Raw(
        allow_none=True,
        metadata={
            "description": "An optional map of other key dates or events in the opportunity timeline"
        },
    )


class OpportunityBase(Schema):
    """Base opportunity model."""

    createdAt = fields.Raw(
        allow_none=True,
        metadata={"description": "The timestamp (in UTC) at which the record was created."},
    )
    lastModifiedAt = fields.Raw(
        allow_none=True,
        metadata={"description": "The timestamp (in UTC) at which the record was last modified."},
    )
    id = fields.UUID(
        allow_none=True,
        metadata={"description": "Globally unique id for the opportunity"},
    )
    title = fields.String(
        allow_none=True,
        metadata={"description": "Title or name of the funding opportunity"},
    )
    status = fields.Nested(
        OppStatus,
        allow_none=True,
        metadata={"description": "Status of the opportunity"},
    )
    description = fields.String(
        allow_none=True,
        metadata={"description": "Description of the opportunity's purpose and scope"},
    )
    funding = fields.Nested(
        OppFunding,
        allow_none=True,
        metadata={"description": "Details about the funding available"},
    )
    keyDates = fields.Nested(
        OppTimeline,
        allow_none=True,
        metadata={
            "description": "Key dates for the opportunity, such as when the application opens and closes"
        },
    )
    source = fields.Raw(
        allow_none=True,
        metadata={"description": "URL for the original source of the opportunity"},
    )
    customFields = fields.Dict(
        keys=fields.String(),
        values=fields.Nested(CustomField),
        allow_none=True,
        metadata={"description": "Additional custom fields specific to this opportunity"},
    )


# =============================================================================
# FILTER MODELS
# =============================================================================


class EquivalenceOperator(fields.String):
    """Enum field for equivalence operators."""

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(
            validate=validate.OneOf(["eq", "neq"]),
            metadata={"description": "The operator to apply to the filter"},
            **kwargs
        )


class ComparisonOperator(fields.String):
    """Enum field for comparison operators."""

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(
            validate=validate.OneOf(["gt", "gte", "lt", "lte"]),
            metadata={
                "description": "Operators that filter a field based on a comparison to a value"
            },
            **kwargs
        )


class ArrayOperator(fields.String):
    """Enum field for array operators."""

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(
            validate=validate.OneOf(["in", "notIn"]),
            metadata={"description": "Operators that filter a field based on an array of values"},
            **kwargs
        )


class StringOperator(fields.String):
    """Enum field for string operators."""

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(
            validate=validate.OneOf(["like", "notLike"]),
            metadata={"description": "Operators that filter a field based on a string value"},
            **kwargs
        )


class RangeOperator(fields.String):
    """Enum field for range operators."""

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(
            validate=validate.OneOf(["between", "outside"]),
            metadata={"description": "Operators that filter a field based on a range of values"},
            **kwargs
        )


class DefaultFilter(Schema):
    """Base class for all filters that matches Core v0.1.0 DefaultFilter structure."""

    operator = fields.String(
        required=True,
        metadata={"description": "The operator to apply to the filter value"},
    )
    value = fields.Raw(
        required=True,
        metadata={"description": "The value to use for the filter operation"},
    )


class StringArrayFilter(Schema):
    """Filter for string arrays."""

    operator = fields.String(
        allow_none=True,
        metadata={"description": "The operator to apply to the filter value"},
    )
    value = fields.List(
        fields.String,
        allow_none=True,
        metadata={"description": "The array of string values"},
    )


class StringComparisonFilter(Schema):
    """Filter that applies a comparison to a string value."""

    operator = fields.String(
        required=True,
        metadata={"description": "The operator to apply to the filter value"},
    )
    value = fields.String(
        required=True,
        metadata={"description": "The string value to compare against"},
    )


class DateRangeFilter(Schema):
    """Filter for date ranges."""

    operator = fields.String(
        allow_none=True,
        metadata={"description": "The operator to apply to the filter value"},
    )
    value = fields.Nested(
        DateRange, allow_none=True, metadata={"description": "The date range value"}
    )


class DateComparisonFilter(Schema):
    """Filter that matches dates against a specific value."""

    operator = fields.String(
        required=True,
        metadata={"description": "The operator to apply to the filter value"},
    )
    value = fields.Date(
        required=True,
        metadata={"description": "The date value to compare against"},
    )


class MoneyRangeFilter(Schema):
    """Filter for money ranges."""

    operator = fields.String(
        allow_none=True,
        metadata={"description": "The operator to apply to the filter value"},
    )
    value = fields.Nested(
        MoneyRange, allow_none=True, metadata={"description": "The money range value"}
    )


class MoneyComparisonFilter(Schema):
    """Filter for money values using comparison operators."""

    operator = fields.String(
        required=True,
        metadata={"description": "The operator to apply to the filter value"},
    )
    value = fields.Nested(
        Money,
        required=True,
        metadata={"description": "The money value to compare against"},
    )


class NumberRange(Schema):
    """Represents a range between two numeric values."""

    min: Any = fields.Float(
        required=True,
        metadata={"description": "The minimum value in the range"},
    )
    max: Any = fields.Float(
        required=True,
        metadata={"description": "The maximum value in the range"},
    )


class NumberComparisonFilter(Schema):
    """Filter that matches numbers against a specific value."""

    operator = fields.String(
        required=True,
        metadata={"description": "The comparison operator to apply to the filter value"},
    )
    value: Any = fields.Float(
        required=True,
        metadata={"description": "The numeric value to compare against"},
    )


class NumberRangeFilter(Schema):
    """Filter that matches numbers within a specified range."""

    operator = fields.String(
        required=True,
        metadata={"description": "The operator to apply to the filter value"},
    )
    value = fields.Nested(
        NumberRange,
        required=True,
        metadata={"description": "The numeric range value"},
    )


class NumberArrayFilter(Schema):
    """Filter that matches against an array of numeric values."""

    operator = fields.String(
        required=True,
        metadata={"description": "The operator to apply to the filter value"},
    )
    value = fields.List(
        fields.Float,
        required=True,
        metadata={"description": "The array of numeric values"},
    )


class OppDefaultFilters(Schema):
    """Standard filters available for searching opportunities."""

    status = fields.Nested(
        StringArrayFilter,
        allow_none=True,
        metadata={"description": "`status.value` matches one of the following values"},
    )
    closeDateRange = fields.Nested(
        DateRangeFilter,
        allow_none=True,
        metadata={"description": "`keyDates.closeDate` is between the given range"},
    )
    totalFundingAvailableRange = fields.Nested(
        MoneyRangeFilter,
        allow_none=True,
        metadata={"description": "`funding.totalAmountAvailable` is between the given range"},
    )
    minAwardAmountRange = fields.Nested(
        MoneyRangeFilter,
        allow_none=True,
        metadata={"description": "`funding.minAwardAmount` is between the given range"},
    )
    maxAwardAmountRange = fields.Nested(
        MoneyRangeFilter,
        allow_none=True,
        metadata={"description": "`funding.maxAwardAmount` is between the given range"},
    )


class OppFilters(Schema):
    """Filters for opportunity search."""

    status = fields.Nested(
        StringArrayFilter,
        allow_none=True,
        metadata={"description": "`status.value` matches one of the following values"},
    )
    closeDateRange = fields.Nested(
        DateRangeFilter,
        allow_none=True,
        metadata={"description": "`keyDates.closeDate` is between the given range"},
    )
    totalFundingAvailableRange = fields.Nested(
        MoneyRangeFilter,
        allow_none=True,
        metadata={"description": "`funding.totalAmountAvailable` is between the given range"},
    )
    minAwardAmountRange = fields.Nested(
        MoneyRangeFilter,
        allow_none=True,
        metadata={"description": "`funding.minAwardAmount` is between the given range"},
    )
    maxAwardAmountRange = fields.Nested(
        MoneyRangeFilter,
        allow_none=True,
        metadata={"description": "`funding.maxAwardAmount` is between the given range"},
    )
    customFilters = fields.Raw(
        allow_none=True,
        metadata={"description": "Additional custom filters to apply to the search"},
    )


# =============================================================================
# PAGINATION MODELS
# =============================================================================


class PaginatedBodyParams(Schema):
    """Parameters for pagination in the body of a request."""

    page = fields.Integer(allow_none=True, metadata={"description": "The page number to retrieve"})
    pageSize = fields.Integer(
        allow_none=True, metadata={"description": "The number of items per page"}
    )


class PaginatedQueryParams(Schema):
    """Parameters for pagination in query parameters."""

    page = fields.Integer(allow_none=True, metadata={"description": "The page number to retrieve"})
    pageSize = fields.Integer(
        allow_none=True, metadata={"description": "The number of items per page"}
    )


class PaginatedResultsInfo(Schema):
    """Information about the pagination of a list."""

    page = fields.Integer(allow_none=True, metadata={"description": "The page number to retrieve"})
    pageSize = fields.Integer(
        allow_none=True, metadata={"description": "The number of items per page"}
    )
    totalItems = fields.Integer(
        required=True, metadata={"description": "The total number of items"}
    )
    totalPages = fields.Integer(
        required=True, metadata={"description": "The total number of pages"}
    )


# =============================================================================
# SORTING MODELS
# =============================================================================


class SortOrder(fields.String):
    """Enum field for sort order options."""

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(
            validate=validate.OneOf(["asc", "desc"]),
            metadata={"description": "Sort order enumeration"},
            **kwargs
        )


class SortBase(Schema):
    """Base class for sorting-related models."""

    sortBy = fields.String(
        required=True,
        metadata={"description": "The field to sort by"},
    )
    customSortBy = fields.String(
        allow_none=True,
        metadata={"description": "Implementation-defined sort key"},
    )


class SortQueryParams(SortBase):
    """Query parameters for sorting."""

    sortOrder = SortOrder(
        allow_none=True,
    )


class SortBodyParams(SortBase):
    """Sorting parameters included in the request body."""

    sortOrder = SortOrder(
        allow_none=True,
    )


class OppSortBy(fields.String):
    """Enum field for opportunity sort by options."""

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(
            validate=validate.OneOf(
                [
                    "lastModifiedAt",
                    "createdAt",
                    "title",
                    "status.value",
                    "keyDates.closeDate",
                    "funding.maxAwardAmount",
                    "funding.minAwardAmount",
                    "funding.totalAmountAvailable",
                    "funding.estimatedAwardCount",
                    "custom",
                ]
            ),
            metadata={"description": "The field to sort by"},
            **kwargs
        )


class OppSorting(Schema):
    """Sorting parameters for opportunities."""

    sortBy = OppSortBy(required=True)
    sortOrder = fields.String(
        allow_none=True,
        metadata={"description": "The sort order (asc or desc)"},
    )
    customSortBy = fields.String(
        allow_none=True,
        metadata={"description": "The custom field to sort by when sortBy is 'custom'"},
    )


class SortedResultsInfo(Schema):
    """Information about sorting results."""

    sortBy = fields.String(required=True, metadata={"description": "The field to sort by"})
    customSortBy = fields.String(
        allow_none=True,
        metadata={"description": "Implementation-defined sort key"},
    )
    sortOrder = fields.String(
        required=True,
        metadata={"description": "The order in which the results are sorted"},
    )
    errors = fields.List(
        fields.String,
        load_default=[],
        metadata={"description": "Non-fatal errors that occurred during sorting"},
    )


# =============================================================================
# REQUEST MODELS
# =============================================================================


class OpportunitySearchRequest(Schema):
    """Request schema for searching opportunities."""

    search = fields.String(allow_none=True, metadata={"description": "Search query string"})
    filters = fields.Nested(
        OppFilters,
        allow_none=True,
        metadata={"description": "Filters to apply to the opportunity search"},
    )
    sorting = fields.Nested(
        OppSorting,
        allow_none=True,
        metadata={"description": "Sorting parameters for opportunities"},
    )
    pagination = fields.Nested(PaginatedBodyParams, allow_none=True)


# =============================================================================
# RESPONSE MODELS
# =============================================================================


class DefaultResponse(Schema):
    """Response for a default operation."""

    status = fields.Integer(
        required=True,
        metadata={"description": "The HTTP status code"},
    )
    message = fields.String(
        required=True,
        metadata={"description": "The message"},
    )


class Success(DefaultResponse):
    """Default success response."""

    status = fields.Integer(
        dump_default=200,
        metadata={"description": "The HTTP status code"},
    )
    message = fields.String(
        dump_default="Success",
        metadata={"description": "The message"},
    )


class Paginated(Success):
    """Template for a response with a paginated list of items."""

    items = fields.List(
        fields.Raw,
        required=True,
        metadata={"description": "Items from the current page"},
    )
    paginationInfo = fields.Nested(
        PaginatedResultsInfo,
        required=True,
        metadata={"description": "Details about the paginated results"},
    )


class Sorted(Paginated):
    """A paginated list of items with a sort order."""

    sortInfo = fields.Nested(
        SortedResultsInfo,
        required=True,
        metadata={"description": "The sort order of the items"},
    )


class Filtered(Sorted):
    """A paginated list of items with a filter."""

    filterInfo = fields.Nested(
        FilterInfo,
        required=True,
        metadata={"description": "The filters applied to the response items"},
    )


class OpportunitiesListResponse(Schema):
    """Response schema for listing opportunities."""

    status = fields.Integer(required=True, metadata={"description": "The HTTP status code"})
    message = fields.String(required=True, metadata={"description": "The message"})
    items = fields.List(
        fields.Nested(OpportunityBase),
        required=True,
        metadata={"description": "The list of opportunities"},
    )
    paginationInfo = fields.Nested(
        PaginatedResultsInfo,
        required=True,
        metadata={"description": "The pagination details"},
    )


class OpportunitiesSearchResponse(Schema):
    """Response schema for searching opportunities."""

    status = fields.Integer(required=True, metadata={"description": "The HTTP status code"})
    message = fields.String(required=True, metadata={"description": "The message"})
    items = fields.List(
        fields.Nested(OpportunityBase),
        required=True,
        metadata={"description": "The list of opportunities"},
    )
    paginationInfo = fields.Nested(
        PaginatedResultsInfo,
        required=True,
        metadata={"description": "The pagination details"},
    )
    sortInfo = fields.Nested(
        SortedResultsInfo,
        required=True,
        metadata={"description": "The sorting details"},
    )
    filterInfo = fields.Nested(
        FilterInfo,
        required=True,
        metadata={"description": "The filter details"},
    )


class OpportunityResponse(Schema):
    """Response schema for a single opportunity."""

    status = fields.Integer(required=True, metadata={"description": "The HTTP status code"})
    message = fields.String(required=True, metadata={"description": "The message"})
    data = fields.Nested(
        OpportunityBase, required=True, metadata={"description": "The opportunity"}
    )


# =============================================================================
# ERROR RESPONSE MODELS
# =============================================================================


class Error(Schema):
    """Standard error response schema."""

    status = fields.Integer(required=True, metadata={"description": "The HTTP status code"})
    message = fields.String(required=True, metadata={"description": "Human-readable error message"})
    errors = fields.List(fields.Raw, required=True, metadata={"description": "List of errors"})


class ValidationError(Schema):
    """Validation error schema."""

    loc = fields.List(fields.Raw, required=True, metadata={"description": "Location of the error"})
    msg = fields.String(required=True, metadata={"description": "Error message"})
    type = fields.String(required=True, metadata={"description": "Error type"})


class HTTPValidationError(Schema):
    """HTTP validation error response schema."""

    detail = fields.List(
        fields.Nested(ValidationError),
        required=True,
        metadata={"description": "Validation error details"},
    )


class HTTPError(Schema):
    """APIFlask HTTP error schema."""

    status = fields.Integer(required=True, metadata={"description": "HTTP status code"})
    message = fields.String(required=True, metadata={"description": "Human-readable error message"})
    errors = fields.List(fields.Raw, required=True, metadata={"description": "List of errors"})


# =============================================================================
# TYPE MODELS (for reference, these are type aliases in Pydantic)
# =============================================================================

# Note: These are type aliases in Pydantic and don't need Marshmallow equivalents
# ISODate = date
# ISOTime = time
# UTCDateTime = datetime
# DecimalString = Annotated[str, BeforeValidator(validate_decimal_string)]

# =============================================================================
# BASE MODELS (for reference)
# =============================================================================

# Note: CommonGrantsBaseModel is a base class in Pydantic
# but not used in Marshmallow
