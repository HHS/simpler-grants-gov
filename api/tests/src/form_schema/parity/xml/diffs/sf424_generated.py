"""The generated SF-424's XML mapping against SF424_4_0-V4.0.xsd."""

from ..harness.form_diff import FormDiff

EMAIL = (
    "Intentional: EmailDataType in GlobalLibrary-V2.0.xsd needs at least one character. The "
    "form omits minLength because `format: email` already rejects an empty string, and two "
    "errors for one problem confuse applicants (see src/form_schema/shared/common_shared.py)."
)

DIFF = FormDiff(
    module="sf424_generated",
    differing_rules={
        "Email/minLength": EMAIL,
        "AuthorizedRepresentativeEmail/minLength": EMAIL,
    },
)
