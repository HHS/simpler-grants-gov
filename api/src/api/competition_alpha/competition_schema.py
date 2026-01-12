from src.api.form_alpha.form_schema import FormAlphaSchema
from src.api.schemas.extension import Schema, fields, validators
from src.api.schemas.response_schema import AbstractResponseSchema
from src.api.schemas.shared_schema import OpportunityAssistanceListingV1Schema
from src.constants.lookup_constants import CompetitionOpenToApplicant


class CompetitionInstructionAlphaSchema(Schema):
    file_name = fields.String(
        metadata={
            "description": "The name of the instruction file",
            "example": "competition_instructions.pdf",
        }
    )
    download_path = fields.String(
        metadata={
            "description": "The URL to download the instruction file",
            "example": "https://cdn.example.com/competition-instructions/file.pdf",
        }
    )
    created_at = fields.DateTime(
        metadata={"description": "The date and time when the instruction was created"}
    )
    updated_at = fields.DateTime(
        metadata={"description": "The date and time when the instruction was last updated"}
    )


class CompetitionFormAlphaSchema(Schema):
    is_required = fields.Boolean(
        metadata={
            "description": "Whether the form is required for all applications to the competition"
        }
    )
    form = fields.Nested(
        FormAlphaSchema(),
        metadata={"description": "The form template information for this competition"},
    )


class CompetitionAlphaSchema(Schema):
    competition_id = fields.UUID(metadata={"description": "The competition ID"})

    opportunity_id = fields.UUID(
        metadata={"description": "The opportunity ID that the competition is associated with"}
    )

    competition_forms = fields.List(
        fields.Nested(CompetitionFormAlphaSchema()),
        metadata={"description": "List of forms required for this competition"},
    )

    competition_instructions = fields.List(
        fields.Nested(CompetitionInstructionAlphaSchema()),
        metadata={"description": "List of instruction files associated with this competition"},
    )

    competition_title = fields.String(
        allow_none=True,
        metadata={
            "description": "The title of the competition",
            "example": "Proposal for Advanced Research",
        },
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
    contact_info = fields.String(
        allow_none=True,
        metadata={
            "description": "Contact info getting assistance with the competition",
            "example": "Bob Smith\nFakeMail@fake.com",
        },
    )

    opportunity_assistance_listing = fields.Nested(
        OpportunityAssistanceListingV1Schema(),
        allow_none=True,
        metadata={"description": "Assistance listing information for this competition"},
    )

    open_to_applicants = fields.List(
        fields.Enum(CompetitionOpenToApplicant),
        metadata={
            "description": "List of applicant types who are eligible for this competition",
            "example": [
                CompetitionOpenToApplicant.INDIVIDUAL,
                CompetitionOpenToApplicant.ORGANIZATION,
            ],
        },
    )

    is_open = fields.Boolean(
        metadata={"description": "Whether the competition is open and accepting applications"}
    )

    is_simpler_grants_enabled = fields.Boolean(
        metadata={"description": "Whether simpler grants are enabled for this competition"}
    )


class CompetitionFlagUpdateSchema(Schema):
    is_simpler_grants_enabled = fields.Boolean(
        required=True,
        metadata={"description": "Whether simpler grants are enabled for this competition"},
    )


class CompetitionResponseAlphaSchema(AbstractResponseSchema):
    data = fields.Nested(CompetitionAlphaSchema())


class FormReplaceSchema(Schema):
    form_id = fields.UUID(required=True, metadata={"description": "The primary key ID of the form"})
    is_required = fields.Boolean(
        required=True, metadata={"description": "Whether the form is required"}
    )


class CompetitionFormsReplaceAlphaRequestSchema(Schema):
    forms = fields.List(
        fields.Nested(FormReplaceSchema),
        required=True,
        validate=validators.Length(min=1),
        metadata={"description": "List of forms to set on the competition"},
    )
