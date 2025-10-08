from src.api.schemas.extension import Schema, fields
from src.api.schemas.extension.field_validators import Length
from src.api.schemas.response_schema import AbstractResponseSchema
from src.api.schemas.shared_schema import RoleSchema


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
