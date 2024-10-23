from enum import StrEnum

DEFAULT = [
    # Note that we do keyword for agency & opportunity number
    # as we don't want to compare to a tokenized value which
    # may have split on the dashes.
    "agency.keyword^16",
    "opportunity_title^2",
    "opportunity_number.keyword^12",
    "summary.summary_description",
    "opportunity_assistance_listings.assistance_listing_number^10",
    "opportunity_assistance_listings.program_title^4",
]

EXPANDED = [
    "agency.keyword",
    "agency_name",
    "top_level_agency_name",
    "opportunity_title",
    "opportunity_number.keyword",
    "category_explanation",
    "summary.summary_description",
    "summary.applicant_eligibility_description",
    "summary.funding_category_description",
    "opportunity_assistance_listings.assistance_listing_number",
    "opportunity_assistance_listings.program_title",
]


AGENCY = [
    "agency.keyword",
    "agency_name",
    "top_level_agency_name",
    "summary.agency_contact_description",
    "summary.agency_email_address.keyword",
    "summary.agency_email_address_description",
    "summary.agency_phone_number.keyword",
]


class ScoringRule(StrEnum):
    DEFAULT = "default"
    EXPANDED = "expanded"
    AGENCY = "agency"
