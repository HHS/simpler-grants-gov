from src.api.schemas.extension import Schema, fields
from src.api.schemas.response_schema import AbstractResponseSchema


class InternalRoleAssignmentRequestSchema(Schema):
    internal_role_id = fields.UUID(
        required=True,
        metadata={
            "description": "The UUID of the internal role to assign",
            "example": "57e8875f-c154-41be-a5f6-602f4c92d6e6",
        },
    )
    user_email = fields.String(
        required=True,
        metadata={
            "description": "The email address of the user receiving the role",
            "example": "example@example.com",
        },
    )


class InternalRoleAssignmentResponseSchema(AbstractResponseSchema):
    pass
