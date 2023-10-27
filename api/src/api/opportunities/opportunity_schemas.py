from apiflask import fields

from src.api.schemas import request_schema
from src.constants.lookup_constants import OpportunityCategory
from src.pagination.pagination_schema import PaginationSchema, generate_sorting_schema


class OpportunitySchema(request_schema.OrderedSchema):
    opportunity_id = fields.Integer(
        dump_only=True,
        metadata={"description": "The internal ID of the opportunity", "example": 12345},
    )

    opportunity_number = fields.String(
        metadata={"description": "The funding opportunity number", "example": "ABC-123-XYZ-001"}
    )
    opportunity_title = fields.String(
        metadata={
            "description": "The title of the opportunity",
            "example": "Research into conservation techniques",
        }
    )
    agency = fields.String(
        metadata={"description": "The agency who created the opportunity", "example": "US-ABC"}
    )

    category = fields.Enum(
        OpportunityCategory,
        by_value=True,
        metadata={
            "description": "The opportunity category",
            "example": OpportunityCategory.DISCRETIONARY,
        },
    )

    is_draft = fields.Boolean(
        metadata={"description": "Whether the opportunity is in a draft status", "example": False}
    )

    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class OpportunitySearchSchema(request_schema.OrderedSchema):
    opportunity_title = fields.String(
        metadata={
            "description": "The title of the opportunity to search for",
            "example": "research",
        }
    )
    category = fields.Enum(
        OpportunityCategory,
        by_value=True,
        metadata={
            "description": "The opportunity category to search for",
            "example": OpportunityCategory.DISCRETIONARY,
        },
    )
    is_draft = fields.Boolean(
        metadata={"description": "Whether to search for draft claims", "example": False}
    )

    sorting = fields.Nested(
        generate_sorting_schema(
            "OpportunitySortingSchema",
            order_by_fields=[
                "opportunity_id",
                "agency",
                "opportunity_number",
                "created_at",
                "updated_at",
            ],
        )(),
        required=True,
    )
    paging = fields.Nested(PaginationSchema(), required=True)
