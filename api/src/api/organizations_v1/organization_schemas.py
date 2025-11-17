from src.api.schemas.extension import Schema, fields
from src.api.schemas.extension.field_validators import Email, Length
from src.api.schemas.response_schema import AbstractResponseSchema
from src.api.schemas.search_schema import StrSearchSchemaBuilder
from src.api.schemas.shared_schema import RoleSchema
from src.constants.lookup_constants import OrganizationInvitationStatus


class SamGovEntityResponseSchema(Schema):
    """Schema for SAM.gov entity information in organization responses"""

    uei = fields.String(
        metadata={"description": "Unique Entity Identifier", "example": "000123456789"}
    )
    legal_business_name = fields.String(
        metadata={"description": "Legal business name from SAM.gov", "example": "Example Inc."}
    )
    expiration_date = fields.Date(
        metadata={"description": "SAM.gov registration expiration date", "example": "2025-08-11"}
    )
    ebiz_poc_email = fields.String(
        metadata={
            "description": "Email address of the Electronic Business Point of Contact",
            "example": "ebiz@example.com",
        }
    )
    ebiz_poc_first_name = fields.String(
        metadata={
            "description": "First name of the Electronic Business Point of Contact",
            "example": "John",
        }
    )
    ebiz_poc_last_name = fields.String(
        metadata={
            "description": "Last name of the Electronic Business Point of Contact",
            "example": "Smith",
        }
    )


class OrganizationDataSchema(Schema):
    """Schema for organization data in responses"""

    organization_id = fields.UUID(
        metadata={
            "description": "Organization unique identifier",
            "example": "123e4567-e89b-12d3-a456-426614174000",
        }
    )
    sam_gov_entity = fields.Nested(
        SamGovEntityResponseSchema,
        allow_none=True,
        metadata={"description": "SAM.gov entity information"},
    )


class OrganizationMemberSchema(Schema):
    """Schema for organization member information"""

    user_id = fields.UUID(
        metadata={
            "description": "User unique identifier",
            "example": "123e4567-e89b-12d3-a456-426614174000",
        }
    )
    email = fields.String(
        allow_none=True,
        metadata={"description": "User email from login.gov", "example": "user@example.com"},
    )
    roles = fields.List(
        fields.Nested(RoleSchema),
        metadata={"description": "User roles in this organization"},
    )
    first_name = fields.String(
        allow_none=True, metadata={"description": "User first name", "example": "John"}
    )
    last_name = fields.String(
        allow_none=True, metadata={"description": "User last name", "example": "Smith"}
    )


class OrganizationGetResponseSchema(AbstractResponseSchema):
    """Schema for GET /organizations/:organization_id response"""

    data = fields.Nested(
        OrganizationDataSchema, metadata={"description": "Organization information"}
    )


class OrganizationUsersResponseSchema(AbstractResponseSchema):
    """Schema for POST /organizations/:organization_id/users response"""

    data = fields.List(
        fields.Nested(OrganizationMemberSchema),
        metadata={"description": "List of organization members"},
    )


class OrganizationListRolesResponseSchema(AbstractResponseSchema):
    """Schema for POST /organizations/:organization_id/roles/list response"""

    data = fields.List(fields.Nested(RoleSchema), metadata={"description": "Role information"})


class OrganizationUpdateUserRolesRequestSchema(Schema):
    role_ids = fields.List(fields.UUID(required=True), validate=Length(min=1))


class OrganizationUpdateUserRolesResponseSchema(AbstractResponseSchema):
    """Schema for PUT /organizations/:organization_id/users/:user_id"""

    data = fields.List(fields.Nested(RoleSchema), metadata={"description": "Role information"})


class OrganizationRemoveUserResponseSchema(AbstractResponseSchema):
    """Schema for DELETE /organizations/:organization_id/users/:user_id response"""

    data = fields.Raw(
        allow_none=True, metadata={"description": "No data returned on successful removal"}
    )


# Organization Create Invitation Schemas


class OrganizationCreateInvitationRequestSchema(Schema):
    """Schema for POST /organizations/:organization_id/invitations request"""

    invitee_email = fields.String(
        required=True,
        validate=Email(),
        metadata={
            "description": "Email address of the user to invite",
            "example": "user@example.com",
        },
    )
    role_ids = fields.List(
        fields.UUID(required=True),
        required=True,
        validate=Length(min=1),
        metadata={
            "description": "List of role IDs to assign to the invited user",
            "example": ["123e4567-e89b-12d3-a456-426614174000"],
        },
    )


class OrganizationInvitationResponseSchema(Schema):
    """Schema for organization invitation data in responses"""

    organization_invitation_id = fields.UUID(
        metadata={
            "description": "Invitation unique identifier",
            "example": "123e4567-e89b-12d3-a456-426614174000",
        }
    )
    organization_id = fields.UUID(
        metadata={
            "description": "Organization unique identifier",
            "example": "123e4567-e89b-12d3-a456-426614174000",
        }
    )
    invitee_email = fields.String(
        metadata={"description": "Email address of the invited user", "example": "user@example.com"}
    )
    status = fields.String(
        metadata={
            "description": "Current status of the invitation",
            "example": "pending",
            "enum": ["pending", "accepted", "rejected", "expired"],
        }
    )
    expires_at = fields.DateTime(
        metadata={
            "description": "When the invitation expires",
            "example": "2024-01-15T10:30:00Z",
        }
    )
    roles = fields.List(
        fields.Nested(RoleSchema),
        metadata={"description": "Roles assigned to this invitation"},
    )
    created_at = fields.DateTime(
        metadata={
            "description": "When the invitation was created",
            "example": "2024-01-08T10:30:00Z",
        }
    )


class OrganizationCreateInvitationResponseSchema(AbstractResponseSchema):
    """Schema for POST /organizations/:organization_id/invitations response"""

    data = fields.Nested(
        OrganizationInvitationResponseSchema,
        metadata={"description": "Created invitation information"},
    )


# Organization Invitations List Schemas


class OrganizationInvitationFilterSchema(Schema):
    """Schema for filtering organization invitations by status"""

    status = fields.Nested(
        StrSearchSchemaBuilder("InvitationStatusFilterSchema")
        .with_one_of(allowed_values=OrganizationInvitationStatus, example="pending")
        .build(),
        allow_none=True,
        metadata={"description": "Filter invitations by status"},
    )


class OrganizationInvitationListRequestSchema(Schema):
    """Schema for POST /organizations/:organization_id/invitations/list request"""

    filters = fields.Nested(
        OrganizationInvitationFilterSchema,
        allow_none=True,
        metadata={"description": "Filters to apply to the invitation list"},
    )


class InviterDataSchema(Schema):
    """Schema for inviter user information in invitation responses"""

    user_id = fields.UUID(
        metadata={
            "description": "Inviter user unique identifier",
            "example": "123e4567-e89b-12d3-a456-426614174000",
        }
    )
    email = fields.String(
        metadata={"description": "Inviter email address", "example": "admin@org.com"}
    )
    first_name = fields.String(
        allow_none=True, metadata={"description": "Inviter first name", "example": "John"}
    )
    last_name = fields.String(
        allow_none=True, metadata={"description": "Inviter last name", "example": "Doe"}
    )


class InviteeDataSchema(Schema):
    """Schema for invitee user information in invitation responses"""

    user_id = fields.UUID(
        allow_none=True,
        metadata={
            "description": "Invitee user unique identifier (null if not registered)",
            "example": "123e4567-e89b-12d3-a456-426614174000",
        },
    )
    email = fields.String(
        allow_none=True,
        metadata={"description": "Invitee email address", "example": "user@example.com"},
    )
    first_name = fields.String(
        allow_none=True, metadata={"description": "Invitee first name", "example": "Jane"}
    )
    last_name = fields.String(
        allow_none=True, metadata={"description": "Invitee last name", "example": "Smith"}
    )


class OrganizationInvitationDataSchema(Schema):
    """Schema for individual organization invitation data"""

    organization_invitation_id = fields.UUID(
        metadata={
            "description": "Invitation unique identifier",
            "example": "123e4567-e89b-12d3-a456-426614174000",
        }
    )
    invitee_email = fields.String(
        metadata={"description": "Email address of the invitee", "example": "user@example.com"}
    )
    status = fields.String(
        metadata={"description": "Current status of the invitation", "example": "pending"}
    )
    created_at = fields.DateTime(
        metadata={
            "description": "When the invitation was created",
            "example": "2024-01-08T10:30:00Z",
        }
    )
    expires_at = fields.DateTime(
        metadata={"description": "When the invitation expires", "example": "2024-01-15T10:30:00Z"}
    )
    accepted_at = fields.DateTime(
        allow_none=True,
        metadata={
            "description": "When the invitation was accepted",
            "example": "2024-01-10T14:20:00Z",
        },
    )
    rejected_at = fields.DateTime(
        allow_none=True,
        metadata={"description": "When the invitation was rejected", "example": None},
    )
    inviter_user = fields.Nested(
        InviterDataSchema,
        metadata={"description": "Information about the user who sent the invitation"},
    )
    invitee_user = fields.Nested(
        InviteeDataSchema,
        allow_none=True,
        metadata={"description": "Information about the invited user (null if not registered)"},
    )
    roles = fields.List(
        fields.Nested(RoleSchema),
        metadata={"description": "Roles that will be assigned when invitation is accepted"},
    )


class OrganizationInvitationListResponseSchema(AbstractResponseSchema):
    """Schema for POST /organizations/:organization_id/invitations/list response"""

    data = fields.List(
        fields.Nested(OrganizationInvitationDataSchema),
        metadata={"description": "List of organization invitations"},
    )


class OrganizationIgnoreLegacyUserRequestSchema(Schema):
    """Schema for handling requests to ignore a legacy user within an organization."""

    email = fields.String(
        required=True, metadata={"description": "Email address of the legacy user to ignore"}
    )


class OrganizationIgnoreLegacyUserResponseSchema(AbstractResponseSchema):
    data = fields.MixinField(metadata={"example": None})
