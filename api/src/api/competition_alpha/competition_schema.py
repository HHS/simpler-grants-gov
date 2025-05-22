from src.api.form_alpha.form_schema import FormAlphaSchema
from src.api.schemas.extension import Schema, fields
from src.api.schemas.response_schema import AbstractResponseSchema
from src.api.schemas.shared_schema import OpportunityAssistanceListingV1Schema
from src.constants.lookup_constants import CompetitionOpenToApplicant


class CompetitionFormAlphaSchema(Schema):
    is_required = fields.Boolean(
        metadata={
            "description": "Whether the form is required for all applications to the competition"
        }
    )
    form = fields.Nested(FormAlphaSchema())


class CompetitionAlphaSchema(Schema):
    competition_id = fields.UUID(metadata={"description": "The competition ID"})

    opportunity_id = fields.Integer(
        metadata={"description": "The opportunity ID that the competition is associated with"}
    )

    competition_forms = fields.List(fields.Nested(CompetitionFormAlphaSchema()))

    competition_title = fields.String(
        metadata={
            "description": "The title of the competition",
            "example": "Proposal for Advanced Research",
        }
    )
    opening_date = fields.Date(
        metadata={
            "description": "The opening date of the competition, the first day applications are accepted"
        }
    )
    closing_date = fields.Date(
        metadata={
            "description": "The closing date of the competition, the last day applications are accepted"
        }
    )
    contact_info = fields.String(
        metadata={
            "description": "Contact info getting assistance with the competition",
            "example": "Bob Smith\nFakeMail@fake.com",
        }
    )

    opportunity_assistance_listing = fields.Nested(OpportunityAssistanceListingV1Schema())

    open_to_applicants = fields.List(fields.Enum(CompetitionOpenToApplicant))

    is_open = fields.Boolean(
        metadata={"description": "Whether the competition is open and accepting applications"}
    )


class CompetitionResponseAlphaSchema(AbstractResponseSchema):
    data = fields.Nested(CompetitionAlphaSchema())
