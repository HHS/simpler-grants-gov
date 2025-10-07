from src.api.schemas.extension import Schema, fields
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
