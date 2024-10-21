import csv
import io
from typing import Sequence

from src.util.dict_util import flatten_dict

CSV_FIELDS = [
    "opportunity_id",
    "opportunity_number",
    "opportunity_title",
    "opportunity_status",
    "agency",
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
    "agency_code",
    "agency_name",
    "top_agency_name",
    "agency_phone_number",
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
    # We put the description at the end as it's the longest value
    # which can help improve readability of other fields
    "summary_description",
]
# Same as above, but faster lookup
CSV_FIELDS_SET = set(CSV_FIELDS)


def _process_assistance_listing(assistance_listings: list[dict]) -> str:
    return ";".join(
        [f"{a['assistance_listing_number']}|{a['program_title']}" for a in assistance_listings]
    )


def opportunities_to_csv(opportunities: Sequence[dict], output: io.StringIO) -> None:
    opportunities_to_write: list[dict] = []

    for opportunity in opportunities:
        opp = flatten_dict(opportunity)

        out_opportunity = {}
        for k, v in opp.items():
            # Remove prefixes from nested data structures
            k = k.removeprefix("summary.")
            k = k.removeprefix("assistance_listings.")

            # Remove fields we haven't configured
            if k not in CSV_FIELDS_SET:
                continue

            if k == "opportunity_assistance_listings":
                v = _process_assistance_listing(v)

            if k in ["funding_instruments", "funding_categories", "applicant_types"]:
                v = ";".join(v)

            out_opportunity[k] = v

        opportunities_to_write.append(out_opportunity)

    writer = csv.DictWriter(output, fieldnames=CSV_FIELDS, quoting=csv.QUOTE_ALL)
    writer.writeheader()
    writer.writerows(opportunities_to_write)
