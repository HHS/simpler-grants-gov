from src.api.competition_alpha.competition_schema import CompetitionAlphaSchema
from src.api.schemas.extension import Schema, fields
from src.api.schemas.response_schema import (
    AbstractResponseSchema,
    FileResponseSchema,
    WarningMixinSchema,
)
from src.constants.lookup_constants import ApplicationFormStatus


class ApplicationStartRequestSchema(Schema):
    competition_id = fields.UUID(required=True)
    application_name = fields.String(required=False, allow_none=True)


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
    application_response = fields.Dict(required=True)


class ApplicationFormUpdateResponseDataSchema(Schema):
    application_id = fields.UUID()

    application_form_status = fields.Enum(
        ApplicationFormStatus,
        metadata={"description": "Status indicating how much of a form has been filled out"},
    )


class ApplicationFormUpdateResponseSchema(AbstractResponseSchema, WarningMixinSchema):
    data = fields.Nested(ApplicationFormUpdateResponseDataSchema())


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


class ApplicationFormGetResponseSchema(AbstractResponseSchema, WarningMixinSchema):
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


class ApplicationGetResponseDataSchema(Schema):
    application_id = fields.UUID()
    competition = fields.Nested(CompetitionAlphaSchema())
    application_forms = fields.List(fields.Nested(ApplicationFormGetResponseDataSchema()))
    application_status = fields.String()
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

    created_at = fields.DateTime(
        metadata={"description": "When the application attachment was created"}
    )
    updated_at = fields.DateTime(
        metadata={"description": "When the application attachment was last updated"}
    )


class ApplicationAttachmentGetResponseSchema(AbstractResponseSchema):
    data = fields.Nested(ApplicationAttachmentGetSchema())


class ApplicationAttachmentDeleteResponseSchema(AbstractResponseSchema):
    data = fields.MixinField(metadata={"example": None})
