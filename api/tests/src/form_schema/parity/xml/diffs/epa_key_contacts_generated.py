"""The generated EPA Key Contacts' XML mapping against EPA_KeyContacts_2_0-V2.0.xsd.

The XSD spells the third contact `AdminstrativeContact`, without the second `i`. The
mapping keeps the misspelling, because the element name is what Grants.gov reads.
"""

from ..harness.form_diff import FormDiff

CONTACTS = ("AuthorizedRepresentative", "Payee", "AdminstrativeContact", "ProjectManager")

DIFF = FormDiff(
    module="epa_key_contacts_generated",
    differing_rules={
        f"{contact}.Email/minLength": (
            "Intentional: the form omits minLength because `format: email` already rejects an "
            "empty string, and two errors for one problem confuse applicants (see "
            "src/form_schema/shared/common_shared.py)."
        )
        for contact in CONTACTS
    },
)
