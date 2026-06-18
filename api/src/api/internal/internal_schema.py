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


class FileScanScannerUserRequestSchema(Schema):
    api_key = fields.String(
        required=True,
        metadata={
            "description": (
                "The X-API-Key value to register for the file-scan scanner user. "
                "Must match the key the scanner Lambda authenticates with."
            ),
        },
    )
    user_id = fields.UUID(
        required=False,
        metadata={
            "description": (
                "UUID to use for the scanner user. Defaults to the well-known "
                "singleton scanner user id."
            ),
            "example": "f1c0b2a4-9d3e-4a7b-8c61-0e5d2f8a4b13",
        },
    )


class FileScanScannerUserResponseSchema(AbstractResponseSchema):
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
