"""Key Contacts' XML mapping against Key_Contacts_2_0-V2.0.xsd."""

from ..harness.form_diff import FormDiff

DIFF = FormDiff(
    module="key_contacts",
    differing_rules={
        "RoleOnProject.ContactAddress.Country/enum": (
            "Bug: the form offers `CIV: CÔTE D'IVOIRE` with a straight apostrophe, but "
            "CountryCodeDataTypeV3 in UniversalCodes-V2.0.xsd lists it with a curly one "
            "(U+2019). An applicant who selects Côte d'Ivoire produces XML that fails XSD "
            "validation."
        ),
        "RoleOnProject.ContactEmail/minLength": (
            "Intentional: the form omits minLength because `format: email` already rejects an "
            "empty string, and two errors for one problem confuse applicants (see "
            "src/form_schema/shared/common_shared.py)."
        ),
    },
)
