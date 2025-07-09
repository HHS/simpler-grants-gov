from src.api.competition_alpha.competition_schema import CompetitionAlphaSchema
from src.api.schemas.extension import Schema, fields
from src.api.schemas.response_schema import (
    AbstractResponseSchema,
    FileResponseSchema,
    WarningMixinSchema,
)
from src.constants.lookup_constants import ApplicationFormStatus, ApplicationStatus


class ApplicationStartRequestSchema(Schema):
    competition_id = fields.UUID(required=True)
    application_name = fields.String(required=False, allow_none=True)
    organization_id = fields.UUID(required=False, allow_none=True)


class ApplicationStartResponseDataSchema(Schema):
    application_id = fields.UUID()


class ApplicationStartResponseSchema(AbstractResponseSchema):
    data = fields.Nested(ApplicationStartResponseDataSchema())


class ApplicationUpdateRequestSchema(Schema):
    application_name = fields.String(required=True, allow_none=False)


class ApplicationUpdateResponseDataSchema(Schema):
    application_id = fields.UUID()


class ApplicationUpdateResponseSchema(AbstractResponseSchema):
    data = fields.Nested(ApplicationUpdateResponseDataSchema())

    application_form_status = fields.Enum(
        ApplicationFormStatus,
        metadata={"description": "Status indicating how much of a form has been filled out"},
    )


class ApplicationFormUpdateRequestSchema(Schema):
    application_response = fields.Dict(
        required=True,
        metadata={
            "description": "The form response data to update",
            "example": {"name": "John Doe", "email": "john@example.com"},
        },
    )
    is_included_in_submission = fields.Boolean(
        required=False,
        allow_none=True,
        metadata={
            "description": "Whether this form should be included in the application submission"
        },
    )


class ApplicationAttachmentNoLinkSchema(Schema):
    """A schema for an application attachment, but without a file_download URL"""

    application_attachment_id = fields.UUID(
        metadata={"description": "The ID of the application attachment"}
    )
    file_name = fields.String(
        metadata={
            "description": "The name of the application attachment file",
            "example": "my_example.pdf",
        }
    )
    mime_type = fields.String(
        metadata={
            "description": "The MIME type / content-type of the file",
            "example": "application/pdf",
        }
    )
    file_size_bytes = fields.Integer(
        metadata={"description": "The size of the attachment in bytes", "example": 12340}
    )

    created_at = fields.DateTime(
        metadata={"description": "When the application attachment was created"}
    )
    updated_at = fields.DateTime(
        metadata={"description": "When the application attachment was last updated"}
    )


class ApplicationFormGetResponseDataSchema(Schema):
    application_form_id = fields.UUID()
    application_id = fields.UUID()
    form_id = fields.UUID()
    application_response = fields.Dict()

    application_form_status = fields.Enum(
        ApplicationFormStatus,
        metadata={"description": "Status indicating how much of a form has been filled out"},
    )

    created_at = fields.DateTime(metadata={"description": "When the application form was created"})
    updated_at = fields.DateTime(
        metadata={"description": "When the application form was last updated"}
    )

    is_required = fields.Boolean(
        metadata={"description": "Whether this form is required for the application"}
    )

    is_included_in_submission = fields.Boolean(
        allow_none=True,
        metadata={"description": "Whether this form is included in the application submission"},
    )

    application_attachments = fields.List(fields.Nested(ApplicationAttachmentNoLinkSchema()))


class ApplicationFormUpdateResponseSchema(AbstractResponseSchema, WarningMixinSchema):
    data = fields.Nested(ApplicationFormGetResponseDataSchema())


class ApplicationUserSchema(Schema):
    """Schema for users associated with an application"""

    user_id = fields.UUID()
    email = fields.String()
    is_application_owner = fields.Boolean()


class SamGovEntitySchema(Schema):
    """Schema for SAM.gov entity information"""

    uei = fields.String()
    legal_business_name = fields.String()
    expiration_date = fields.Date()


class OrganizationSchema(Schema):
    """Schema for organization information"""

    organization_id = fields.UUID()
    sam_gov_entity = fields.Nested(SamGovEntitySchema(), allow_none=True)


class ApplicationFormGetResponseSchema(AbstractResponseSchema, WarningMixinSchema):
    data = fields.Nested(ApplicationFormGetResponseDataSchema())


class ApplicationGetResponseDataSchema(Schema):
    application_id = fields.UUID()
    competition = fields.Nested(CompetitionAlphaSchema())
    application_forms = fields.List(fields.Nested(ApplicationFormGetResponseDataSchema()))
    application_status = fields.Enum(ApplicationStatus)
    application_name = fields.String()
    users = fields.List(fields.Nested(ApplicationUserSchema()))
    organization = fields.Nested(OrganizationSchema(), allow_none=True)

    form_validation_warnings = fields.Dict(
        metadata={
            "description": "Specific form validation issues",
            "example": {
                "123e4567-e89b-12d3-a456-426614174000": [
                    {
                        "field": "$",
                        "message": "'name' is a required property",
                        "type": "required",
                        "value": None,
                    }
                ]
            },
        }
    )

    application_attachments = fields.List(fields.Nested(ApplicationAttachmentNoLinkSchema()))


class ApplicationGetResponseSchema(AbstractResponseSchema, WarningMixinSchema):
    data = fields.Nested(ApplicationGetResponseDataSchema())


class ApplicationAttachmentCreateSchema(Schema):
    application_attachment_id = fields.UUID(
        metadata={"description": "The ID of the uploaded application attachment"}
    )


class ApplicationAttachmentCreateResponseSchema(AbstractResponseSchema):
    data = fields.Nested(ApplicationAttachmentCreateSchema())


class ApplicationAttachmentCreateRequestSchema(Schema):
    file_attachment = fields.File(
        required=True,
        allow_none=False,
        metadata={"description": "The file to attach to an application"},
    )


class ApplicationAttachmentGetSchema(FileResponseSchema):
    application_attachment_id = fields.UUID(
        metadata={"description": "The ID of the uploaded application attachment"}
    )

    file_name = fields.String(
        metadata={
            "description": "The name of the application attachment file",
            "example": "my_example.pdf",
        }
    )

    mime_type = fields.String(
        metadata={
            "description": "The mime type / content type of the file",
            "example": "application/pdf",
        }
    )


class ApplicationAttachmentGetResponseSchema(AbstractResponseSchema):
    data = fields.Nested(ApplicationAttachmentGetSchema())


class ApplicationAttachmentDeleteResponseSchema(AbstractResponseSchema):
    data = fields.MixinField(metadata={"example": None})


class ApplicationAttachmentUpdateRequestSchema(Schema):
    file_attachment = fields.File(
        required=True,
        allow_none=False,
        metadata={"description": "The file to attach to an application"},
    )


class ApplicationAttachmentUpdateResponseSchema(AbstractResponseSchema):
    data = fields.Nested(ApplicationAttachmentCreateSchema())


class ApplicationFormInclusionUpdateRequestSchema(Schema):
    is_included_in_submission = fields.Boolean(
        required=True,
        metadata={
            "description": "Whether this form should be included in the application submission"
        },
    )


class ApplicationFormInclusionUpdateResponseSchema(AbstractResponseSchema):
    data = fields.Nested(ApplicationFormGetResponseDataSchema())
