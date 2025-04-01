from src.api.schemas.extension import Schema, fields
from src.api.schemas.response_schema import AbstractResponseSchema


class FormAlphaSchema(Schema):
    form_id = fields.UUID(metadata={"description": "The primary key ID of the form"})

    form_name = fields.String(
        metadata={"description": "The name of the form", "example": "ABC Project Form"}
    )

    form_json_schema = fields.Dict(
        metadata={
            "description": "The JSON Schema representation of the form",
            "example": {
                "type": "object",
                "title": "Test form for testing",
                "properties": {
                    "Title": {"title": "Title", "type": "string", "minLength": 1, "maxLength": 60},
                    "Description": {
                        "title": "Description for application",
                        "type": "string",
                        "minLength": 0,
                        "maxLength": 15,
                    },
                    "ApplicationNumber": {
                        "title": "Application number",
                        "type": "number",
                        "minLength": 1,
                        "maxLength": 120,
                    },
                    "Date": {"title": "Date of application ", "type": "string", "format": "date"},
                },
            },
        }
    )
    form_ui_schema = fields.Raw(
        metadata={
            "description": "The UI Schema of the form for front-end rendering",
            "example": [
                {"type": "field", "definition": "/properties/Title"},
                {"type": "field", "definition": "/properties/Description"},
                {"type": "field", "definition": "/properties/ApplicationNumber"},
                {"type": "field", "definition": "/properties/Date"},
            ],
        }
    )


class FormResponseAlphaSchema(AbstractResponseSchema):
    data = fields.Nested(FormAlphaSchema())
