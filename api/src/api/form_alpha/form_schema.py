from src.api.schemas.extension import Schema, fields
from src.api.schemas.response_schema import AbstractResponseSchema


class FormAlphaSchema(Schema):
    form_id = fields.UUID(metadata={"description": "The primary key ID of the form"})

    form_name = fields.String(
        metadata={"description": "The name of the form", "example": "ABC Project Form"}
    )

    # TODO: https://github.com/HHS/simpler-grants-gov/issues/4168
    # Update these to be more meaningful
    form_json_schema = fields.Dict(
        metadata={
            "description": "The JSON Schema representation of the form",
            "example": {"type": "object", "properties": {}},
        }
    )
    form_ui_schema = fields.Dict(
        metadata={"description": "The UI Schema of the form for front-end rendering", "example": {}}
    )


class FormResponseAlphaSchema(AbstractResponseSchema):
    data = fields.Nested(FormAlphaSchema())
