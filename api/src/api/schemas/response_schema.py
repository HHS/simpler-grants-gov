from src.api.schemas.extension import Schema, fields
from src.pagination.pagination_schema import PaginationInfoSchema


class ValidationIssueSchema(Schema):
    type = fields.String(metadata={"description": "The type of error", "example": "invalid"})
    message = fields.String(
        metadata={"description": "The message to return", "example": "Not a valid string."}
    )
    field = fields.String(
        metadata={"description": "The field that failed", "example": "summary.summary_description"}
    )
    value = fields.String(
        metadata={"description": "The value that failed", "example": "invalid string"}
    )


class AbstractResponseSchema(Schema):
    message = fields.String(metadata={"description": "The message to return", "example": "Success"})
    data = fields.MixinField(metadata={"description": "The REST resource object"}, dump_default={})
    status_code = fields.Integer(
        metadata={"description": "The HTTP status code", "example": 200}, dump_default=200
    )


class WarningMixinSchema(Schema):
    warnings = fields.List(
        fields.Nested(ValidationIssueSchema()),
        metadata={
            "description": "A list of warnings - indicating something you may want to be aware of, but did not prevent handling of the request"
        },
        dump_default=[],
    )


class PaginationMixinSchema(Schema):
    pagination_info = fields.Nested(
        PaginationInfoSchema(),
        metadata={"description": "The pagination information for paginated endpoints"},
    )


class ErrorResponseSchema(Schema):
    data = fields.MixinField(
        metadata={
            "description": "Additional data that might be useful in resolving an error (see specific endpoints for details, this is used infrequently)",
            "example": {},
        },
        dump_default={},
    )
    message = fields.String(
        metadata={"description": "General description of the error", "example": "Error"}
    )
    status_code = fields.Integer(metadata={"description": "The HTTP status code of the error"})
    errors = fields.List(
        fields.Nested(ValidationIssueSchema()), metadata={"example": []}, dump_default=[]
    )
    internal_request_id = fields.String(
        metadata={
            "description": "An internal tracking ID",
            "example": "550e8400-e29b-41d4-a716-446655440000",
        }
    )


class FileResponseSchema(Schema):
    download_path = fields.String(
        metadata={
            "description": "The file's download path",
        },
    )
    file_size_bytes = fields.Integer(
        metadata={"description": "The size of the file in bytes", "example": 1024}
    )
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
