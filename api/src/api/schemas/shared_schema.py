from src.api.schemas.extension import Schema, fields


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
