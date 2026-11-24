"""How the generated SF-424 Short Organizational corresponds to the hand-written form it
mirrors.

The hand-written form puts almost every field at the top level, named after its XSD
element. The generated form nests them by concept (opportunity, applicant, project,
contacts and certification), the same way across the SF-424 family, so nearly every field
is mapped. The two accept the same answers except where the hand-written form disagrees
with the Grants.gov schema or the DAT. The rest is wording the generated form takes from the
question bank, and the order the question bank asks for a contact's details.
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

# The applicant, project director and point of contact each have a full address.
ADDRESSES = (
    "applicant.organization.address",
    "contacts.project_director.address",
    "contacts.point_of_contact.address",
)
# The project director and point of contact share the same contact details.
CONTACTS = ("contacts.project_director", "contacts.point_of_contact")

# The question bank words each shared question once, for every form that asks it.
BANK_HELP = (
    "The generated form takes this from the question bank, which words it once for every "
    "form that asks it."
)
BANK_HELP_ADDED = (
    "The hand-written form gives no help here; the generated form takes the question bank's."
)


def _address(generated: str, handwritten: str) -> dict[str, str]:
    return {f"{generated}.{field}": f"{handwritten}.{field}" for field in ADDRESS_FIELDS}


def _name(generated: str, handwritten: str) -> dict[str, str]:
    return {f"{generated}.{field}": f"{handwritten}.{field}" for field in NAME_FIELDS}


def _contact(generated: str, handwritten: str) -> dict[str, str]:
    return {
        **_name(f"{generated}.name", f"{handwritten}.name"),
        f"{generated}.title": f"{handwritten}.title",
        **_address(f"{generated}.address", f"{handwritten}.address"),
        f"{generated}.phone": f"{handwritten}.phone_number",
        f"{generated}.fax": f"{handwritten}.fax",
        f"{generated}.email": f"{handwritten}.email",
    }


def _each(paths: tuple[str, ...], suffix: str, reason: str) -> dict[str, str]:
    return {f"{path}{suffix}": reason for path in paths}


DIFF = FormDiff(
    generated_module="sf424_short_generated",
    handwritten_module="sf424_short",
    mapped={
        "opportunity.agency_name": "agency_name",
        "opportunity.assistance_listing.number": "assistance_listing_number",
        "opportunity.assistance_listing.title": "assistance_listing_program_title",
        "opportunity.number": "funding_opportunity_number",
        "opportunity.title": "funding_opportunity_title",
        "application.date_received": "date_received",
        "applicant.organization.name": "organization_name",
        "applicant.organization.uei": "sam_uei",
        "applicant.organization.ein": "employer_taxpayer_identification_number",
        **_address("applicant.organization.address", "applicant"),
        "applicant.organization.web_address": "applicant_web_address",
        "applicant.type.codes": "applicant_type_code",
        "applicant.type.codes.[]": "applicant_type_code.[]",
        "applicant.type.other_specify": "applicant_type_other_specify",
        "applicant.congressional_district": "congressional_district_applicant",
        "project.title": "project_title",
        "project.description": "project_description",
        "project.timeline.start_date": "project_start_date",
        "project.timeline.end_date": "project_end_date",
        **_name("contacts.authorized_representative.name", "authorized_representative"),
        "contacts.authorized_representative.title": "authorized_representative_title",
        "contacts.authorized_representative.phone": "authorized_representative_phone_number",
        "contacts.authorized_representative.fax": "authorized_representative_fax",
        "contacts.authorized_representative.email": "authorized_representative_email",
        **_contact("contacts.project_director", "project_director"),
        "contacts.point_of_contact.same_as_project_director": "same_as_project_director",
        **_contact("contacts.point_of_contact", "contact_person"),
        "certification.agree": "application_certification",
        "certification.signature": "aor_signature",
        "certification.date_signed": "authorized_representative_date_signed",
    },
    # Rules where the hand-written form disagrees with the Grants.gov schema or the DAT, and
    # the source says the hand-written one is wrong. Each is a defect for Simpler Grants to fix.
    differing_rules={
        "applicant.type.codes.[]/enum": (
            "ApplicantTypeCodeDataType in GlobalLibrary-V2.0.xsd spells option H "
            "'H: Public/State Controlled Institution of Higher Education', as the generated "
            "form does. The hand-written form stores 'Public/state' and rewrites it in its XML "
            "transform."
        ),
        "applicant.type.codes/uniqueItems": (
            "DAT 5d-2 and 5d-3 don't allow the same applicant type code twice, so the generated "
            "form rejects a repeated code. The hand-written form accepts one and writes it to "
            "two ApplicantTypeCode elements."
        ),
        **_each(
            ADDRESSES,
            ".country/enum",
            "UniversalCodes-V2.0.xsd spells CIV with a typographic apostrophe (U+2019), as the "
            "generated form does. The hand-written form offers it with a straight one (U+0027), "
            "a value the code list does not contain.",
        ),
        **_each(
            ADDRESSES,
            ".zip_code/minLength",
            "ZipPostalCodeDataType in GlobalLibrary-V2.0.xsd needs at least one character, as "
            "the generated form does. Since #12967 the hand-written form accepts an empty "
            "string, which the API writes as an empty element the XSD rejects. Both forms "
            "need all nine digits (ZIP+4) for a US address, per DAT 5b-9, 7-19 and 8-20.",
        ),
        "applicant.congressional_district/minLength": (
            "DAT 5g-1 asks for a two-character state, a hyphen and a three-character district "
            "(CA-005, or 00-000 outside the US), so the generated form needs all six "
            "characters. The hand-written form follows CongressionalDistrictDataType in "
            "GlobalLibrary-V2.0.xsd, which allows one to six."
        ),
        "applicant.congressional_district/pattern": (
            "DAT 5g-1's format, as for minLength. CongressionalDistrictDataType has no pattern, "
            "so the hand-written form accepts any one to six characters."
        ),
        "certification.agree/enum": (
            "DAT 9-02 requires checking I Agree, so the generated form accepts only true. The "
            "hand-written form also accepts false, which the XSD's YesNoDataType would write "
            "as N: No."
        ),
    },
    differing_text={
        "applicant.organization.name/title": (
            "The generated JSON Schema takes the question bank's Organization Name; its layout "
            "labels the field Legal Name, as DAT 5a-1 and the hand-written form do."
        ),
        "applicant.organization.name/description": (
            "The hand-written help adds a note on SAM.gov registration that DAT 5a-1 does not "
            "have. " + BANK_HELP
        ),
        "applicant.organization.uei/title": (
            "The generated JSON Schema takes the question bank's Organization UEI; its layout "
            "labels the field UEI, as DAT 5f-1 does. The hand-written form says SAM UEI."
        ),
        "applicant.type.codes/title": (
            "The hand-written form titles the list; the generated form titles each entry, from "
            "the question bank's applicant type, and its layout labels the list Type of "
            "Applicant."
        ),
        "applicant.type.codes.[]/title": "Titled on the entry, not the list; see codes.",
        "applicant.type.codes.[]/description": BANK_HELP_ADDED,
        "applicant.congressional_district/title": (
            "The generated layout labels the field Congressional District of Applicant, as DAT "
            "5g-1 does; the shared congressional district type has no title of its own."
        ),
        "project.timeline.start_date/title": (
            "The generated form takes the question bank's Start Date, as DAT 6c-2 labels it. "
            "The hand-written form says Project Start Date."
        ),
        "project.timeline.end_date/title": (
            "The generated form takes the question bank's End Date, as DAT 6c-3 labels it. "
            "The hand-written form says Project End Date."
        ),
        "contacts.authorized_representative.phone/title": (
            "The question bank labels every person's phone Phone Number, as the R&R DATs do. "
            "DAT 9-12 and the hand-written form say Telephone Number."
        ),
        **_each(ADDRESSES, ".state/description", BANK_HELP),
        **_each(ADDRESSES, ".country/description", BANK_HELP),
        **_each(
            ADDRESSES,
            ".zip_code/description",
            "The hand-written help follows the DAT's nine-digit Postal Code wording. " + BANK_HELP,
        ),
        **_each(
            CONTACTS,
            ".phone/title",
            "The question bank labels every person's phone Phone Number, as the R&R DATs do. "
            "DAT 7-10 and 8-11 and the hand-written form say Telephone Number.",
        ),
        **_each(CONTACTS, ".phone/description", BANK_HELP),
        **_each(CONTACTS, ".email/description", BANK_HELP),
        "certification.agree/title": (
            "The hand-written title keeps the DAT's ** footnote marker, which points to a note "
            "the generated layout shows as the certification statement."
        ),
        "certification.agree/description": (
            "The generated form takes DAT 9-02's help; the hand-written form gives none."
        ),
        "certification.signature/title": (
            "The generated form takes the shared certification's Signature. DAT 9-14 and the "
            "hand-written form say Signature of Authorized Representative."
        ),
        "applicant/title": (
            "The hand-written applicant is the address itself, titled Address. The generated "
            "applicant is a group with no title; its address is "
            "applicant.organization.address."
        ),
        "applicant/description": "The hand-written applicant is the address; see title.",
    },
    out_of_order={
        "application.date_received": (
            "The generated layout shows the whole opportunity section (DAT items 1, 2 and 4) "
            "before the application section, so Date Received comes after the funding "
            "opportunity title. The hand-written form, like the DAT, shows it as item 3."
        ),
        **_each(
            CONTACTS,
            ".phone",
            "The question bank's Person asks for the address before phone, fax and email, as "
            "ContactPersonDataTypeV3 in GlobalLibrary-V2.0.xsd orders them. The hand-written "
            "form, like DAT 7-09 to 7-11 and 8-10 to 8-12, asks for email, phone and fax "
            "right after the title.",
        ),
        **_each(CONTACTS, ".fax", "Asked after the address; see phone."),
        **_each(CONTACTS, ".email", "Asked after the address; see phone."),
    },
)
