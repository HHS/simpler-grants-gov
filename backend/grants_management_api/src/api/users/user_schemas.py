from grants_shared.api.schemas.extension import Schema, fields, validators
from grants_shared.api.schemas.response_schema import AbstractResponseSchema

from src.constants.lookup_constants import MgmtPrivilege, MgmtResourceType


class UserLoginGovCallbackSchema(Schema):
    # This is defining the inputs we receive on the callback from login.gov's
    # authorization endpoint and must match:
    # https://developers.login.gov/oidc/authorization/#authorization-response
    code = fields.String(
        metadata={
            "description": "A unique authorization code that can be passed to the token endpoint"
        }
    )
    state = fields.String(
        metadata={"description": "The state value originally provided by us when calling login.gov"}
    )
    error = fields.String(
        allow_none=True,
        metadata={"description": "The error type, either access_denied or invalid_request"},
    )
    error_description = fields.String(
        allow_none=True, metadata={"description": "A description of the error"}
    )


class UserLoginSchema(Schema):
    # This is defining the inputs we receive on the callback from login.gov's
    # authorization endpoint and must match:
    # https://developers.login.gov/oidc/authorization/#authorization-response
    piv_required = fields.Boolean(
        allow_none=True,
        metadata={"description": "Whether the user is required to use a PIV to login"},
    )


class UserTokenRefreshResponseSchema(AbstractResponseSchema):
    # No data returned
    data = fields.MixinField(metadata={"example": None})


class UserTokenLogoutResponseSchema(AbstractResponseSchema):
    # No data returned
    data = fields.MixinField(metadata={"example": None})


class MgmtUserCanAccessRequestSchema(Schema):
    mgmt_resource_id = fields.UUID(
        required=True, metadata={"description": "The ID of the resource to check access against"}
    )
    mgmt_resource_type = fields.Enum(
        MgmtResourceType,
        required=True,
        metadata={"description": "The type of the resource to check access against"},
    )
    mgmt_privileges = fields.List(
        fields.Enum(MgmtPrivilege),
        required=True,
        validate=[validators.Length(min=1)],
        metadata={
            "description": "The privileges the user must have against the resource. The user must have all of them."
        },
    )


class MgmtUserCanAccessResponseSchema(AbstractResponseSchema):
    # No data returned - a 200 indicates the user has access
    data = fields.MixinField(metadata={"example": None})
