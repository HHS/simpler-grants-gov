from src.api.competition_alpha.competition_schema import CompetitionAlphaSchema
from src.api.form_alpha.form_schema import FormAlphaSchema
from src.api.organizations_v1.organization_schemas import SamGovEntityResponseSchema
from src.api.schemas.extension import Schema, fields
from src.api.schemas.response_schema import (
    AbstractResponseSchema,
    FileResponseSchema,
    PaginationMixinSchema,
    WarningMixinSchema,
)
from src.api.schemas.shared_schema import SimpleUserSchema
from src.constants.lookup_constants import (
    ApplicationAuditEvent,
    ApplicationFormStatus,
    ApplicationStatus,
)
from src.pagination.pagination_schema import generate_pagination_schema


class ApplicationStartRequestSchema(Schema):
    competition_id = fields.UUID(
        required=True,
        metadata={
            "description": "The unique identifier of the competition to create an application for",
            "example": "123e4567-e89b-12d3-a456-426614174000",
        },
    )
    application_name = fields.String(
        required=False,
        allow_none=True,
        metadata={
            "description": "Optional name for the application",
            "example": "My Research Grant Application",
        },
    )
    organization_id = fields.UUID(
        required=False,
        allow_none=True,
        metadata={
            "description": "Optional organization ID to associate with the application",
            "example": "456e7890-e12c-34f5-b678-901234567890",
        },
    )


class ApplicationStartResponseDataSchema(Schema):
    application_id = fields.UUID(
        metadata={
            "description": "The unique identifier of the newly created application",
            "example": "789f0123-f45g-67h8-i901-234567890123",
        }
    )


class ApplicationStartResponseSchema(AbstractResponseSchema):
    data = fields.Nested(ApplicationStartResponseDataSchema())


class ApplicationUpdateRequestSchema(Schema):
    application_name = fields.String(
        required=True,
        allow_none=False,
        metadata={
            "description": "The new name for the application",
            "example": "Updated Research Grant Application",
        },
    )


class ApplicationUpdateResponseDataSchema(Schema):
    application_id = fields.UUID(
        metadata={
            "description": "The unique identifier of the updated application",
            "example": "789f0123-f45g-67h8-i901-234567890123",
        }
    )


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
    application_form_id = fields.UUID(
        metadata={
            "description": "The unique identifier of the application form",
            "example": "123e4567-e89b-12d3-a456-426614174000",
        }
    )
    application_id = fields.UUID(
        metadata={
            "description": "The unique identifier of the application this form belongs to",
            "example": "789f0123-f45g-67h8-i901-234567890123",
        }
    )
    form_id = fields.UUID(
        metadata={
            "description": "The unique identifier of the form template",
            "example": "456e7890-e12c-34f5-b678-901234567890",
        }
    )
    form = fields.Nested(
        FormAlphaSchema(), metadata={"description": "The form template information"}
    )
    application_response = fields.Dict(
        metadata={
            "description": "The user's responses to the form fields",
            "example": {
                "project_title": "Advanced AI Research",
                "budget_amount": 150000,
                "project_duration": "24 months",
            },
        }
    )

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

    application_attachments = fields.List(
        fields.Nested(ApplicationAttachmentNoLinkSchema()),
        metadata={"description": "List of attachments associated with this application form"},
    )
    application_name = fields.String(
        metadata={
            "description": "The name of the application",
            "example": "My Research Grant Application",
        }
    )
    application_status = fields.Enum(
        ApplicationStatus,
        metadata={
            "description": "Current status of the application",
            "example": ApplicationStatus.IN_PROGRESS,
        },
    )


class ApplicationFormUpdateResponseSchema(AbstractResponseSchema, WarningMixinSchema):
    data = fields.Nested(ApplicationFormGetResponseDataSchema())


class ApplicationUserSchema(Schema):
    """Schema for users associated with an application"""

    user_id = fields.UUID(
        metadata={
            "description": "The unique identifier of the user",
            "example": "123e4567-e89b-12d3-a456-426614174000",
        }
    )
    email = fields.String(
        metadata={"description": "The email address of the user", "example": "user@example.com"}
    )


class OrganizationSchema(Schema):
    """Schema for organization information"""

    organization_id = fields.UUID(
        metadata={
            "description": "The unique identifier of the organization",
            "example": "456e7890-e12c-34f5-b678-901234567890",
        }
    )
    sam_gov_entity = fields.Nested(
        SamGovEntityResponseSchema,
        allow_none=True,
        metadata={"description": "SAM.gov entity information if organization is registered"},
    )


class ApplicationFormGetResponseSchema(AbstractResponseSchema, WarningMixinSchema):
    data = fields.Nested(ApplicationFormGetResponseDataSchema())


class ApplicationGetResponseDataSchema(Schema):
    application_id = fields.UUID(
        metadata={
            "description": "The unique identifier of the application",
            "example": "789f0123-f45g-67h8-i901-234567890123",
        }
    )
    competition = fields.Nested(
        CompetitionAlphaSchema(),
        metadata={"description": "The competition this application is for"},
    )
    application_forms = fields.List(
        fields.Nested(ApplicationFormGetResponseDataSchema()),
        metadata={"description": "List of forms that are part of this application"},
    )
    application_status = fields.Enum(
        ApplicationStatus,
        metadata={
            "description": "Current status of the application",
            "example": ApplicationStatus.IN_PROGRESS,
        },
    )
    application_name = fields.String(
        metadata={
            "description": "The name of the application",
            "example": "My Research Grant Application",
        }
    )
    users = fields.List(
        fields.Nested(ApplicationUserSchema()),
        metadata={"description": "List of users who have access to this application"},
    )
    organization = fields.Nested(
        OrganizationSchema(),
        allow_none=True,
        metadata={"description": "Organization associated with this application, if any"},
    )

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

    application_attachments = fields.List(
        fields.Nested(ApplicationAttachmentNoLinkSchema()),
        metadata={"description": "List of attachments associated with this application"},
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


class ApplicationAddOrganizationResponseSchema(AbstractResponseSchema):
    data = fields.Nested(ApplicationUpdateResponseDataSchema())


class ApplicationAuditRequestSchema(Schema):

    pagination = fields.Nested(
        generate_pagination_schema(
            "ApplicationAuditRequestPaginationSchema",
            ["created_at"],
            default_sort_order=[{"order_by": "created_at", "sort_direction": "descending"}],
        ),
        required=True,
    )


class ApplicationAuditAppFormSchema(Schema):

    application_form_id = fields.UUID(metadata={"description": "The ID of the application form"})
    competition_form_id = fields.UUID(metadata={"description": "The ID of the competition form"})
    form_id = fields.UUID(metadata={"description": "The ID of the form"})
    form_name = fields.String(metadata={"description": "The name of the form"})


class ApplicationAuditAttachmentSchema(Schema):

    application_attachment_id = fields.UUID(
        metadata={"description": "The ID of the application attachment"}
    )
    file_name = fields.String(
        metadata={
            "description": "The file name of the application attachment",
            "example": "my_example.pdf",
        }
    )

    is_deleted = fields.Boolean(metadata={"description": "Whether the attachment has been deleted"})


class ApplicationAuditDataSchema(Schema):
    application_audit_id = fields.UUID(
        metadata={"description": "The ID of the application audit event"}
    )
    application_audit_event = fields.Enum(
        ApplicationAuditEvent,
        metadata={"description": "The type of application audit event recorded"},
    )

    user = fields.Nested(
        SimpleUserSchema(), metadata={"description": "The user who did the event that was audited"}
    )
    target_user = fields.Nested(
        SimpleUserSchema(),
        metadata={"description": "The user the audit event affected (if applicable)"},
    )

    target_application_form = fields.Nested(
        ApplicationAuditAppFormSchema(),
        metadata={"description": "The application form modified (if applicable)"},
    )

    target_attachment = fields.Nested(
        ApplicationAuditAttachmentSchema(),
        metadata={"description": "The application attachment modified (if applicable)"},
    )

    created_at = fields.DateTime(metadata={"description": "When the audit event was created"})


class ApplicationAuditResponseSchema(AbstractResponseSchema, PaginationMixinSchema):
    data = fields.List(fields.Nested(ApplicationAuditDataSchema()))
