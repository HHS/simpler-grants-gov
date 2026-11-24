"""The generated SF-424 R&R Multi-Project Cover's XML mapping against
RR_SF424_Multi_Project_Cover_4_0-V4.0.xsd.

It has no hand-written twin, so this is the form's only XML record.
"""

from ..harness.form_diff import FormDiff

CONTACTS = ("ApplicantInfo.ContactPersonInfo", "PDPIContactInfo", "AORInfo")

DIFF = FormDiff(
    module="sf424_r_r_multi_project_cover_generated",
    differing_rules={
        f"{contact}.Email/minLength": (
            "Intentional: globLib:EmailDataType sets minLength 1, but the form omits it "
            "because `format: email` already rejects an empty string, and two errors for one "
            "problem confuse applicants (see src/form_schema/shared/common_shared.py)."
        )
        for contact in CONTACTS
    },
)
