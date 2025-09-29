from src.api.schemas.extension import Schema, fields
from src.api.schemas.response_schema import AbstractResponseSchema


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


class OrganizationUserRoleSchema(Schema):
    """Schema for user role information with privileges"""

    role_id = fields.UUID(
        metadata={
            "description": "Role unique identifier",
            "example": "123e4567-e89b-12d3-a456-426614174000",
        }
    )
    role_name = fields.String(
        metadata={"description": "Role name", "example": "Organization Admin"}
    )
    privileges = fields.List(
        fields.String(),
        metadata={
            "description": "List of privileges for this role",
            "example": ["manage_org_membership"],
        },
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
        fields.Nested(OrganizationUserRoleSchema),
        metadata={"description": "User roles in this organization"},
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
