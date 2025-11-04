from src.api.schemas.extension import Schema, fields
from src.api.schemas.response_schema import AbstractResponseSchema


class LocalUserTokenSchema(Schema):

    user_id = fields.UUID(metadata={"description": "The ID of the user"})

    first_name = fields.String(
        metadata={"description": "The first name of the user", "example": "Bob"}
    )
    last_name = fields.String(
        metadata={"description": "The last name of the user", "example": "Smith"}
    )

    oauth_id = fields.String(
        metadata={
            "description": "The OAuth id of the user - can be used to login locally via our mock OAuth server",
            "example": "my_example_user",
        }
    )
    user_jwt = fields.String(
        metadata={
            "description": "The JWT of the user, can be used with our X-SGG-Token auth",
            "example": "abc123",
        }
    )
    user_api_key = fields.String(
        metadata={
            "description": "The API key of the user, can be used with our X-API-Key auth",
            "example": "my_example_user_token",
        }
    )


class LocalUserTokenResponseSchema(AbstractResponseSchema):
    data = fields.List(fields.Nested(LocalUserTokenSchema))
