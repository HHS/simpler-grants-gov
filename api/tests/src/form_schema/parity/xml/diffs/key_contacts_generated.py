"""The generated Key Contacts' XML mapping against Key_Contacts_2_0-V2.0.xsd."""

from ..harness.form_diff import FormDiff

DIFF = FormDiff(
    module="key_contacts_generated",
    differing_rules={
        "RoleOnProject.ContactEmail/minLength": (
            "Intentional: the form omits minLength because `format: email` already rejects an "
            "empty string, and two errors for one problem confuse applicants (see "
            "src/form_schema/shared/common_shared.py)."
        ),
    },
)
