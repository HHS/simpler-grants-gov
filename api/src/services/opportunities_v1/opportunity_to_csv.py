import csv
import io
import os
from collections.abc import Sequence
from typing import cast

from src.util.dict_util import flatten_dict

CSV_FIELDS = [
    "opportunity_id",
    "opportunity_number",
    "opportunity_title",
    "opportunity_status",
    "agency_code",
    "category",
    "category_explanation",
    "post_date",
    "close_date",
    "close_date_description",
    "archive_date",
    "is_cost_sharing",
    "expected_number_of_awards",
    "estimated_total_program_funding",
    "award_floor",
    "award_ceiling",
    "additional_info_url",
    "additional_info_url_description",
    "opportunity_assistance_listings",
    "funding_instruments",
    "funding_categories",
    "funding_category_description",
    "applicant_types",
    "applicant_eligibility_description",
    "agency_name",
    "top_level_agency_name",
    "agency_contact_description",
    "agency_email_address",
    "agency_email_address_description",
    "is_forecast",
    "forecasted_post_date",
    "forecasted_close_date",
    "forecasted_close_date_description",
    "forecasted_award_date",
    "forecasted_project_start_date",
    "fiscal_year",
    "created_at",
    "updated_at",
    "url",
    # We put the description at the end as it's the longest value
    # which can help improve readability of other fields
    "summary_description",
]


def _process_assistance_listing(assistance_listings: list[dict]) -> str:
    return ";".join(
        [f"{a['assistance_listing_number']}|{a['program_title']}" for a in assistance_listings]
    )


def _build_opportunity_url(opportunity_id: str, base_url: str) -> str:
    """
    Build the full frontend URL for an opportunity.
    """
    return f"{base_url}/opportunity/{opportunity_id}"


def opportunities_to_csv(
    opportunities: Sequence[dict],
    output: io.StringIO,
    has_full_fields: bool,
) -> None:
    csv_fields = (
        CSV_FIELDS
        if has_full_fields
        else [field for field in CSV_FIELDS if field != "summary_description"]
    )
    writer = csv.DictWriter(output, fieldnames=csv_fields, quoting=csv.QUOTE_ALL)
    writer.writeheader()

    csv_fields_set = set(CSV_FIELDS)
    base_url = os.getenv("FRONTEND_BASE_URL")
    for opportunity in opportunities:
        opp = flatten_dict(opportunity)

        out_opportunity = {}
        for k, v in opp.items():
            # Remove prefixes from nested data structures
            k = k.removeprefix("summary.")
            k = k.removeprefix("assistance_listings.")

            # Remove fields we haven't configured
            if k not in csv_fields_set:
                continue

            if k == "opportunity_assistance_listings":
                v = _process_assistance_listing(v)

            if k in ["funding_instruments", "funding_categories", "applicant_types"]:
                v = ";".join(v)

            out_opportunity[k] = v

        if base_url:
            out_opportunity["url"] = _build_opportunity_url(
                cast(str, opp.get("opportunity_id")), base_url
            )
        writer.writerow(out_opportunity)
