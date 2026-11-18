"""Compare Project Abstract Summary with the handwritten SGG form."""

from ..harness.form_diff import FormDiff

DIFF = FormDiff(
    generated_module="project_abstract_summary_generated",
    handwritten_module="project_abstract_summary",
    differing_text={
        "funding_opportunity_number/description": "Explains the existing opportunity prefill.",
        "assistance_listing_number/title": "Uses the Grants.gov label Assistance Listing Number(s).",
        "assistance_listing_number/description": "Explains when the existing listing prefill runs.",
        "applicant_name/description": "Uses source help on the organization name in place of the SF-424 cross-reference.",
        "project_title/description": "Uses source help on the project title in place of the SF-424 cross-reference.",
        "project_abstract/description": "Adds Grants.gov field help about entering an abstract.",
    },
)
