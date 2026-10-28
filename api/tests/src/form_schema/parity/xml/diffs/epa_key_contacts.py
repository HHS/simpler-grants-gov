"""EPA Key Contacts' XML mapping against EPA_KeyContacts_2_0-V2.0.xsd."""

from ..harness.form_diff import FormDiff

CONTACTS = ("AuthorizedRepresentative", "Payee", "AdminstrativeContact", "ProjectManager")

DIFF = FormDiff(
    module="epa_key_contacts",
    differing_rules={
        **{
            f"{contact}.Address.Country/enum": (
                "Bug: the form offers `CIV: CÔTE D'IVOIRE` (accent, straight apostrophe), which "
                "doesn't match either country code type in UniversalCodes-V2.0.xsd. An "
                "applicant who selects Côte d'Ivoire gets XML that fails XSD validation."
            )
            for contact in CONTACTS
        },
        **{
            f"{contact}.Email/minLength": (
                "Intentional: the form omits minLength because `format: email` already "
                "rejects an empty string, and two errors for one problem confuse applicants "
                "(see src/form_schema/shared/common_shared.py)."
            )
            for contact in CONTACTS
        },
    },
)
