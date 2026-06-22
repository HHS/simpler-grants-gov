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
    user_id = fields.UUID(
        required=True,
        metadata={
            "description": (
                "UUID to provision as the file-scan scanner user. Re-running with "
                "the same id mints a new key for that user (key rotation)."
            ),
            "example": "f1c0b2a4-9d3e-4a7b-8c61-0e5d2f8a4b13",
        },
    )


class FileScanScannerUserSchema(Schema):
    user_id = fields.UUID(
        metadata={"description": "The provisioned scanner user's id"},
    )
    api_key_id = fields.UUID(
        metadata={"description": "Identifier of the newly created API key record"},
    )
    api_key = fields.String(
        metadata={
            "description": (
                "The generated X-API-Key value the scanner Lambda authenticates with. "
                "Returned only here -- store it in the scanner's secret."
            ),
        },
    )


class FileScanScannerUserResponseSchema(AbstractResponseSchema):
    data = fields.Nested(
        FileScanScannerUserSchema,
        metadata={"description": "The provisioned scanner user and its generated API key"},
    )


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
