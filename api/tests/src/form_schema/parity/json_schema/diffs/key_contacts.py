"""How the generated Key Contacts corresponds to the hand-written form it mirrors.

Every field has the same path in both, so nothing is mapped. The two accept the same
answers except where the hand-written form disagrees with the Grants.gov schema. The rest
is wording the generated form takes from the question bank, and the order its layout asks
for a contact's role.
"""

from ..harness.form_diff import FormDiff

# The question bank words each shared question once, for every form that asks it.
BANK_HELP = (
    "The generated form takes this from the question bank's Person, which words it once for "
    "Key Contacts, EPA Key Contacts and the R&R key-person forms."
)
BANK_HELP_ADDED = (
    "The hand-written form gives no help here; the generated form takes the question bank's."
)

DIFF = FormDiff(
    generated_module="key_contacts_generated",
    handwritten_module="key_contacts",
    # Rules where the hand-written form disagrees with the Grants.gov schema, and the schema
    # says the hand-written one is wrong. Each is a defect for Simpler Grants to fix.
    differing_rules={
        "key_contacts.[].address.country/enum": (
            "UniversalCodes-V2.0.xsd spells CIV with a typographic apostrophe (U+2019), as the "
            "generated form does. The hand-written form offers it with a straight one (U+0027), "
            "a value the code list does not contain."
        ),
    },
    differing_text={
        "key_contacts.[]/title": (
            "The hand-written form labels each entry Key Contact in its UI schema rather than "
            "its JSON Schema; the generated form puts the same label on the item."
        ),
        "key_contacts.[].name/description": BANK_HELP_ADDED,
        "key_contacts.[].address/description": BANK_HELP,
        "key_contacts.[].address.state/description": BANK_HELP,
        "key_contacts.[].address.country/description": BANK_HELP,
        "key_contacts.[].address.zip_code/description": (
            "The hand-written help follows the SF-424 DATs' nine-digit Postal Code wording, "
            "which the Key Contacts DAT does not use. " + BANK_HELP
        ),
        "key_contacts.[].phone/title": (
            "The question bank labels every person's phone Phone Number, as hand-written EPA Key "
            "Contacts and the R&R DATs do. The Key Contacts DAT and the hand-written form say "
            "Telephone Number."
        ),
        "key_contacts.[].phone/description": BANK_HELP_ADDED,
        "key_contacts.[].fax/description": BANK_HELP_ADDED,
        "key_contacts.[].email/description": BANK_HELP_ADDED,
    },
    out_of_order={
        "key_contacts.[].title": (
            "The generated layout groups Project Role, Title and Organizational Affiliation "
            "under a Role heading ahead of the name. The hand-written form, like the DAT and "
            "XSD, asks for them after it."
        ),
        "key_contacts.[].organizational_affiliation": (
            "Grouped with Project Role and Title under the Role heading; see title."
        ),
    },
)
