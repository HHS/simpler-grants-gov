from src.api.competition_alpha.competition_schema import CompetitionAlphaSchema
from src.api.schemas.extension import Schema, fields, validators
from src.api.schemas.response_schema import AbstractResponseSchema
from src.api.schemas.shared_schema import OpportunityAssistanceListingV1Schema
from src.constants.lookup_constants import CompetitionOpenToApplicant


class CompetitionInstructionCreateSchema(Schema):
    """Schema for competition instruction in create request"""

    file_name = fields.String(
        required=True,
        metadata={
            "description": "The name of the instruction file",
            "example": "competition_instructions.pdf",
        },
    )
    download_path = fields.String(
        required=True,
        metadata={
            "description": "The URL/path to the instruction file",
            "example": "s3://simpler-grants-gov-dev/competition-instructions/file.pdf",
        },
    )


class CompetitionCreateRequestItemSchema(Schema):
    """Schema for a single competition in the create request"""

    opportunity_id = fields.UUID(
        required=True, metadata={"description": "The opportunity ID this competition belongs to"}
    )
    competition_title = fields.String(
        required=True,
        metadata={
            "description": "The title of the competition",
            "example": "Proposal for Advanced Research",
        },
    )
    opening_date = fields.Date(
        required=True,
        metadata={"description": "The opening date of the competition", "example": "2026-05-18"},
    )
    closing_date = fields.Date(
        required=True,
        metadata={"description": "The closing date of the competition", "example": "2026-06-18"},
    )
    contact_info = fields.String(
        required=True,
        metadata={
            "description": "Contact information for the competition",
            "example": "Bob Smith\nFakeMail@fake.com",
        },
    )
    is_simpler_grants_enabled = fields.Boolean(
        required=True, metadata={"description": "Whether simpler grants are enabled"}
    )
    open_to_applicants = fields.List(
        fields.Enum(CompetitionOpenToApplicant),
        required=True,
        validate=validators.Length(min=1),
        metadata={
            "description": "List of applicant types eligible for this competition",
            "example": ["individual", "organization"],
        },
    )
    competition_instructions = fields.List(
        fields.Nested(CompetitionInstructionCreateSchema),
        required=True,
        metadata={"description": "List of instruction files"},
    )
    opportunity_assistance_listing = fields.Nested(
        OpportunityAssistanceListingV1Schema,
        required=True,
        metadata={
            "description": "Assistance listing information",
            "example": {"assistance_listing_number": "43.012", "program_title": "Space Technology"},
        },
    )


class CompetitionCreateRequestSchema(Schema):
    """Schema for POST /v1/competitions/ request - accepts a list of competitions"""

    pass


class CompetitionCreateResponseSchema(AbstractResponseSchema):
    """Schema for POST /v1/competitions/ response"""

    data = fields.Nested(CompetitionAlphaSchema())
