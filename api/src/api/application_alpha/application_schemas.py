from src.api.competition_alpha.competition_schema import CompetitionAlphaSchema
from src.api.schemas.extension import Schema, fields
from src.api.schemas.response_schema import AbstractResponseSchema, WarningMixinSchema


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


class ApplicationFormUpdateRequestSchema(Schema):
    application_response = fields.Dict(required=True)


class ApplicationFormUpdateResponseDataSchema(Schema):
    application_id = fields.UUID()


class ApplicationFormUpdateResponseSchema(AbstractResponseSchema, WarningMixinSchema):
    data = fields.Nested(ApplicationFormUpdateResponseDataSchema())


class ApplicationFormGetResponseDataSchema(Schema):
    application_form_id = fields.UUID()
    application_id = fields.UUID()
    form_id = fields.UUID()
    application_response = fields.Dict()


class ApplicationFormGetResponseSchema(AbstractResponseSchema, WarningMixinSchema):
    data = fields.Nested(ApplicationFormGetResponseDataSchema())


class ApplicationUserSchema(Schema):
    """Schema for users associated with an application"""

    user_id = fields.UUID()
    email = fields.String()


class ApplicationGetResponseDataSchema(Schema):
    application_id = fields.UUID()
    competition = fields.Nested(CompetitionAlphaSchema())
    application_forms = fields.List(fields.Nested(ApplicationFormGetResponseDataSchema()))
    application_status = fields.String()
    application_name = fields.String()
    users = fields.List(fields.Nested(ApplicationUserSchema()))

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
