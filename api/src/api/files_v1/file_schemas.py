from src.api.schemas.extension import Schema, fields, validators
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
    file_location = fields.String(
        required=True,
        validate=validators.Regexp(
            r"^s3://[^/]+/.+",
            error_message="file_location must be an s3:// path",
        ),
        metadata={
            "description": "The s3 path where the scanned file now lives",
            "example": "s3://example-bucket/scanned/abc/example.txt",
        },
    )


class FileScanStatusUpdateResponseSchema(AbstractResponseSchema):
    pass


class CreatePresignedUploadRequestSchema(Schema):
    file_name = fields.String(
        required=True,
        validate=validators.Length(min=1, max=100),
        metadata={
            "description": "The name of the file to upload",
            "example": "example.txt",
        },
    )
    mime_type = fields.String(
        required=True,
        metadata={
            "description": "The mime/content type of the file to upload",
            "example": "text/plain",
        },
    )


class PresignedUploadDataSchema(Schema):
    url = fields.String(
        metadata={
            "description": "The presigned URL the caller should POST the file to",
            "example": "https://example-bucket.s3.amazonaws.com/",
        },
    )
    body = fields.Dict(
        metadata={
            "description": (
                "The form fields the caller must include in the multipart POST "
                "alongside the file. Send these as form data, with the file "
                "attached under the 'file' field."
            ),
        },
    )
    pending_file_id = fields.UUID(
        metadata={
            "description": "The ID of the pending file record",
        },
    )


class CreatePresignedUploadResponseSchema(AbstractResponseSchema):
    data = fields.Nested(PresignedUploadDataSchema)


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
