"""Performance Sites' XML mapping against PerformanceSite_4_0-V4.0.xsd."""

from ..harness.form_diff import FormDiff

DIFF = FormDiff(
    module="project_performance_site_location",
    differing_rules={
        f"{site}.Address.Country/enum": (
            "Bug: the form offers `CIV: CÔTE D'IVOIRE` (accent, straight apostrophe), which "
            "doesn't match either country code type in UniversalCodes-V2.0.xsd. An applicant "
            "who selects Côte d'Ivoire gets XML that fails XSD validation."
        )
        for site in ("PrimarySite", "OtherSite")
    },
)
