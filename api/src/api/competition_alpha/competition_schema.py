from src.api.form_alpha.form_schema import FormAlphaSchema
from src.api.schemas.extension import Schema, fields
from src.api.schemas.response_schema import AbstractResponseSchema


class CompetitionFormAlphaSchema(Schema):
    is_required = fields.Boolean(
        metadata={
            "description": "Whether the form is required for all applications to the competition"
        }
    )
    form = fields.Nested(FormAlphaSchema())


class CompetitionAlphaSchema(Schema):
    competition_id = fields.UUID(metadata={"description": "The competition ID"})

    opportunity_id = fields.Integer(
        metadata={"description": "The opportunity ID that the competition is associated with"}
    )

    competition_forms = fields.List(fields.Nested(CompetitionFormAlphaSchema()))


class CompetitionResponseAlphaSchema(AbstractResponseSchema):
    data = fields.Nested(CompetitionAlphaSchema())
