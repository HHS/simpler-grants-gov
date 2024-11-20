from src.api.schemas.extension import Schema, fields
from src.api.schemas.response_schema import AbstractResponseSchema, FileResponseSchema
from src.constants.lookup_constants import ExtractType
from src.pagination.pagination_schema import generate_pagination_schema


class ExtractMetadataFilterV1Schema(Schema):
    extract_type = fields.Enum(
        ExtractType,
        allow_none=True,
        metadata={
            "description": "The type of extract to filter by",
            "example": "opportunities_csv",
        },
    )
    start_date = fields.Date(
        allow_none=True,
        metadata={
            "description": "The start date for filtering extracts",
            "example": "2023-10-01",
        },
    )
    end_date = fields.Date(
        allow_none=True,
        metadata={
            "description": "The end date for filtering extracts",
            "example": "2023-10-07",
        },
    )


class ExtractMetadataRequestSchema(AbstractResponseSchema):
    filters = fields.Nested(ExtractMetadataFilterV1Schema())
    pagination = fields.Nested(
        generate_pagination_schema(
            "ExtractMetadataPaginationV1Schema",
            ["created_at"],
        ),
        required=True,
    )


class ExtractMetadataResponseSchema(FileResponseSchema):
    extract_metadata_id = fields.Integer(
        metadata={"description": "The ID of the extract metadata", "example": 1}
    )
    extract_type = fields.String(
        metadata={"description": "The type of extract", "example": "opportunity_data_extract"}
    )


class ExtractMetadataListResponseSchema(AbstractResponseSchema):
    data = fields.List(
        fields.Nested(ExtractMetadataResponseSchema),
        metadata={"description": "A list of extract metadata records"},
    )
