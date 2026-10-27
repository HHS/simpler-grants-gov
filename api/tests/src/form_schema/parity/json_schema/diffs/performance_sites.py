"""How the generated Performance Sites corresponds to the hand-written form it mirrors.

Every field has the same path in both, so nothing is mapped. The two accept the same
answers except where the hand-written form disagrees with the Grants.gov schema. The rest
is wording the generated form takes from its definition and the question bank.
"""

from ..harness.form_diff import FormDiff

SITES = ("primary_site", "additional_sites.[]")

# The question bank words each shared question once, for every form that asks it.
BANK_HELP = (
    "The generated form takes this from the question bank's Address, which words it once for "
    "every form that asks for an address."
)


def _each_site(suffix: str, reason: str) -> dict[str, str]:
    return {f"{site}{suffix}": reason for site in SITES}


DIFF = FormDiff(
    generated_module="performance_sites_generated",
    handwritten_module="project_performance_site_location",
    # Rules where the hand-written form disagrees with the Grants.gov schema, and the schema
    # says the hand-written one is wrong. Each is a defect for Simpler Grants to fix.
    differing_rules=_each_site(
        ".address.country/enum",
        "UniversalCodes-V2.0.xsd spells CIV with a typographic apostrophe (U+2019), as the "
        "generated form does. The hand-written form offers it with a straight one (U+0027), a "
        "value the code list does not contain.",
    ),
    differing_text={
        "primary_site/title": (
            "The generated form titles the primary site; the hand-written form labels it in "
            "its UI schema only."
        ),
        "additional_sites/title": (
            "The generated form titles the list Additional site, after each entry; the "
            "hand-written form titles it Additional Project/Performance Site Locations."
        ),
        "additional_sites/description": (
            "The generated form adds that each additional site's answers are independent."
        ),
        **_each_site(
            ".uei/description",
            "The generated help adds that the UEI is optional.",
        ),
        **_each_site(".address/description", BANK_HELP),
        **_each_site(".address.state/description", BANK_HELP),
        **_each_site(".address.country/description", BANK_HELP),
        **_each_site(
            ".address.zip_code/description",
            "The hand-written help follows the SF-424 DATs' nine-digit Postal Code wording. "
            + BANK_HELP,
        ),
    },
)
