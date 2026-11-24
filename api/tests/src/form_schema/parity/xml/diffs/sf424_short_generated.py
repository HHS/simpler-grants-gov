"""The generated SF-424 Short Organizational's XML mapping against SF424_Short_3_0-V3.0.xsd."""

from ..harness.form_diff import FormDiff

# Each email is globLib:EmailDataType, which GlobalLibrary-V2.0.xsd gives a minLength of 1.
EMAILS = (
    "ProjectDirectorGroup.Email",
    "ContactPersonGroup.Email",
    "AuthorizedRepresentativeEmail",
)

DIFF = FormDiff(
    module="sf424_short_generated",
    differing_rules={
        f"{email}/minLength": (
            "Intentional: the form omits minLength because `format: email` already rejects an "
            "empty string, and two errors for one problem confuse applicants (see "
            "src/form_schema/shared/common_shared.py)."
        )
        for email in EMAILS
    },
)
