from apiflask import fields

from src.api.schemas import request_schema


class ValidationErrorSchema(request_schema.OrderedSchema):
    type = fields.String(metadata={"description": "The type of error"})
    message = fields.String(metadata={"description": "The message to return"})
    rule = fields.String(metadata={"description": "The rule that failed"})
    field = fields.String(metadata={"description": "The field that failed"})
    value = fields.String(metadata={"description": "The value that failed"})


class ResponseSchema(request_schema.OrderedSchema):
    message = fields.String(metadata={"description": "The message to return"})
    data = fields.Field(metadata={"description": "The REST resource object"}, dump_default={})
    status_code = fields.Integer(metadata={"description": "The HTTP status code"}, dump_default=200)
    warnings = fields.List(fields.Nested(ValidationErrorSchema), dump_default=[])
    errors = fields.List(fields.Nested(ValidationErrorSchema), dump_default=[])
