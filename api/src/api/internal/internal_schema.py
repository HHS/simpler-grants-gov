from grants_shared.api.schemas.extension import Schema, fields
from grants_shared.api.schemas.response_schema import AbstractResponseSchema


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


class E2ETokenRequestSchema(Schema):
    user_id = fields.UUID(
        required=True,
        metadata={
            "description": "The UUID of the test user to issue an auth token for",
            "example": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        },
    )


class E2ETokenResponseSchema(AbstractResponseSchema):
    token = fields.String(metadata={"description": "The viable JWT auth token"})
    expires_at = fields.DateTime(
        metadata={"description": "The expiration timestamp of the session"}
    )
