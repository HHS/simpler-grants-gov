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
        attribute="form_name",
        metadata={
            "description": "The full name of the form",
            "example": "Application for Federal Assistance",
        },
    )
    short_name = fields.String(
        attribute="short_form_name",
        metadata={"description": "The short name of the form", "example": "SF-424"},
    )
    current_version = fields.Method("get_current_version")

    def get_current_version(self, obj: object) -> dict:
        form_version = getattr(obj, "form_version", "") or ""
        parts = form_version.split(".")
        try:
            major = int(parts[0]) if parts else 0
            minor = int(parts[1]) if len(parts) > 1 else 0
        except ValueError:
            major, minor = 0, 0
        return {
            "major_version": major,
            "minor_version": minor,
            "legacy_form_version": getattr(obj, "sgg_version", None),
        }


class FormCatalogListV1ResponseSchema(AbstractResponseSchema):
    data = fields.Nested(FormCatalogV1Schema(many=True))
