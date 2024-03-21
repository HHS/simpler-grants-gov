from src.api.schemas.extension import Schema, fields, validators
from src.api.schemas.search_schema import StrSearchSchemaBuilder
from src.constants.lookup_constants import (
    ApplicantType,
    FundingCategory,
    FundingInstrument,
    OpportunityCategory,
    OpportunityStatus,
)
from src.pagination.pagination_schema import generate_pagination_schema


class OpportunitySummarySchema(Schema):
    summary_description = fields.String(
        metadata={
            "description": "The summary of the opportunity",
            "example": "This opportunity aims to unravel the mysteries of the universe.",
        }
    )
    is_cost_sharing = fields.Boolean(
        metadata={
            "description": "Whether or not the opportunity has a cost sharing/matching requirement",
        }
    )
    is_forecast = fields.Boolean(
        metadata={
            "description": "Whether the opportunity is forecasted, that is, the information is only an estimate and not yet official",
            "example": False,
        }
    )

    close_date = fields.Date(
        metadata={
            "description": "The date that the opportunity will close - only set if is_forecast=False",
        }
    )
    close_date_description = fields.String(
        metadata={
            "description": "Optional details regarding the close date",
            "example": "Proposals are due earlier than usual.",
        }
    )

    post_date = fields.Date(
        metadata={
            "description": "The date the opportunity was posted",
        }
    )
    archive_date = fields.Date(
        metadata={
            "description": "When the opportunity will be archived",
        }
    )
    # not including unarchive date at the moment

    expected_number_of_awards = fields.Integer(
        metadata={
            "description": "The number of awards the opportunity is expected to award",
            "example": 10,
        }
    )
    estimated_total_program_funding = fields.Integer(
        metadata={
            "description": "The total program funding of the opportunity in US Dollars",
            "example": 10_000_000,
        }
    )
    award_floor = fields.Integer(
        metadata={
            "description": "The minimum amount an opportunity would award",
            "example": 10_000,
        }
    )
    award_ceiling = fields.Integer(
        metadata={
            "description": "The maximum amount an opportunity would award",
            "example": 100_000,
        }
    )

    additional_info_url = fields.String(
        metadata={
            "description": "A URL to a website that can provide additional information about the opportunity",
            "example": "grants.gov",
        }
    )
    additional_info_url_description = fields.String(
        metadata={
            "description": "The text to display for the additional_info_url link",
            "example": "Click me for more info",
        }
    )

    forecasted_post_date = fields.Date(
        metadata={
            "description": "Forecasted opportunity only. The date the opportunity is expected to be posted, and transition out of being a forecast"
        }
    )
    forecasted_close_date = fields.Date(
        metadata={
            "description": "Forecasted opportunity only. The date the opportunity is expected to be close once posted."
        }
    )
    forecasted_close_date_description = fields.String(
        metadata={
            "description": "Forecasted opportunity only. Optional details regarding the forecasted closed date.",
            "example": "Proposals will probably be due on this date",
        }
    )
    forecasted_award_date = fields.Date(
        metadata={
            "description": "Forecasted opportunity only. The date the grantor plans to award the opportunity."
        }
    )
    forecasted_project_start_date = fields.Date(
        metadata={
            "description": "Forecasted opportunity only. The date the grantor expects the award recipient should start their project"
        }
    )
    fiscal_year = fields.Integer(
        metadata={
            "description": "Forecasted opportunity only. The fiscal year the project is expected to be funded and launched"
        }
    )

    funding_category_description = fields.String(
        metadata={
            "description": "Additional information about the funding category",
            "example": "Economic Support",
        }
    )
    applicant_eligibility_description = fields.String(
        metadata={
            "description": "Additional information about the types of applicants that are eligible",
            "example": "All types of domestic applicants are eligible to apply",
        }
    )

    agency_code = fields.String(
        metadata={
            "description": "The agency who owns the opportunity",
            "example": "US-ABC",
        }
    )
    agency_name = fields.String(
        metadata={
            "description": "The name of the agency who owns the opportunity",
            "example": "US Alphabetical Basic Corp",
        }
    )
    agency_phone_number = fields.String(
        metadata={
            "description": "The phone number of the agency who owns the opportunity",
            "example": "123-456-7890",
        }
    )
    agency_contact_description = fields.String(
        metadata={
            "description": "Information regarding contacting the agency who owns the opportunity",
            "example": "For more information, reach out to Jane Smith at agency US-ABC",
        }
    )
    agency_email_address = fields.String(
        metadata={
            "description": "The contact email of the agency who owns the opportunity",
            "example": "fake_email@grants.gov",
        }
    )
    agency_email_address_description = fields.String(
        metadata={
            "description": "The text for the link to the agency email address",
            "example": "Click me to email the agency",
        }
    )

    funding_instruments = fields.List(fields.Enum(FundingInstrument))
    funding_categories = fields.List(fields.Enum(FundingCategory))
    applicant_types = fields.List(fields.Enum(ApplicantType))


class OpportunityAssistanceListingSchema(Schema):
    program_title = fields.String(
        metadata={
            "description": "The name of the program, see https://sam.gov/content/assistance-listings for more detail",
            "example": "Space Technology",
        }
    )
    assistance_listing_number = fields.String(
        metadata={
            "description": "The assistance listing number, see https://sam.gov/content/assistance-listings for more detail",
            "example": "43.012",
        }
    )


class OpportunitySchema(Schema):
    opportunity_id = fields.Integer(
        dump_only=True,
        metadata={"description": "The internal ID of the opportunity", "example": 12345},
    )

    opportunity_number = fields.String(
        metadata={"description": "The funding opportunity number", "example": "ABC-123-XYZ-001"}
    )
    opportunity_title = fields.String(
        metadata={
            "description": "The title of the opportunity",
            "example": "Research into conservation techniques",
        }
    )
    agency = fields.String(
        metadata={"description": "The agency who created the opportunity", "example": "US-ABC"}
    )

    category = fields.Enum(
        OpportunityCategory,
        metadata={
            "description": "The opportunity category",
            "example": OpportunityCategory.DISCRETIONARY,
        },
    )
    category_explanation = fields.String(
        metadata={
            "description": "Explanation of the category when the category is 'O' (other)",
            "example": None,
        }
    )

    opportunity_assistance_listings = fields.List(
        fields.Nested(OpportunityAssistanceListingSchema())
    )
    summary = fields.Nested(OpportunitySummarySchema())

    opportunity_status = fields.Enum(
        OpportunityStatus,
        metadata={
            "description": "The current status of the opportunity",
            "example": OpportunityStatus.POSTED,
        },
    )

    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class OpportunitySearchFilterSchema(Schema):
    funding_instrument = fields.Nested(
        StrSearchSchemaBuilder("FundingInstrumentFilterSchema")
        .with_one_of(allowed_values=FundingInstrument)
        .build()
    )
    funding_category = fields.Nested(
        StrSearchSchemaBuilder("FundingCategoryFilterSchema")
        .with_one_of(allowed_values=FundingCategory)
        .build()
    )
    applicant_type = fields.Nested(
        StrSearchSchemaBuilder("ApplicantTypeFilterSchema")
        .with_one_of(allowed_values=ApplicantType)
        .build()
    )
    opportunity_status = fields.Nested(
        StrSearchSchemaBuilder("OpportunityStatusFilterSchema")
        .with_one_of(allowed_values=OpportunityStatus)
        .build()
    )
    agency = fields.Nested(
        StrSearchSchemaBuilder("AgencyFilterSchema")
        .with_one_of(example="US-ABC", minimum_length=2)
        .build()
    )


class OpportunitySearchRequestSchema(Schema):
    query = fields.String(
        metadata={
            "description": "Query string which searches against several text fields",
            "example": "research",
        },
        validate=[validators.Length(min=1, max=100)],
    )

    filters = fields.Nested(OpportunitySearchFilterSchema())

    pagination = fields.Nested(
        generate_pagination_schema(
            "OpportunityPaginationSchema",
            [
                "opportunity_id",
                "opportunity_number",
                "opportunity_title",
                "post_date",
                "close_date",
                "agency_code",
            ],
        ),
        required=True,
    )
