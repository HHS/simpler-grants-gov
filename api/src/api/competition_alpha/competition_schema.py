from src.api.form_alpha.form_schema import FormAlphaSchema
from src.api.schemas.extension import Schema, fields
from src.api.schemas.response_schema import AbstractResponseSchema

class CompetitionAlphaSchema(Schema):
    competition_id = fields.UUID(metadata={
        "description": ""
    })

    opportunity_id = fields.Integer(metadata={
        "description": ""
    })

    forms = fields.List(fields.Nested(FormAlphaSchema()))


class CompetitionResponseAlphaSchema(AbstractResponseSchema):
    data = fields.Nested(CompetitionAlphaSchema())
