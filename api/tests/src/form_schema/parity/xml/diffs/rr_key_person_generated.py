"""The generated R&R Senior/Key Person Profile's XML mapping against RR_KeyPerson_3_0-V3.0.xsd.

It has no hand-written twin, so this is the form's only XML record.
"""

from ..harness.form_diff import FormDiff

DIFF = FormDiff(
    module="rr_key_person_generated",
    differing_rules={
        f"{person}.Profile.Email/minLength": (
            "Intentional: the form omits minLength because `format: email` already rejects an "
            "empty string, and two errors for one problem confuse applicants (see "
            "src/form_schema/shared/common_shared.py)."
        )
        for person in ("PDPI", "KeyPerson")
    },
)
