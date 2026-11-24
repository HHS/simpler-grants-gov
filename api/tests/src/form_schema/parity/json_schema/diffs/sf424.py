"""How the generated SF-424 corresponds to the hand-written form it mirrors.

The hand-written form lists almost every field at the top level. The generated form groups
them by concept (opportunity, application, applicant, project, contacts, budget and
certification), so nearly every field is mapped to its hand-written path. The two accept the
same answers except where they follow the Grants.gov schema or the DAT differently; each
entry below cites the one that decides it. Both require all nine ZIP digits for a US
address, as the DAT asks (08-d8). The rest is wording: the generated form labels most fields
in its layout, and takes its help from the question bank.
"""

from ..harness.form_diff import FormDiff

ADDRESS_FIELDS = (
    "street1",
    "street2",
    "city",
    "county",
    "state",
    "province",
    "country",
    "zip_code",
)
NAME_FIELDS = ("prefix", "first_name", "middle_name", "last_name", "suffix")
AMOUNTS = ("federal", "applicant", "state", "local", "other", "program_income")

# The generated layout labels the field as the hand-written form titles it. Its JSON Schema
# keeps the question bank's title, or none.
LAYOUT_LABEL = (
    "The generated form labels this field in its layout with the hand-written form's title; "
    "its JSON Schema keeps the question bank's title, or none."
)
BANK_HELP = "The generated form takes this help from the question bank's Address."
ATTACHMENT_HELP = (
    "The generated form takes the question bank's Attachment title and help for the file; "
    "its layout labels the field as the hand-written form titles it."
)
AMOUNT = (
    "BudgetAmountDataType in GlobalLibrary-V2.0.xsd is a decimal from 0.00 to "
    "999999999999.99 with at most two decimal places, which the generated form's pattern and "
    "15-character limit follow (DAT 18-a to 18-f). The hand-written form accepts a leading "
    "minus and any number of digits up to 14 characters, so it takes negative amounts the "
    "XSD rejects and caps large ones below what the XSD allows."
)
TOTAL = (
    "BudgetTotalAmountDataType in GlobalLibrary-V2.0.xsd is a decimal from 0.00 to "
    "9999999999999.99 with at most two decimal places, which the generated form's pattern and "
    "16-character limit follow (DAT 18-g). The hand-written form accepts a leading minus and "
    "any number of digits up to 14 characters."
)
DISTRICT_MIN = (
    "CongressionalDistrictDataType in GlobalLibrary-V2.0.xsd allows 1 to 6 characters. The "
    "DAT (16-a, 16-b) asks for a two-character state, a hyphen and a three-character "
    "district, such as CA-005, so the question bank's district needs all six. The "
    "hand-written form accepts any 1 to 6 characters."
)
DISTRICT_PATTERN = (
    "The generated form requires the DAT's format (16-a, 16-b): two state characters, a "
    "hyphen and three district characters (CA-005, MD-all, US-all, 00-000). The XSD's "
    "CongressionalDistrictDataType and the hand-written form set no pattern."
)


def _address(generated: str, handwritten: str) -> dict[str, str]:
    return {f"{generated}.{field}": f"{handwritten}.{field}" for field in ADDRESS_FIELDS}


def _name(generated: str, handwritten: str) -> dict[str, str]:
    return {f"{generated}.{field}": f"{handwritten}.{field}" for field in NAME_FIELDS}


def _each_amount(suffix: str, reason: str) -> dict[str, str]:
    return {f"budget.funding_sources.{amount}{suffix}": reason for amount in AMOUNTS}


DIFF = FormDiff(
    generated_module="sf424_generated",
    handwritten_module="sf424",
    mapped={
        "opportunity.agency_name": "agency_name",
        "opportunity.assistance_listing.number": "assistance_listing_number",
        "opportunity.assistance_listing.title": "assistance_listing_program_title",
        "opportunity.number": "funding_opportunity_number",
        "opportunity.title": "funding_opportunity_title",
        "opportunity.competition.number": "competition_identification_number",
        "opportunity.competition.title": "competition_identification_title",
        "application.submission_type": "submission_type",
        "application.application_type": "application_type",
        "application.revision.type": "revision_type",
        "application.revision.other_specify": "revision_other_specify",
        "application.date_received": "date_received",
        "application.applicant_id": "applicant_id",
        "application.federal_entity_identifier": "federal_entity_identifier",
        "application.federal_award_identifier": "federal_award_identifier",
        "application.state.received_date": "state_receive_date",
        "application.state.application_id": "state_application_id",
        "application.state_review.status": "state_review",
        "application.state_review.date": "state_review_available_date",
        "applicant.organization.name": "organization_name",
        "applicant.organization.ein": "employer_taxpayer_identification_number",
        "applicant.organization.uei": "sam_uei",
        **_address("applicant.organization.address", "applicant"),
        "applicant.organization.department": "department_name",
        "applicant.organization.division": "division_name",
        "applicant.type.codes": "applicant_type_code",
        "applicant.type.codes.[]": "applicant_type_code.[]",
        "applicant.type.other_specify": "applicant_type_other_specify",
        "applicant.congressional_district": "congressional_district_applicant",
        "applicant.delinquent_federal_debt.answer": "delinquent_federal_debt",
        "applicant.delinquent_federal_debt.explanation": "debt_explanation",
        "project.title": "project_title",
        "project.additional_titles": "additional_project_title",
        "project.additional_titles.[]": "additional_project_title.[]",
        "project.areas_affected": "areas_affected",
        "project.congressional_district": "congressional_district_program_project",
        "project.additional_congressional_districts": "additional_congressional_districts",
        "project.timeline.start_date": "project_start_date",
        "project.timeline.end_date": "project_end_date",
        **_name("contacts.point_of_contact.name", "contact_person"),
        "contacts.point_of_contact.title": "contact_person_title",
        "contacts.point_of_contact.organization.name": "organization_affiliation",
        "contacts.point_of_contact.phone": "phone_number",
        "contacts.point_of_contact.fax": "fax",
        "contacts.point_of_contact.email": "email",
        **_name("contacts.authorized_representative.name", "authorized_representative"),
        "contacts.authorized_representative.title": "authorized_representative_title",
        "contacts.authorized_representative.phone": "authorized_representative_phone_number",
        "contacts.authorized_representative.fax": "authorized_representative_fax",
        "contacts.authorized_representative.email": "authorized_representative_email",
        "budget.funding_sources.federal": "federal_estimated_funding",
        "budget.funding_sources.applicant": "applicant_estimated_funding",
        "budget.funding_sources.state": "state_estimated_funding",
        "budget.funding_sources.local": "local_estimated_funding",
        "budget.funding_sources.other": "other_estimated_funding",
        "budget.funding_sources.program_income": "program_income_estimated_funding",
        "budget.funding_sources.total": "total_estimated_funding",
        "certification.agree": "certification_agree",
        "certification.signature": "aor_signature",
        "certification.date_signed": "date_signed",
    },
    differing_rules={
        "application.revision.other_specify/minLength": (
            "RevisionOtherSpecify in SF424_4_0-V4.0.xsd sets minLength 0, which the generated "
            "form states and the hand-written form leaves out. Both accept the same answers."
        ),
        "application.state.application_id/minLength": (
            "StateApplicationID in SF424_4_0-V4.0.xsd sets minLength 0 (DAT 07-0), as the "
            "hand-written form does. The generated form takes the question bank's minimum of 1, "
            "so it rejects an empty string; an applicant leaves the optional field out instead."
        ),
        "application.state_review.status/enum": (
            "StateReview in SF424_4_0-V4.0.xsd spells options a and b with a capital State, as "
            "the generated form does (DAT 19-a, 19-b). The hand-written form saves them "
            "lowercased and maps them back to the XSD's spelling when it writes the XML."
        ),
        "applicant.organization.address.country/enum": (
            "UniversalCodes-V2.0.xsd spells CIV with a typographic apostrophe (U+2019), as the "
            "generated form does. The hand-written form offers it with a straight one (U+0027), "
            "a value the code list does not contain."
        ),
        "applicant.organization.address.zip_code/minLength": (
            "ZipPostalCodeDataType in GlobalLibrary-V2.0.xsd needs at least one character, as "
            "the generated form does. The hand-written form accepts an empty string outside "
            "the US, which the API writes as an empty element the XSD rejects. Both need nine "
            "characters for a US address (DAT 08-d8)."
        ),
        "applicant.type.codes.[]/enum": (
            "ApplicantTypeCodeDataType in GlobalLibrary-V2.0.xsd spells option H "
            "'H: Public/State Controlled Institution of Higher Education', as the generated "
            "form and DAT 09-0 do. The hand-written form offers 'Public/state' and capitalizes "
            "it when it writes the XML."
        ),
        "applicant.type.codes/uniqueItems": (
            "DAT 09-1 and 09-2 don't allow the same applicant type code twice, so the generated "
            "form rejects a repeated code. The hand-written form accepts one and writes it to "
            "two ApplicantTypeCode elements."
        ),
        "applicant.congressional_district/minLength": DISTRICT_MIN,
        "applicant.congressional_district/pattern": DISTRICT_PATTERN,
        "project.congressional_district/minLength": DISTRICT_MIN,
        "project.congressional_district/pattern": DISTRICT_PATTERN,
        "contacts.authorized_representative.email/minLength": (
            "EmailDataType in GlobalLibrary-V2.0.xsd needs at least one character. The "
            "hand-written form says so with minLength 1; the generated form's email format "
            "already rejects an empty string, so the two accept the same answers."
        ),
        **_each_amount("/maxLength", AMOUNT),
        **_each_amount("/pattern", AMOUNT),
        **_each_amount(
            "/minLength",
            "The hand-written form needs at least one character because its pattern accepts an "
            "empty string. The generated form's pattern needs at least one digit, so it needs "
            "no minLength.",
        ),
        "budget.funding_sources.total/maxLength": TOTAL,
        "budget.funding_sources.total/pattern": TOTAL,
        "budget.funding_sources.total/minLength": (
            "The hand-written form needs at least one character because its pattern accepts an "
            "empty string. The generated form's pattern needs at least one digit."
        ),
        "budget.funding_sources.total/required": (
            "TotalEstimatedFunding is required in SF424_4_0-V4.0.xsd and DAT 18-g, which also "
            "calls it a calculated field. The generated form makes it a read-only system value "
            "the applicant can't answer, so it doesn't ask the applicant for it; SGG fills it "
            "with the same sum_monetary rule as the hand-written form, from six required "
            "amounts."
        ),
        "certification.agree/enum": (
            "DAT 21-1 requires the applicant to check I Agree to provide the certifications and "
            "assurances, so the generated form only accepts true. CertificationAgree is a "
            "YesNoDataType in SF424_4_0-V4.0.xsd, and the hand-written form also accepts false."
        ),
    },
    differing_text={
        "applicant/title": (
            "The hand-written form's applicant is the address; the generated form's applicant "
            "is the untitled section that groups the organization, its type, its district and "
            "its debt. The address is applicant.organization.address."
        ),
        "applicant/description": "See applicant/title.",
        "opportunity.agency_name/title": LAYOUT_LABEL,
        "opportunity.number/title": LAYOUT_LABEL,
        "opportunity.title/title": LAYOUT_LABEL,
        "opportunity.competition.number/title": LAYOUT_LABEL,
        "opportunity.competition.title/title": LAYOUT_LABEL,
        "application.submission_type/title": LAYOUT_LABEL,
        "application.application_type/title": LAYOUT_LABEL,
        "application.revision.type/title": LAYOUT_LABEL,
        "application.revision.other_specify/title": LAYOUT_LABEL,
        "application.federal_entity_identifier/title": LAYOUT_LABEL,
        "application.state_review.status/title": LAYOUT_LABEL,
        "application.state_review.date/title": LAYOUT_LABEL,
        "applicant.organization.name/title": LAYOUT_LABEL,
        "applicant.organization.uei/title": (
            "The generated layout labels it UEI, as the paper form does (DAT 08-c); the "
            "hand-written form titles it with the DAT's field name, SAM UEI."
        ),
        "applicant.organization.address.state/description": BANK_HELP,
        "applicant.organization.address.country/description": BANK_HELP,
        "applicant.organization.address.zip_code/description": (
            "The hand-written help follows DAT 08-d8's nine-digit Postal Code wording. " + BANK_HELP
        ),
        "applicant.organization.department/title": LAYOUT_LABEL,
        "applicant.organization.division/title": LAYOUT_LABEL,
        "applicant.type.codes/title": LAYOUT_LABEL,
        "applicant.type.codes.[]/title": (
            "The generated form titles each selected type with the question bank's title; the "
            "hand-written form titles only the list."
        ),
        "applicant.type.codes.[]/description": (
            "The generated form describes each selected type with the question bank's help; "
            "the hand-written form describes only the list."
        ),
        "applicant.type.other_specify/title": LAYOUT_LABEL,
        "applicant.congressional_district/title": LAYOUT_LABEL,
        "applicant.delinquent_federal_debt.answer/title": (
            "The generated form takes the question bank's Yes or No title; its layout labels "
            "the field as the hand-written form titles it."
        ),
        "applicant.delinquent_federal_debt.explanation/title": ATTACHMENT_HELP,
        "applicant.delinquent_federal_debt.explanation/description": ATTACHMENT_HELP,
        "project.additional_titles/title": LAYOUT_LABEL,
        "project.additional_titles.[]/title": ATTACHMENT_HELP,
        "project.additional_titles.[]/description": ATTACHMENT_HELP,
        "project.areas_affected/title": ATTACHMENT_HELP,
        "project.congressional_district/title": LAYOUT_LABEL,
        "project.additional_congressional_districts/title": ATTACHMENT_HELP,
        "project.timeline.start_date/title": LAYOUT_LABEL,
        "project.timeline.end_date/title": LAYOUT_LABEL,
        "contacts.point_of_contact.phone/title": (
            "The question bank labels every person's phone Phone Number, as the R&R DATs do. "
            "DAT 08-f08 and the hand-written form say Telephone Number."
        ),
        "contacts.authorized_representative.phone/title": (
            "The question bank labels every person's phone Phone Number. The hand-written form "
            "titles it with DAT 22-07's field name, AOR Telephone Number."
        ),
        "contacts.authorized_representative.fax/title": (
            "The generated form labels the representative's fax as the question bank's Person "
            "does. The hand-written form titles it with DAT 22-09's field name, AOR Fax Number."
        ),
        "contacts.authorized_representative.email/title": (
            "The question bank labels every person's email Email, as DAT 22-08 does on the "
            "paper form. The hand-written form titles it with the DAT's field name, AOR Email."
        ),
        **_each_amount("/title", LAYOUT_LABEL),
        "budget.funding_sources.total/title": LAYOUT_LABEL,
        "certification.agree/title": (
            "The generated form labels the checkbox I Agree, as the paper form does (DAT 21-1). "
            "The hand-written form titles it with the DAT's field name, Certification Agree."
        ),
        "certification.agree/description": (
            "The generated layout shows the certification statement (DAT 21-0) on the "
            "Certification group and keeps the DAT's checkbox help on the field. The "
            "hand-written form puts the statement in the field's description."
        ),
        "certification.signature/title": (
            "The question bank titles it Signature. The hand-written form titles it with DAT "
            "22-10's field name, AOR Signature."
        ),
    },
    out_of_order={
        "contacts.authorized_representative.fax": (
            "The generated layout asks for the representative's fax after the email, as the "
            "DAT (22-07 to 22-09) and SF424_4_0-V4.0.xsd do. The hand-written form asks for it "
            "between the phone and the email."
        ),
    },
)
