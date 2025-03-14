from src.api.schemas.extension import Schema, fields
from src.api.schemas.response_schema import AbstractResponseSchema


class ApplicationStartRequestSchema(Schema):
    competition_id = fields.UUID(required=True)


class ApplicationStartResponseDataSchema(Schema):
    application_id = fields.UUID()


class ApplicationStartResponseSchema(AbstractResponseSchema):
    data = fields.Nested(ApplicationStartResponseDataSchema())
