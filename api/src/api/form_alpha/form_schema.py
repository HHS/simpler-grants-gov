from src.api.schemas.extension import Schema, fields
from src.api.schemas.response_schema import AbstractResponseSchema, WarningMixinSchema


class FormInstructionSchema(Schema):
    form_instruction_id = fields.UUID(metadata={"description": "The UUID of the form instruction"})
    file_name = fields.String(
        metadata={
            "description": "The name of the form instruction file",
            "example": "instructions.pdf",
        }
    )
    download_path = fields.String(
        metadata={"description": "The download URL for the form instruction file"}
    )
    created_at = fields.DateTime(
        metadata={"description": "The timestamp when the form instruction was created"}
    )
    updated_at = fields.DateTime(
        metadata={"description": "The timestamp when the form instruction was last updated"}
    )


class FormAlphaSchema(Schema):
    form_id = fields.UUID(metadata={"description": "The primary key ID of the form"})

    form_name = fields.String(
        metadata={"description": "The name of the form", "example": "ABC Project Form"}
    )

    short_form_name = fields.String(
        metadata={
            "description": "The short name of the form used for making files",
            "example": "abc_project",
        }
    )

    form_version = fields.String(
        metadata={"description": "The version of the form", "example": "1.0"}
    )

    agency_code = fields.String(
        metadata={"description": "The agency code for the form", "example": "SGG"}
    )

    omb_number = fields.String(
        allow_none=True,
        metadata={"description": "The OMB number for the form", "example": "4040-0001"},
    )

    legacy_form_id = fields.Integer(
        allow_none=True,
        metadata={"description": "The legacy form ID", "example": 123},
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

    form_instruction = fields.Nested(
        FormInstructionSchema,
        allow_none=True,
        metadata={"description": "The instruction file for the form, if available"},
    )

    form_rule_schema = fields.Dict(
        allow_none=True, metadata={"description": "The rule schema for the form"}
    )

    json_to_xml_schema = fields.Dict(
        allow_none=True,
        metadata={"description": "The JSON to XML schema mapping configuration for the form"},
    )

    created_at = fields.DateTime(
        metadata={"description": "The timestamp when the form was created"}
    )
    updated_at = fields.DateTime(
        metadata={"description": "The timestamp when the form was last updated"}
    )


class FormResponseAlphaSchema(WarningMixinSchema, AbstractResponseSchema):
    data = fields.Nested(FormAlphaSchema)


class FormUpdateRequestSchema(Schema):
    form_name = fields.String(
        required=True,
        metadata={"description": "The name of the form", "example": "ABC Project Form"},
    )

    short_form_name = fields.String(
        required=True,
        metadata={
            "description": "The short name of the form used for making files",
            "example": "abc_project",
        },
    )

    form_version = fields.String(
        required=True, metadata={"description": "The version of the form", "example": "1.0"}
    )

    agency_code = fields.String(
        required=True, metadata={"description": "The agency code for the form", "example": "SGG"}
    )

    omb_number = fields.String(
        allow_none=True,
        metadata={"description": "The OMB number for the form", "example": "4040-0001"},
    )

    legacy_form_id = fields.Integer(
        allow_none=True,
        metadata={"description": "The legacy form ID", "example": 123},
    )

    form_json_schema = fields.Dict(
        required=True,
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
        },
    )

    form_ui_schema = fields.Raw(
        required=True,
        metadata={
            "description": "The UI Schema of the form for front-end rendering",
            "example": [
                {"type": "field", "definition": "/properties/Title"},
                {"type": "field", "definition": "/properties/Description"},
                {"type": "field", "definition": "/properties/ApplicationNumber"},
                {"type": "field", "definition": "/properties/Date"},
            ],
        },
    )

    form_instruction_id = fields.UUID(
        allow_none=True, metadata={"description": "The UUID of the form instruction"}
    )

    form_rule_schema = fields.Dict(
        allow_none=True, metadata={"description": "The rule schema for the form"}
    )

    json_to_xml_schema = fields.Dict(
        allow_none=True,
        metadata={"description": "The JSON to XML schema mapping configuration for the form"},
    )


class FormUpdateResponseSchema(AbstractResponseSchema):
    data = fields.Nested(FormAlphaSchema)
