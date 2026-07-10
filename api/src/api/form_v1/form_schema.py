from grants_shared.api.schemas.extension import Schema, fields
from grants_shared.api.schemas.response_schema import AbstractResponseSchema


class FormVersionV1Schema(Schema):
    major_version = fields.Integer(metadata={"description": "Major version number", "example": 4})
    minor_version = fields.Integer(metadata={"description": "Minor version number", "example": 0})
    legacy_form_version = fields.String(
        allow_none=True,
        metadata={"description": "The SGG version of the form", "example": "2.1"},
    )


class FormCatalogV1Schema(Schema):
    form_id = fields.UUID(metadata={"description": "The primary key ID of the form"})
    name = fields.String(
        metadata={
            "description": "The full name of the form",
            "example": "Application for Federal Assistance",
        },
    )
    short_name = fields.String(
        metadata={"description": "The short name of the form", "example": "SF-424"},
    )
    current_version = fields.Nested(FormVersionV1Schema)


class FormCatalogListV1ResponseSchema(AbstractResponseSchema):
    data = fields.Nested(FormCatalogV1Schema(many=True))
