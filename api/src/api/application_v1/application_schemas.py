from grants_shared.api.schemas.extension import Schema, fields
from grants_shared.api.schemas.response_schema import AbstractResponseSchema


class ApplicationAttachmentCreateRequestSchema(Schema):
    pending_file_id = fields.UUID(
        required=True,
        metadata={"description": "The ID of the pending (virus-scanned) file to attach"},
    )


class ApplicationAttachmentCreateDataSchema(Schema):
    application_attachment_id = fields.UUID(
        metadata={"description": "The ID of the created application attachment"}
    )
    created_at = fields.DateTime(
        metadata={"description": "Timestamp when the attachment was created"}
    )
    file_name = fields.String(
        metadata={
            "description": "The name of the attached file",
            "example": "doc-607113276.pdf",
        }
    )
    file_size_bytes = fields.Integer(
        metadata={"description": "The size of the file in bytes", "example": 29808}
    )
    mime_type = fields.String(
        metadata={
            "description": "The MIME type of the file",
            "example": "application/pdf",
        }
    )
    updated_at = fields.DateTime(
        metadata={"description": "Timestamp when the attachment was last updated"}
    )


class ApplicationAttachmentCreateResponseSchema(AbstractResponseSchema):
    data = fields.Nested(ApplicationAttachmentCreateDataSchema())
