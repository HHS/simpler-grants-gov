from src.api.schemas.extension import Schema, fields
from src.api.schemas.response_schema import AbstractResponseSchema


class ApplicationStartRequestSchema(Schema):
    competition_id = fields.UUID(required=True)


class ApplicationStartResponseSchema(AbstractResponseSchema):
    message = fields.String()
    data = fields.Dict()
