from src.api.form_alpha.form_schema import FormAlphaSchema
from src.api.schemas.extension import Schema, fields
from src.api.schemas.response_schema import AbstractResponseSchema


class CompetitionFormAlphaSchema(Schema):
    is_required = fields.Boolean(metadata={"description": ""})
    form = fields.Nested(FormAlphaSchema())


class CompetitionAlphaSchema(Schema):
    competition_id = fields.UUID(metadata={"description": ""})

    opportunity_id = fields.Integer(metadata={"description": ""})

    competition_forms = fields.List(fields.Nested(CompetitionFormAlphaSchema()))


class CompetitionResponseAlphaSchema(AbstractResponseSchema):
    data = fields.Nested(CompetitionAlphaSchema())
