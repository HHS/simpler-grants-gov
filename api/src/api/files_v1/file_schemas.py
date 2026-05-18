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
