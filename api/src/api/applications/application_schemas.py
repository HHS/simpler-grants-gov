from src.api.schemas.extension import Schema, fields


class ApplicationStartRequestSchema(Schema):
    competition_id = fields.UUID(required=True)


class ApplicationStartResponseSchema(Schema):
    message = fields.String()
    data = fields.Dict(keys=fields.String(), values=fields.String())
