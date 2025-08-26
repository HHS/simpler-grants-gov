"""Generated Marshmallow schemas for CommonGrants Protocol models."""

from marshmallow import Schema, fields

class UnionSchema(Schema):
    # Placeholder schema for Union
    pass


class CustomFieldSchema(Schema):
    name = fields.String(description="Name of the custom field")
    field_type = fields.Nested(CustomFieldTypeSchema, description="The JSON schema type to use when de-serializing the `value` field", data_key="fieldType")
    schema_url = fields.String(description="Link to the full JSON schema for this custom field", data_key="schema")
    value = fields.Raw(description="Value of the custom field")
    description = fields.String(description="Description of the custom field's purpose")

class DateComparisonFilterSchema(Schema):
    operator = fields.Nested(ComparisonOperatorSchema, description="The operator to apply to the filter value")
    value = fields.Date(description="The date value to compare against")

class DateRangeSchema(Schema):
    min = fields.Date(description="The minimum date in the range")
    max = fields.Date(description="The maximum date in the range")

class DateRangeFilterSchema(Schema):
    operator = fields.Nested(RangeOperatorSchema, description="The operator to apply to the filter value")
    value = fields.Nested(DateRangeSchema, description="The date range value")

class DefaultFilterSchema(Schema):
    operator = fields.Raw(description="The operator to apply to the filter value")
    value = fields.Raw(description="The value to use for the filter operation")

class DefaultResponseSchema(Schema):
    status = fields.Integer(description="The HTTP status code")
    message = fields.String(description="The message")

class ErrorSchema(Schema):
    status = fields.Integer(description="The HTTP status code")
    message = fields.String(description="Human-readable error message")
    errors = fields.List(fields.Raw, description="List of errors")

class FilterInfoSchema(Schema):
    filters = fields.Raw(description="The filters applied to the response items")
    errors = fields.List(fields.Raw, description="Non-fatal errors that occurred during filtering")

class PaginatedResultsInfoSchema(Schema):
    page = fields.Integer(description="The page number to retrieve")
    page_size = fields.Integer(description="The number of items per page", data_key="pageSize")
    total_items = fields.Integer(description="The total number of items", data_key="totalItems")
    total_pages = fields.Integer(description="The total number of pages", data_key="totalPages")

class SortedResultsInfoSchema(Schema):
    sort_by = fields.String(description="The field to sort by", data_key="sortBy")
    custom_sort_by = fields.String(description="Implementation-defined sort key", data_key="customSortBy")
    sort_order = fields.String(description="The order in which the results are sorted", data_key="sortOrder")
    errors = fields.List(fields.Raw, description="Non-fatal errors that occurred during sorting")

class FilteredSchema(Schema):
    status = fields.Integer(description="The HTTP status code")
    message = fields.String(description="The message")
    items = fields.List(fields.Raw, description="Items from the current page")
    pagination_info = fields.Nested(PaginatedResultsInfoSchema, description="Details about the paginated results", data_key="paginationInfo")
    sort_info = fields.Nested(SortedResultsInfoSchema, description="The sort order of the items", data_key="sortInfo")
    filter_info = fields.Nested(FilterInfoSchema, description="The filters applied to the response items", data_key="filterInfo")

class MoneySchema(Schema):
    amount = fields.String(description="The amount of money")
    currency = fields.String(description="The ISO 4217 currency code (e.g., 'USD', 'EUR')")

class MoneyComparisonFilterSchema(Schema):
    operator = fields.Nested(ComparisonOperatorSchema, description="The operator to apply to the filter value")
    value = fields.Nested(MoneySchema, description="The money value to compare against")

class MoneyRangeSchema(Schema):
    min = fields.Nested(MoneySchema, description="The minimum amount in the range")
    max = fields.Nested(MoneySchema, description="The maximum amount in the range")

class MoneyRangeFilterSchema(Schema):
    operator = fields.Nested(RangeOperatorSchema, description="The operator to apply to the filter value")
    value = fields.Nested(MoneyRangeSchema, description="The money range value")

class StringArrayFilterSchema(Schema):
    operator = fields.Nested(ArrayOperatorSchema, description="The operator to apply to the filter value")
    value = fields.List(fields.String, description="The array of string values")

class OppDefaultFiltersSchema(Schema):
    status = fields.Nested(StringArrayFilterSchema, description="`status.value` matches one of the following values")
    close_date_range = fields.Nested(DateRangeFilterSchema, description="`keyDates.closeDate` is between the given range", data_key="closeDateRange")
    total_funding_available_range = fields.Nested(MoneyRangeFilterSchema, description="`funding.totalAmountAvailable` is between the given range", data_key="totalFundingAvailableRange")
    min_award_amount_range = fields.Nested(MoneyRangeFilterSchema, description="`funding.minAwardAmount` is between the given range", data_key="minAwardAmountRange")
    max_award_amount_range = fields.Nested(MoneyRangeFilterSchema, description="`funding.maxAwardAmount` is between the given range", data_key="maxAwardAmountRange")

class OppFiltersSchema(Schema):
    status = fields.Nested(StringArrayFilterSchema, description="`status.value` matches one of the following values")
    close_date_range = fields.Nested(DateRangeFilterSchema, description="`keyDates.closeDate` is between the given range", data_key="closeDateRange")
    total_funding_available_range = fields.Nested(MoneyRangeFilterSchema, description="`funding.totalAmountAvailable` is between the given range", data_key="totalFundingAvailableRange")
    min_award_amount_range = fields.Nested(MoneyRangeFilterSchema, description="`funding.minAwardAmount` is between the given range", data_key="minAwardAmountRange")
    max_award_amount_range = fields.Nested(MoneyRangeFilterSchema, description="`funding.maxAwardAmount` is between the given range", data_key="maxAwardAmountRange")
    custom_filters = fields.Dict(description="Additional custom filters to apply to the search", data_key="customFilters")

class OppFundingSchema(Schema):
    details = fields.String(description="Details about the funding available for this opportunity that don't fit other fields")
    total_amount_available = fields.Nested(MoneySchema, description="Total amount of funding available for this opportunity", data_key="totalAmountAvailable")
    min_award_amount = fields.Nested(MoneySchema, description="Minimum amount of funding granted per award", data_key="minAwardAmount")
    max_award_amount = fields.Nested(MoneySchema, description="Maximum amount of funding granted per award", data_key="maxAwardAmount")
    min_award_count = fields.Integer(description="Minimum number of awards granted", data_key="minAwardCount")
    max_award_count = fields.Integer(description="Maximum number of awards granted", data_key="maxAwardCount")
    estimated_award_count = fields.Integer(description="Estimated number of awards that will be granted", data_key="estimatedAwardCount")

class OppSortingSchema(Schema):
    sort_by = fields.Nested(OppSortBySchema, description="The field to sort by", data_key="sortBy")
    sort_order = fields.String(description="The sort order (asc or desc)", data_key="sortOrder")
    custom_sort_by = fields.String(description="The custom field to sort by when sortBy is 'custom'", data_key="customSortBy")

class OppStatusSchema(Schema):
    value = fields.Nested(OppStatusOptionsSchema, description="The status value, from a predefined set of options")
    custom_value = fields.String(description="A custom status value", data_key="customValue")
    description = fields.String(description="A human-readable description of the status")

class OppTimelineSchema(Schema):
    post_date = fields.Raw(description="The date (and time) at which the opportunity is posted", data_key="postDate")
    close_date = fields.Raw(description="The date (and time) at which the opportunity closes", data_key="closeDate")
    other_dates = fields.Dict(description="An optional map of other key dates or events in the opportunity timeline", data_key="otherDates")

class OpportunityBaseSchema(Schema):
    created_at = fields.DateTime(description="The timestamp (in UTC) at which the record was created.", data_key="createdAt")
    last_modified_at = fields.DateTime(description="The timestamp (in UTC) at which the record was last modified.", data_key="lastModifiedAt")
    id = fields.UUID(description="Globally unique id for the opportunity")
    title = fields.String(description="Title or name of the funding opportunity")
    status = fields.Nested(OppStatusSchema, description="Status of the opportunity")
    description = fields.String(description="Description of the opportunity's purpose and scope")
    funding = fields.Nested(OppFundingSchema, description="Details about the funding available")
    key_dates = fields.Nested(OppTimelineSchema, description="Key dates for the opportunity, such as when the application opens and closes", data_key="keyDates")
    source = fields.String(description="URL for the original source of the opportunity")
    custom_fields = fields.Dict(description="Additional custom fields specific to this opportunity", data_key="customFields")

class OpportunitiesListResponseSchema(Schema):
    status = fields.Integer(description="The HTTP status code")
    message = fields.String(description="The message")
    items = fields.List(fields.Nested(OpportunityBaseSchema), description="The list of opportunities")
    pagination_info = fields.Nested(PaginatedResultsInfoSchema, description="The pagination details", data_key="paginationInfo")

class OpportunitiesSearchResponseSchema(Schema):
    status = fields.Integer(description="The HTTP status code")
    message = fields.String(description="The message")
    items = fields.List(fields.Nested(OpportunityBaseSchema), description="The list of opportunities")
    pagination_info = fields.Nested(PaginatedResultsInfoSchema, description="The pagination details", data_key="paginationInfo")
    sort_info = fields.Nested(SortedResultsInfoSchema, description="The sorting details", data_key="sortInfo")
    filter_info = fields.Nested(FilterInfoSchema, description="The filter details", data_key="filterInfo")

class OpportunityResponseSchema(Schema):
    status = fields.Integer(description="The HTTP status code")
    message = fields.String(description="The message")
    data = fields.Nested(OpportunityBaseSchema, description="The opportunity")

class PaginatedBodyParamsSchema(Schema):
    page = fields.Integer(description="The page number to retrieve")
    page_size = fields.Integer(description="The number of items per page", data_key="pageSize")

class OpportunitySearchRequestSchema(Schema):
    search = fields.String(description="Search query string")
    filters = fields.Nested(OppFiltersSchema, description="Filters to apply to the opportunity search")
    sorting = fields.Nested(OppSortingSchema)
    pagination = fields.Nested(PaginatedBodyParamsSchema)

class PaginatedSchema(Schema):
    status = fields.Integer(description="The HTTP status code")
    message = fields.String(description="The message")
    items = fields.List(fields.Raw, description="Items from the current page")
    pagination_info = fields.Nested(PaginatedResultsInfoSchema, description="Details about the paginated results", data_key="paginationInfo")

class PaginatedBaseSchema(Schema):
    page = fields.Integer(description="The page number to retrieve")
    page_size = fields.Integer(description="The number of items per page", data_key="pageSize")

class SortedSchema(Schema):
    status = fields.Integer(description="The HTTP status code")
    message = fields.String(description="The message")
    items = fields.List(fields.Raw, description="Items from the current page")
    pagination_info = fields.Nested(PaginatedResultsInfoSchema, description="Details about the paginated results", data_key="paginationInfo")
    sort_info = fields.Nested(SortedResultsInfoSchema, description="The sort order of the items", data_key="sortInfo")

class StringComparisonFilterSchema(Schema):
    operator = fields.Nested(UnionTypeSchema, description="The operator to apply to the filter value")
    value = fields.String(description="The string value to compare against")

class SuccessSchema(Schema):
    status = fields.Integer(description="The HTTP status code")
    message = fields.String(description="The message")

class SystemMetadataSchema(Schema):
    created_at = fields.DateTime(description="The timestamp (in UTC) at which the record was created.", data_key="createdAt")
    last_modified_at = fields.DateTime(description="The timestamp (in UTC) at which the record was last modified.", data_key="lastModifiedAt")

class NumberArrayFilterSchema(Schema):
    operator = fields.Nested(ArrayOperatorSchema, description="The operator to apply to the filter value")
    value = fields.List(fields.Raw, description="The array of numeric values")

class NumberComparisonFilterSchema(Schema):
    operator = fields.Nested(ComparisonOperatorSchema, description="The comparison operator to apply to the filter value")
    value = fields.Raw(description="The numeric value to compare against")

class NumberRangeSchema(Schema):
    min = fields.Raw(description="The minimum value in the range")
    max = fields.Raw(description="The maximum value in the range")

class NumberRangeFilterSchema(Schema):
    operator = fields.Nested(RangeOperatorSchema, description="The operator to apply to the filter value")
    value = fields.Nested(NumberRangeSchema, description="The numeric range value")

class PaginatedQueryParamsSchema(Schema):
    page = fields.Integer(description="The page number to retrieve")
    page_size = fields.Integer(description="The number of items per page", data_key="pageSize")
