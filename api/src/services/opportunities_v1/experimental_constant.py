from enum import StrEnum

DEFAULT = [
    # Note that we do keyword & non-keyword for agency & opportunity number
    # as we don't want to compare to a tokenized value which
    # may have split on the dashes, but also still support prefixing (eg. USAID-*)
    "agency_code^16",
    "agency_code.keyword^16",
    "top_level_agency_code^16",
    "top_level_agency_code.keyword^16",
    "agency_name",
    "top_level_agency_name",
    "opportunity_title^2",
    "opportunity_number^12",
    "opportunity_number.keyword^12",
    "summary.summary_description",
    "opportunity_assistance_listings.assistance_listing_number^10",
    "opportunity_assistance_listings.program_title^4",
]


EXPANDED = [
    "agency_code",
    "agency_code.keyword",
    "top_level_agency_code",
    "top_level_agency_code.keyword",
    "agency_name",
    "top_level_agency_name",
    "opportunity_title",
    "opportunity_number",
    "opportunity_number.keyword",
    "category_explanation",
    "summary.summary_description",
    "summary.applicant_eligibility_description",
    "summary.funding_category_description",
    "opportunity_assistance_listings.assistance_listing_number",
    "opportunity_assistance_listings.program_title",
]


AGENCY = [
    "agency_code",
    "agency_code.keyword",
    "top_level_agency_code",
    "top_level_agency_code.keyword",
    "agency_name",
    "top_level_agency_name",
    "summary.agency_contact_description",
    "summary.agency_email_address.keyword",
    "summary.agency_email_address_description",
    "summary.agency_phone_number.keyword",
]

ATTACHMENT_ONLY = [
    "attachments.attachment.content",
]


class ScoringRule(StrEnum):
    DEFAULT = "default"
    EXPANDED = "expanded"
    AGENCY = "agency"
