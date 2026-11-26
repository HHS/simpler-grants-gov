"""The generated SF424 Mandatory Form's XML mapping against SF424_Mandatory_3_0-V3.0.xsd.

It has no hand-written twin, so this is the form's only XML record.
"""

from ..harness.form_diff import FormDiff

DIFF = FormDiff(
    module="sf424_mandatory_generated",
    differing_rules={
        f"{element}/minLength": (
            "Intentional: the XSD's globLib:EmailDataType sets minLength 1, but the form omits "
            "it because `format: email` already rejects an empty string, and two errors for "
            "one problem confuse applicants (see src/form_schema/shared/common_shared.py)."
        )
        for element in ("ContactEmail", "AuthorizedRepresentativeEmail")
    },
)
