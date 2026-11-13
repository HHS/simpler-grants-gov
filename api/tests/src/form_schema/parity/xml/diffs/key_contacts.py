"""Key Contacts' XML mapping against Key_Contacts_2_0-V2.0.xsd."""

from ..harness.form_diff import FormDiff

DIFF = FormDiff(
    module="key_contacts",
    differing_rules={
        "RoleOnProject.ContactAddress.Country/enum": (
            "Bug: the form offers `CIV: CÔTE D'IVOIRE` (accent, straight apostrophe), which "
            "doesn't match either country code type in UniversalCodes-V2.0.xsd. An applicant "
            "who selects Côte d'Ivoire gets XML that fails XSD validation."
        ),
        "RoleOnProject.ContactAddress.ZipPostalCode/minLength": (
            "Bug: since #12967 the shared zip_code allows an empty string, and the form only "
            "adds a minimum for a US address. A blank foreign ZIP is accepted and written as an "
            "empty element, which ZipPostalCode (at least one character) rejects."
        ),
        "RoleOnProject.ContactEmail/minLength": (
            "Intentional: the form omits minLength because `format: email` already rejects an "
            "empty string, and two errors for one problem confuse applicants (see "
            "src/form_schema/shared/common_shared.py)."
        ),
    },
)
