"""How the generated EPA Key Contacts corresponds to the hand-written form it mirrors.

Every field has the same path in both, so nothing is mapped. The four contacts are the same
question bank Person asked four times, so most entries repeat once per contact. The two
accept the same answers except where the hand-written form disagrees with the Grants.gov
schema. The rest is wording the generated form takes from the DAT and the question bank,
and where the bank's address asks for the zip code.
"""

from ..harness.form_diff import FormDiff

CONTACTS = ("authorized_representative", "payee", "administrative_contact", "project_manager")

# The question bank words each shared question once, for every form that asks it.
BANK_HELP = (
    "The generated form takes this from the question bank's Person, which words it once for "
    "Key Contacts, EPA Key Contacts and the R&R key-person forms."
)
BANK_HELP_ADDED = (
    "The hand-written form gives no help here; the generated form takes the question bank's."
)
ROLE_HELP_ADDED = (
    "The hand-written form gives no help for the role; the generated form takes the EPA Key "
    "Contacts DAT's description of it."
)


def _each_contact(suffix: str, reason: str) -> dict[str, str]:
    return {f"{contact}{suffix}": reason for contact in CONTACTS}


DIFF = FormDiff(
    generated_module="epa_key_contacts_generated",
    handwritten_module="epa_key_contacts",
    absent_from_source={
        **_each_contact(
            ".address.county",
            "The question bank's Address carries County, as globLib:AddressDataTypeV3 does. "
            "The EPA layout doesn't ask for it, like the hand-written form, so no applicant "
            "can enter one, but the generated schema still accepts it.",
        ),
        **_each_contact(
            ".address.province",
            "The question bank's Address carries Province, as globLib:AddressDataTypeV3 does. "
            "The EPA layout doesn't ask for it, like the hand-written form, so no applicant "
            "can enter one, but the generated schema still accepts it.",
        ),
    },
    # Rules where the hand-written form disagrees with the Grants.gov schema, and the schema
    # says the hand-written one is wrong. Each is a defect for Simpler Grants to fix.
    differing_rules=_each_contact(
        ".address.country/enum",
        "UniversalCodes-V2.0.xsd spells CIV with a typographic apostrophe (U+2019), as the "
        "generated form does. The hand-written form offers it with a straight one (U+0027), a "
        "value the code list does not contain.",
    ),
    differing_text={
        **_each_contact(
            "/title",
            "The generated form titles each contact with the question bank Person's Contact "
            "Person; its layout labels each section with the role, as the hand-written UI "
            "schema does.",
        ),
        **_each_contact(
            ".email/title",
            "The question bank labels every person's email Email. The hand-written form, like "
            "the EPA Key Contacts DAT's help, says E-mail Address.",
        ),
        **_each_contact("/description", ROLE_HELP_ADDED),
        **_each_contact(".name/description", BANK_HELP_ADDED),
        **_each_contact(".address/description", BANK_HELP),
        **_each_contact(".address.state/description", BANK_HELP),
        **_each_contact(".address.country/description", BANK_HELP),
        **_each_contact(
            ".address.zip_code/description",
            "The hand-written help follows the SF-424 DATs' nine-digit Postal Code wording. "
            + BANK_HELP,
        ),
        **_each_contact(".phone/description", BANK_HELP_ADDED),
        **_each_contact(".fax/description", BANK_HELP_ADDED),
        **_each_contact(".email/description", BANK_HELP_ADDED),
    },
    out_of_order=_each_contact(
        ".address.zip_code",
        "The question bank's Address asks for the zip code after the country, for every form "
        "that asks it. The hand-written form, like the XSD, asks for it after the state. This "
        "only changes the on-screen order: the XML follows the XSD.",
    ),
)
