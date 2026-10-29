from src.api.schemas.extension import Schema, fields, validators
from src.constants.lookup_constants import Privilege


class RoleSchema(Schema):
    """Generic schema for role information with privileges"""

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
        fields.Enum(Privilege),
        metadata={
            "description": "List of privileges for this role",
            "example": [Privilege.MANAGE_ORG_MEMBERS],
        },
    )


class OpportunityAssistanceListingV1Schema(Schema):
    program_title = fields.String(
        allow_none=True,
        metadata={
            "description": "The name of the program, see https://sam.gov/content/assistance-listings for more detail",
            "example": "Space Technology",
        },
    )
    assistance_listing_number = fields.String(
        allow_none=True,
        metadata={
            "description": "The assistance listing number, see https://sam.gov/content/assistance-listings for more detail",
            "example": "43.012",
        },
    )


class SimpleUserSchema(Schema):
    """Schema for a simple user schema with user ID, name and email"""

    user_id = fields.UUID(
        metadata={
            "description": "ID of the user",
        }
    )
    email = fields.String(
        metadata={"description": "Email address of the user", "example": "example@example.com"},
        validate=[validators.Email()],
    )
    first_name = fields.String(
        allow_none=True, metadata={"description": "Users first name", "example": "John"}
    )
    last_name = fields.String(
        allow_none=True, metadata={"description": "Users last name", "example": "Smith"}
    )
