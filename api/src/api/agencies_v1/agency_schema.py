from src.api.opportunities_v1.opportunity_schemas import SearchQueryOperator
from src.api.schemas.extension import Schema, fields, validators
from src.api.schemas.response_schema import AbstractResponseSchema, PaginationMixinSchema
from src.api.schemas.search_schema import BoolSearchSchemaBuilder, StrSearchSchemaBuilder
from src.constants.lookup_constants import OpportunityStatus
from src.pagination.pagination_schema import generate_pagination_schema


class AgencyFilterV1Schema(Schema):
    agency_id = fields.UUID()
    active = fields.Boolean()


class AgencySearchFilterV1Schema(Schema):
    has_active_opportunity = fields.Nested(
        BoolSearchSchemaBuilder("HasActiveOpportunityFilterV1Schema")
        .with_one_of(example=True)
        .build()
    )

    opportunity_statuses = fields.Nested(
        StrSearchSchemaBuilder("OpportunityStatusesFilterV1Schema")
        .with_one_of(example="archived")
        .build()
    )
    is_test_agency = fields.Nested(
        BoolSearchSchemaBuilder("IsTestAgencyFilterV1Schema").with_one_of(example=True).build()
    )


class AgencySearchRequestSchema(Schema):
    query = fields.String(
        metadata={
            "description": "Query string which searches against several text fields",
            "example": "research",
        },
        validate=[validators.Length(min=1, max=100)],
    )
    query_operator = fields.Enum(
        SearchQueryOperator,
        load_default=SearchQueryOperator.OR,
        metadata={
            "description": "Query operator for combining search conditions",
            "example": "OR",
        },
    )
    filters = fields.Nested(AgencySearchFilterV1Schema())
    pagination = fields.Nested(
        generate_pagination_schema(
            "AgencySearchPaginationV1Schema",
            ["agency_code", "agency_name"],
            default_sort_order=[{"order_by": "agency_code", "sort_direction": "ascending"}],
        ),
        required=True,
    )


class AgencyV1Schema(Schema):
    agency_id = fields.UUID(
        metadata={"description": "The internal ID of the agency"},
    )
    agency_name = fields.String(
        metadata={
            "description": "The name of the agency who created the opportunity",
            "example": "Department of Examples",
        },
    )
    agency_code = fields.String(
        metadata={"description": "The agency who created the opportunity", "example": "ABC"},
    )
    top_level_agency = fields.Nested(
        lambda: AgencyV1Schema(exclude=("top_level_agency",)), allow_none=True
    )
    is_test_agency = fields.Boolean(
        metadata={
            "description": "Indicates if the agency is a test agency.",
            "example": False,
        },
    )
    opportunity_statuses = fields.List(
        fields.Enum(OpportunityStatus),
        metadata={
            "description": "List of opportunity statuses the agency is linked with.",
            "example": ["posted"],
        },
    )
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class AgencySearchResponseV1Schema(AbstractResponseSchema, PaginationMixinSchema):
    data = fields.Nested(AgencyV1Schema(many=True))
