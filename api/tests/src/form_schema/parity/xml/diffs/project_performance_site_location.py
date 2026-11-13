"""Performance Sites' XML mapping against PerformanceSite_4_0-V4.0.xsd."""

from ..harness.form_diff import FormDiff

SITES = ("PrimarySite", "OtherSite")

DIFF = FormDiff(
    module="project_performance_site_location",
    differing_rules={
        **{
            f"{site}.Address.Country/enum": (
                "Bug: the form offers `CIV: CÔTE D'IVOIRE` (accent, straight apostrophe), which "
                "doesn't match either country code type in UniversalCodes-V2.0.xsd. An applicant "
                "who selects Côte d'Ivoire gets XML that fails XSD validation."
            )
            for site in SITES
        },
        **{
            f"{site}.Address.ZipPostalCode/minLength": (
                "Bug: since #12967 the shared zip_code allows an empty string, and the form only "
                "adds a minimum for a US address. A blank foreign ZIP is accepted and written as "
                "an empty element, which ZipPostalCode (at least one character) rejects."
            )
            for site in SITES
        },
    },
)
