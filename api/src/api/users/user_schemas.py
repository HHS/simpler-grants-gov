from typing import Any

from marshmallow import pre_dump

from src.api.application_alpha.application_schemas import SamGovEntitySchema
from src.api.opportunities_v1.opportunity_schemas import (
    OpportunitySearchRequestV1Schema,
    SavedOpportunityResponseV1Schema,
)
from src.api.schemas.extension import Schema, fields, validators
from src.api.schemas.response_schema import AbstractResponseSchema
from src.constants.lookup_constants import ApplicationStatus, ExternalUserType
from src.db.models.user_models import LinkExternalUser
from src.pagination.pagination_schema import generate_pagination_schema


class UserTokenHeaderSchema(Schema):
    x_oauth_login_gov = fields.String(
        data_key="X-OAuth-login-gov",
        metadata={
            "description": "The login_gov header token",
        },
    )


class UserProfile(Schema):
    first_name = fields.String(
        allow_none=True,
        metadata={
            "description": "The first name of the user",
            "example": "John",
        },
    )
    middle_name = fields.String(
        allow_none=True,
        metadata={
            "description": "The middle name of the user",
            "example": "Hoover",
        },
    )
    last_name = fields.String(
        allow_none=True,
        metadata={
            "description": "The last name of the user",
            "example": "Smith",
        },
    )


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
            "example": "user@example.com",
        }
    )
    external_user_type = fields.Enum(
        ExternalUserType,
        metadata={
            "description": "The Oauth2 provider through which a user was authenticated",
            "example": ExternalUserType.LOGIN_GOV,
        },
    )
    profile = fields.Nested(UserProfile, allow_none=True)

    @pre_dump
    def flatten_linked_user(self, external_user: LinkExternalUser, **kwargs: Any) -> dict:
        return {
            "user_id": str(external_user.user_id),
            "email": external_user.email,
            "external_user_type": external_user.external_user_type,
            "profile": external_user.user.profile,
        }


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


class UserTokenRefreshResponseSchema(AbstractResponseSchema):
    # No data returned
    data = fields.MixinField(metadata={"example": None})


class UserTokenLogoutResponseSchema(AbstractResponseSchema):
    # No data returned
    data = fields.MixinField(metadata={"example": None})


class UserGetResponseSchema(AbstractResponseSchema):
    data = fields.Nested(UserSchema)


class UserSaveOpportunityRequestSchema(Schema):
    opportunity_id = fields.UUID(required=True)


class UserSaveOpportunityResponseSchema(AbstractResponseSchema):
    data = fields.MixinField(metadata={"example": None})


class UserDeleteSavedOpportunityResponseSchema(AbstractResponseSchema):
    data = fields.MixinField(metadata={"example": None})


class UserSavedOpportunitiesRequestSchema(Schema):
    pagination = fields.Nested(
        generate_pagination_schema(
            "UserGetSavedOpportunityPaginationV1Schema",
            ["created_at", "updated_at", "opportunity_title", "close_date"],
            default_sort_order=[{"order_by": "created_at", "sort_direction": "descending"}],
        ),
        required=True,
    )


class UserSavedOpportunitiesResponseSchema(AbstractResponseSchema):
    data = fields.List(
        fields.Nested(SavedOpportunityResponseV1Schema),
        metadata={"description": "List of saved opportunities"},
    )


class UserSaveSearchRequestSchema(Schema):
    name = fields.String(
        required=True,
        metadata={"description": "Name of the saved search", "example": "Example search"},
    )
    search_query = fields.Nested(OpportunitySearchRequestV1Schema)


class SavedSearchResponseSchema(Schema):
    saved_search_id = fields.UUID(
        metadata={
            "description": "The ID of the saved search",
            "example": "123e4567-e89b-12d3-a456-426614174000",
        }
    )
    name = fields.String(
        metadata={
            "description": "Name of the saved search",
            "example": "Grant opportunities in California",
        }
    )
    search_query = fields.Nested(
        OpportunitySearchRequestV1Schema,
        metadata={"description": "The saved search query parameters"},
    )
    created_at = fields.DateTime(
        metadata={"description": "When the search was saved", "example": "2024-01-01T00:00:00Z"}
    )


class UserSaveSearchResponseSchema(AbstractResponseSchema):
    data = fields.Nested(SavedSearchResponseSchema)


class UserSavedSearchesRequestSchema(Schema):
    pagination = fields.Nested(
        generate_pagination_schema(
            "UserGetSavedSearchPaginationV1Schema",
            ["created_at", "updated_at", "name"],
            default_sort_order=[{"order_by": "created_at", "sort_direction": "descending"}],
        ),
        required=True,
    )


class UserSavedSearchesResponseSchema(AbstractResponseSchema):
    data = fields.List(
        fields.Nested(SavedSearchResponseSchema), metadata={"description": "List of saved searches"}
    )


class UserDeleteSavedSearchResponseSchema(AbstractResponseSchema):
    data = fields.MixinField(metadata={"example": None})


class UserUpdateSavedSearchRequestSchema(Schema):
    name = fields.String(
        required=True,
        metadata={"description": "Name of the saved search", "example": "Example search"},
    )


class UserUpdateSavedSearchResponseSchema(AbstractResponseSchema):
    data = fields.MixinField(metadata={"example": None})


class UserOrganizationSchema(Schema):
    organization_id = fields.String(
        metadata={
            "description": "The internal ID of the organization",
            "example": "123e4567-e89b-12d3-a456-426614174000",
        }
    )
    is_organization_owner = fields.Boolean(
        metadata={
            "description": "Whether the user is an owner of this organization",
            "example": True,
        }
    )
    sam_gov_entity = fields.Nested(
        SamGovEntitySchema,
        allow_none=True,
        metadata={"description": "SAM.gov entity information for the organization"},
    )


class UserOrganizationsResponseSchema(AbstractResponseSchema):
    data = fields.List(
        fields.Nested(UserOrganizationSchema),
        metadata={"description": "List of organizations the user is associated with"},
    )


class UserApplicationListRequestSchema(Schema):
    """Schema for application list request - currently empty but provided for future filtering"""

    pass


class UserApplicationCompetitionSchema(Schema):
    """Schema for competition information in application list"""

    competition_id = fields.UUID(metadata={"description": "The competition ID"})
    competition_title = fields.String(
        metadata={
            "description": "The title of the competition",
            "example": "Proposal for Advanced Research",
        }
    )
    opening_date = fields.Date(
        allow_none=True,
        metadata={
            "description": "The opening date of the competition, the first day applications are accepted"
        },
    )
    closing_date = fields.Date(
        allow_none=True,
        metadata={
            "description": "The closing date of the competition, the last day applications are accepted"
        },
    )
    is_open = fields.Boolean(
        metadata={"description": "Whether the competition is open and accepting applications"}
    )


class UserApplicationListItemSchema(Schema):
    """Schema for individual application in the list"""

    application_id = fields.UUID(metadata={"description": "The application ID"})
    application_name = fields.String(
        allow_none=True,
        metadata={
            "description": "The name of the application",
            "example": "my app",
        },
    )
    application_status = fields.Enum(
        ApplicationStatus,
        metadata={"description": "Status of the application"},
    )
    organization = fields.Nested(
        UserOrganizationSchema,
        allow_none=True,
        metadata={"description": "Organization associated with the application"},
    )
    competition = fields.Nested(
        UserApplicationCompetitionSchema,
        metadata={"description": "Competition information"},
    )


class UserApplicationListResponseSchema(AbstractResponseSchema):
    data = fields.List(
        fields.Nested(UserApplicationListItemSchema),
        metadata={"description": "List of applications for the user"},
    )


class UserApiKeyCreateRequestSchema(Schema):
    key_name = fields.String(
        required=True,
        validate=validators.Length(min=1, max=255),
        metadata={
            "description": "Human-readable name for the API key",
            "example": "Production API Key",
        },
    )


class UserApiKeySchema(Schema):
    api_key_id = fields.UUID(
        metadata={
            "description": "Unique identifier for the API key record",
            "example": "123e4567-e89b-12d3-a456-426614174000",
        }
    )
    key_name = fields.String(
        metadata={
            "description": "Human-readable name for the API key",
            "example": "Production API Key",
        }
    )
    key_id = fields.String(
        metadata={
            "description": "The actual API key identifier to use for authentication",
            "example": "k8w2Xd9Zq1mN3pR7sT5vY4uI",
        }
    )
    is_active = fields.Boolean(
        metadata={"description": "Whether the API key is currently active", "example": True}
    )
    last_used = fields.DateTime(
        allow_none=True,
        metadata={
            "description": "Timestamp when this API key was last used for authentication",
            "example": "2024-01-15T10:30:00Z",
        },
    )
    created_at = fields.DateTime(
        metadata={"description": "When this API key was created", "example": "2024-01-01T12:00:00Z"}
    )


class UserApiKeyCreateResponseSchema(AbstractResponseSchema):
    data = fields.Nested(UserApiKeySchema, metadata={"description": "The newly created API key"})


class UserApiKeyDeleteResponseSchema(AbstractResponseSchema):
    data = fields.MixinField(metadata={"example": None})


class UserApiKeyRenameRequestSchema(Schema):
    key_name = fields.String(
        required=True,
        validate=validators.Length(min=1, max=255),
        metadata={
            "description": "New name for the API key",
            "example": "Production API Key",
        },
    )


class UserApiKeyRenameResponseSchema(AbstractResponseSchema):
    data = fields.Nested(UserApiKeySchema, metadata={"description": "The renamed API key"})


class UserApiKeyListRequestSchema(Schema):
    # Future filtering fields can be added here
    pass


class UserApiKeyListResponseSchema(AbstractResponseSchema):
    data = fields.List(
        fields.Nested(UserApiKeySchema),
        metadata={"description": "List of API keys for the user"},
    )

class UserUpdateProfileRequestSchema(Schema):
    first_name = fields.String(
        allow_none=True,
        metadata={
            "description": "The updated first name of the user",
            "example": "Jane",
        },
    )
    middle_name = fields.String(
        allow_none=True,
        metadata={
            "description": "The updated middle name of the user",
            "example": "H",
        },
    )
    last_name = fields.String(
        allow_none=True,
        metadata={
            "description": "The updated last name of the user",
            "example": "Doe",
        },
    )


class UserUpdateProfileResponseSchema(AbstractResponseSchema):
    data = fields.Nested(UserProfile, metadata={"description": "The updated user profile"})
