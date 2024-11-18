from src.api.schemas.extension import Schema, fields
from src.api.schemas.response_schema import AbstractResponseSchema
from src.constants.lookup_constants import ExternalUserType


class UserSchema(Schema):
    user_id = fields.String(
        metadata={
            "description": "The internal ID of a user",
            "example": "861a0148-cf2c-432b-b0b3-690016299ab1",
        }
    )
    email = fields.String(
        metadata={
            "description": "The email address returned from Oauth2 provider",
            "example": "js@gmail.com",
        }
    )
    external_user_type = fields.Enum(
        ExternalUserType,
        metadata={
            "description": "The Oauth2 provider through which a user was authenticated",
            "example": ExternalUserType.LOGIN_GOV,
        },
    )


class UserTokenSchema(Schema):
    token = fields.String(
        metadata={
            "description": "Internal token generated for a user",
        }
    )
    user = fields.Nested(UserSchema())
    is_user_new = fields.Boolean(
        allow_none=False,
        metadata={
            "description": "Whether or not the user existed in our database",
        },
    )


class UserTokenResponseV1Schema(AbstractResponseSchema):
    data = fields.Nested(UserTokenSchema)
