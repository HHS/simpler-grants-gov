from src.api.schemas.extension import Schema, fields
from src.api.schemas.response_schema import AbstractResponseSchema, PaginationMixinSchema
from src.pagination.pagination_schema import generate_pagination_schema


class AgencyFilterV1Schema(Schema):
    agency_id = fields.UUID()
    active = fields.Boolean()


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


class AgencySearchRequestSchema(AgencyListRequestSchema):
    query = fields.String()


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


class AgencyV1Schema(Schema):
    agency_id = fields.UUID(
        metadata={"description": "The internal ID of the agency", "example": "123res45"},
    )
    agency_name = fields.String(
        allow_none=False,
        metadata={
            "description": "The name of the agency who created the opportunity",
            "example": "Department of Examples",
        },
    )
    agency_code = fields.String(
        allow_none=False,
        metadata={"description": "The agency who created the opportunity", "example": "ABC"},
    )
    top_level_agency = fields.Nested(
        lambda: AgencyV1Schema(exclude=("top_level_agency",)), allow_none=True
    )

    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class AgencySearchResponseV1Schema(AbstractResponseSchema, PaginationMixinSchema):
    data = fields.Nested(AgencyV1Schema(many=True))
