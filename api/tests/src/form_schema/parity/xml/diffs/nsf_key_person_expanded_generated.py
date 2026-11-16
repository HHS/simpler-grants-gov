"""The generated NSF Senior/Key Person Profile (Expanded)'s XML mapping against
NSF_KeyPersonExpanded_3_3-V3.3.xsd.

It has no hand-written twin, so this is the form's only XML record.
"""

from ..harness.form_diff import FormDiff

DIFF = FormDiff(
    module="nsf_key_person_expanded_generated",
    differing_rules={
        f"{person}.Profile.Email/minLength": (
            "Intentional: the form omits minLength because `format: email` already rejects an "
            "empty string, and two errors for one problem confuse applicants (see "
            "src/form_schema/shared/common_shared.py)."
        )
        for person in ("PDPI", "KeyPerson")
    },
)
