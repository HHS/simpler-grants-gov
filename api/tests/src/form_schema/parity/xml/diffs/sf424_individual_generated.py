"""The generated Application for Federal Domestic Assistance - Individual's XML mapping against
SF424_Individual_2_0-V2.0.xsd.

It has no hand-written twin, so this is the form's only XML record.
"""

from ..harness.form_diff import FormDiff

DIFF = FormDiff(
    module="sf424_individual_generated",
    differing_rules={
        # GlobalLibrary-V2.0.xsd EmailDataType: minLength 1, maxLength 60.
        "AuthorizedRepresentativeEmail/minLength": (
            "Intentional: the form omits minLength because `format: email` already rejects an "
            "empty string, and two errors for one problem confuse applicants (see "
            "src/form_schema/shared/common_shared.py)."
        ),
    },
)
