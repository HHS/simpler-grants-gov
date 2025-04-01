from src.api.schemas.extension import Schema, fields
from src.api.schemas.response_schema import AbstractResponseSchema, WarningMixinSchema


class ApplicationStartRequestSchema(Schema):
    competition_id = fields.UUID(required=True)


class ApplicationStartResponseDataSchema(Schema):
    application_id = fields.UUID()


class ApplicationStartResponseSchema(AbstractResponseSchema):
    data = fields.Nested(ApplicationStartResponseDataSchema())


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


class ApplicationGetResponseDataSchema(Schema):
    application_id = fields.UUID()
    competition_id = fields.UUID()
    application_forms = fields.List(fields.Nested(ApplicationFormGetResponseDataSchema()))


class ApplicationGetResponseSchema(AbstractResponseSchema, WarningMixinSchema):
    data = fields.Nested(ApplicationGetResponseDataSchema())
