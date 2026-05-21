from src.api.schemas.extension import Schema, fields
from src.api.schemas.response_schema import AbstractResponseSchema
from src.constants.lookup_constants import FileScanStatus


class FileScanStatusUpdateRequestSchema(Schema):
    file_scan_status = fields.Enum(
        FileScanStatus,
        required=True,
        metadata={
            "description": "The scan status to set on the pending file",
            "example": FileScanStatus.COMPLETE,
        },
    )


class FileScanStatusUpdateResponseSchema(AbstractResponseSchema):
    pass


class FileScanResultsDataSchema(Schema):
    status = fields.Enum(
        FileScanStatus,
        required=True,
        metadata={
            "description": "The current scan status of the file",
            "example": FileScanStatus.PENDING,
        },
    )


class FileScanResultsResponseSchema(Schema):
    """Schema for a single streamed chunk in the file-scan-results NDJSON response.

    Intentionally does not inherit from ``AbstractResponseSchema`` because each
    chunk is a partial update on the wire and does not carry ``status_code`` /
    ``message`` envelope fields.
    """

    data = fields.Nested(FileScanResultsDataSchema, required=True)
