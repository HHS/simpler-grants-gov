from apiflask import fields
from marshmallow import fields as marshmallow_fields

from src.api.schemas import request_schema
from src.db.models import user_models


class RoleSchema(request_schema.OrderedSchema):
    type = marshmallow_fields.Enum(
        user_models.RoleType,
        by_value=True,
        metadata={"description": "The name of the role"},
    )

    # Note that user_id is not included in the API schema since the role
    # will always be a nested fields of the API user


class UserSchema(request_schema.OrderedSchema):
    id = fields.UUID(dump_only=True)
    first_name = fields.String(metadata={"description": "The user's first name"}, required=True)
    middle_name = fields.String(metadata={"description": "The user's middle name"})
    last_name = fields.String(metadata={"description": "The user's last name"}, required=True)
    phone_number = fields.String(
        required=True,
        metadata={
            "description": "The user's phone number",
            "example": "123-456-7890",
            "pattern": r"^([0-9]|\*){3}\-([0-9]|\*){3}\-[0-9]{4}$",
        },
    )
    date_of_birth = fields.Date(
        metadata={"description": "The users date of birth"},
        required=True,
    )
    is_active = fields.Boolean(
        metadata={"description": "Whether the user is active"},
        required=True,
    )
    roles = fields.List(fields.Nested(RoleSchema), required=True)

    # Output only fields in addition to id field
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
