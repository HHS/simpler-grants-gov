from src.api.schemas.extension import Schema, fields
from src.api.schemas.response_schema import AbstractResponseSchema, PaginationMixinSchema
from src.pagination.pagination_schema import generate_pagination_schema


class AgencyFilterV1Schema(Schema):
    agency_id = fields.UUID()


class AgencyListRequestSchema(Schema):
    filters = fields.Nested(AgencyFilterV1Schema())
    pagination = fields.Nested(
        generate_pagination_schema(
            "AgencyPaginationV1Schema",
            ["agency_code", "agency_name", "created_at"],
            default_sort_order=[{"order_by": "agency_code", "sort_direction": "ascending"}],
        ),
        required=True,
    )


class AgencyResponseSchema(Schema):
    """Schema for agency response"""

    agency_id = fields.UUID()
    agency_name = fields.String()
    agency_code = fields.String()

    top_level_agency = fields.Nested(lambda: AgencyResponseSchema(exclude=("top_level_agency",)))

    # Add timestamps from TimestampMixin
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


class AgencyListResponseSchema(AbstractResponseSchema, PaginationMixinSchema):
    data = fields.List(
        fields.Nested(AgencyResponseSchema),
        metadata={"description": "A list of agency records"},
    )
