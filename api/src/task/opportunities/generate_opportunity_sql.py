"""
Utility for generating SQL to create an opportunity by copying an existing opportunity

Because we don't currently have any endpoints for creating an
opportunity, this instead just generates the SQL that you can insert
into the database.

Can be run by doing:
    make cmd args="task generate-opportunity-sql --environment=staging --opportunity-id=<opportunity_id>"

Requires that you set the NON_LOCAL_API_AUTH_TOKEN environment variable to
an API auth token capable of calling the API in a given environment.

A few important notes about the behavior:
* All primary key IDs are changed so that it's safe to use this as a way to copy
  an opportunity in a given environment. This includes the opportunity, opportunity summary and competition IDs.
* Any files are not copied at this time (opportunity attachments, competition instructions)
  due to not having a way to fetch the s3 file paths. Could eventually build that by
  mapping our CDN values back to their buckets.
* Opportunity Number gets a random string appended to it so that it is unique
* If you'd like to change the values in a particular table, you have to adjust the SQL manually
"""

import dataclasses
import logging
import random
import secrets
import string
import uuid
from collections.abc import Callable
from datetime import date, datetime
from enum import StrEnum
from typing import Any, TypeVar, cast

import click
import requests
from sqlalchemy import inspect

import src.db.models.lookup_models as lookup_models
from src.api.opportunities_v1.opportunity_schemas import OpportunityWithAttachmentsV1Schema
from src.constants.lookup_constants import (
    ApplicantType,
    CompetitionOpenToApplicant,
    FundingCategory,
    FundingInstrument,
    OpportunityCategory,
    OpportunityStatus,
)
from src.db.models.competition_models import Competition
from src.db.models.lookup.lookup_registry import LookupRegistry
from src.db.models.opportunity_models import Opportunity, OpportunitySummary
from src.task.task_blueprint import task_blueprint
from src.util.env_config import PydanticBaseEnvConfig
from src.util.local import error_if_not_local

logger = logging.getLogger(__name__)


ENV_URL_MAP = {
    "local": "http://localhost:8080/v1/opportunities/{}",
    "dev": "https://api.dev.simpler.grants.gov/v1/opportunities/{}",
    "staging": "https://api.staging.simpler.grants.gov/v1/opportunities/{}",
    "prod": "https://api.simpler.grants.gov/v1/opportunities/{}",
}


class GenerateOpportunitySqlTaskConfig(PydanticBaseEnvConfig):
    non_local_api_auth_token: str | None = None


@dataclasses.dataclass
class OppSqlRequest:
    opportunity_id: str
    environment: str
    forms: list[str] = dataclasses.field(default_factory=list)
    # This is just so we can avoid printing in tests
    print_output: bool = True


class OppDataContainer:
    def __init__(self) -> None:
        self.opportunity_id = str(uuid.uuid4())
        self.opportunity_summary_id = str(uuid.uuid4())
        # Note that this legacy ID could technically be non-unique, these values
        # are all above the actual ones in our environments, but there's no check here
        # to verify that.
        self.legacy_opportunity_id = random.randint(1_000_000, 10_000_000)

        # This gets appended in a few places to make the value distinct like the opportunity title
        self.copy_id = "-" + "".join(secrets.choice(string.ascii_letters) for _ in range(8))


class GenerateOpportunitySqlProcessor:

    def __init__(self, opp_sql_request: OppSqlRequest) -> None:
        self.config = GenerateOpportunitySqlTaskConfig()
        self.request = opp_sql_request
        self.opp_data_container = OppDataContainer()

        self.sql_statements: list[str] = []
        # We keep the assistance listing records as the competition
        # needs to reference the ID we generated
        self.assistance_listing_records: list[dict] = []

    def run(self) -> None:
        opportunity_json = self.fetch_opportunity()
        # Opportunity
        self.build_opportunity_sql(opportunity_json)
        # Opportunity Summary - including funding instruments, funding categories, and applicant types
        self.build_opportunity_summary_sql(opportunity_json)
        # Current Opportunity Summary
        self.build_current_opportunity_summary_sql(opportunity_json)
        # Opportunity Assistance Listing
        self.build_opportunity_assistance_listing_sql(opportunity_json)
        # Competition + Competition Forms + Competition Open to Applicant
        self.build_competition_sql(opportunity_json)

        # Opportunity Attachments and Competition Instructions
        # are not yet handled as they would also require moving
        # files around on s3, and we can follow-up on that if desired.

        if self.request.print_output:
            print("####### SQL STATEMENTS\n")
            for sql_statement in self.sql_statements:
                print(sql_statement)
            print("\n\n####### END SQL STATEMENTS\n")

    def build_opportunity_sql(self, opp_data: dict) -> None:
        # We don't meaningfully use any of these columns, so don't bother adding to the SQL
        columns = get_columns(
            Opportunity,
            ["revision_number", "modified_comments", "publisher_user_id", "publisher_profile_id"],
        )

        # Copy data
        data_to_insert = {c: opp_data.get(c) for c in columns}

        ### Override / Update Data we don't want to copy exactly
        data_to_insert["opportunity_id"] = self.opp_data_container.opportunity_id
        data_to_insert["legacy_opportunity_id"] = self.opp_data_container.legacy_opportunity_id
        # Make the opportunity number different so they're unique
        opp_number = (
            cast(str, data_to_insert.get("opportunity_number", ""))
            + self.opp_data_container.copy_id
        )
        data_to_insert["opportunity_number"] = opp_number
        # API doesn't return this, but all API values would be non-drafts
        data_to_insert["is_draft"] = False
        data_to_insert["opportunity_category_id"] = map_lookup_value(opp_data.get("category"))

        self.add_section_to_sql("Opportunity")
        self.sql_statements.append(build_sql("opportunity", data_to_insert))

    def build_current_opportunity_summary_sql(self, opp_data: dict) -> None:
        # skip fetching columns since there are only 3 we need to custom populate anyways
        opportunity_summary = opp_data.get("summary")
        opportunity_status = opp_data.get("opportunity_status")
        if opportunity_summary is None or opportunity_status is None:
            logger.info("No current opportunity summary - skipping SQL")
            return

        data_to_insert = {
            "opportunity_id": self.opp_data_container.opportunity_id,
            "opportunity_summary_id": self.opp_data_container.opportunity_summary_id,
            "opportunity_status_id": map_lookup_value(opp_data.get("opportunity_status")),
        }

        self.add_section_to_sql("Current Opportunity Summary")
        self.sql_statements.append(build_sql("current_opportunity_summary", data_to_insert))

    def build_opportunity_summary_sql(self, opp_data: dict) -> None:
        columns = get_columns(
            OpportunitySummary,
            [
                "unarchive_date",
                "modification_comments",
                "agency_phone_number",
                "can_send_mail",
                "publisher_profile_id",
                "publisher_user_id",
                "updated_by",
                "created_by",
                "agency_code",
                "agency_name",
            ],
        )

        opportunity_summary = opp_data.get("summary")
        if opportunity_summary is None:
            logger.info("No opportunity summary found for opportunity")
            return

        # Copy data
        data_to_insert = {c: opportunity_summary.get(c) for c in columns}

        ### Override / Update Data we don't want to copy exactly
        data_to_insert["opportunity_summary_id"] = self.opp_data_container.opportunity_summary_id
        data_to_insert["opportunity_id"] = self.opp_data_container.opportunity_id
        data_to_insert["legacy_opportunity_id"] = self.opp_data_container.legacy_opportunity_id
        data_to_insert["agency_contact_description"] = "Bob Smith"
        data_to_insert["agency_email_address"] = "fake_mail@fake.com"
        data_to_insert["agency_email_address_description"] = "fake contact info"

        self.add_section_to_sql("Opportunity Summary")
        self.sql_statements.append(build_sql("opportunity_summary", data_to_insert))

        # Funding Instruments
        funding_instruments = opportunity_summary.get("funding_instruments")
        if funding_instruments:
            self.add_section_to_sql("Funding Instruments")
            for funding_instrument in funding_instruments:
                funding_instrument_data = {
                    "opportunity_summary_id": self.opp_data_container.opportunity_summary_id,
                    "funding_instrument_id": map_lookup_value(funding_instrument),
                }
                self.sql_statements.append(
                    build_sql(
                        "link_opportunity_summary_funding_instrument", funding_instrument_data
                    )
                )

        # Funding Categories
        funding_categories = opportunity_summary.get("funding_categories")
        if funding_categories:
            self.add_section_to_sql("Funding Categories")
            for funding_category in funding_categories:
                funding_category_data = {
                    "opportunity_summary_id": self.opp_data_container.opportunity_summary_id,
                    "funding_category_id": map_lookup_value(funding_category),
                }
                self.sql_statements.append(
                    build_sql("link_opportunity_summary_funding_category", funding_category_data)
                )

        # Applicant Types
        applicant_types = opportunity_summary.get("applicant_types")
        if applicant_types:
            self.add_section_to_sql("Applicant Types")
            for applicant_type in applicant_types:
                applicant_type_data = {
                    "opportunity_summary_id": self.opp_data_container.opportunity_summary_id,
                    "applicant_type_id": map_lookup_value(applicant_type),
                }
                self.sql_statements.append(
                    build_sql("link_opportunity_summary_applicant_type", applicant_type_data)
                )

    def build_opportunity_assistance_listing_sql(self, opp_data: dict) -> None:
        assistance_listings = opp_data.get("opportunity_assistance_listings", [])

        self.add_section_to_sql("Opportunity Assistance Listings")
        for assistance_listing in assistance_listings:
            data_to_insert = {
                "opportunity_assistance_listing_id": uuid.uuid4(),
                # Legacy ID isn't nullable (probably should be),
                # make something up that is more than the highest value
                # which is ~431k at the time of writing in prod.
                "legacy_opportunity_assistance_listing_id": random.randint(1_000_000, 100_000_000),
                "opportunity_id": self.opp_data_container.opportunity_id,
                "assistance_listing_number": assistance_listing.get("assistance_listing_number"),
                "program_title": assistance_listing.get("program_title"),
            }
            self.assistance_listing_records.append(data_to_insert)
            self.sql_statements.append(build_sql("opportunity_assistance_listing", data_to_insert))

    def build_competition_sql(self, opp_data: dict) -> None:
        # A lot of values in the competition table aren't
        # used by our system, so skip setting them
        columns = get_columns(
            Competition,
            [
                "legacy_competition_id",
                "legacy_package_id",
                "form_family_id",
                "is_electronic_required",
                "expected_application_count",
                "expected_application_size_mb",
                "is_multi_package",
                "agency_download_url",
                "is_legacy_workspace_compatible",
                "can_send_mail",
                "grace_period",
            ],
        )

        competitions = opp_data.get("competitions")
        if competitions is None or len(competitions) == 0:
            logger.info("No competitions found for opportunity")
            return

        self.add_section_to_sql("Competitions")
        for competition in competitions:
            competition_id = str(uuid.uuid4())
            # Copy data
            data_to_insert = {c: competition.get(c) for c in columns}

            ### Override / Update Data we don't want to copy exactly
            data_to_insert["competition_id"] = competition_id
            data_to_insert["opportunity_id"] = self.opp_data_container.opportunity_id
            data_to_insert["is_simpler_grants_enabled"] = False
            # This isn't returned, but putting in SQL to be easily found
            data_to_insert["grace_period"] = 0
            data_to_insert["contact_info"] = "Bob Smith"

            # Figure out the assistance listing ID by iterating over
            # what we inserted and finding the matching assistance listing number
            # May not 100% be accurate, but this is only used for display
            data_to_insert["opportunity_assistance_listing_id"] = None
            competition_assistance_listing = competition.get("opportunity_assistance_listing")
            if competition_assistance_listing:
                assistance_listing_number = competition_assistance_listing.get(
                    "assistance_listing_number"
                )
                for assistance_listing in self.assistance_listing_records:
                    if (
                        assistance_listing.get("assistance_listing_number")
                        == assistance_listing_number
                    ):
                        data_to_insert["opportunity_assistance_listing_id"] = (
                            assistance_listing.get("opportunity_assistance_listing_id")
                        )
                        break

                if data_to_insert["opportunity_assistance_listing_id"] is None:
                    logger.error(
                        "Assistance listing was set on competition, but we could not figure out the right value"
                    )

            self.add_section_to_sql(f"Competition {competition_id}")
            self.sql_statements.append(build_sql("competition", data_to_insert))

            ### Competition Forms
            competition_forms = competition.get("competition_forms", [])

            form_ids = set()
            for competition_form in competition_forms:
                form = competition_form.get("form", {})
                competition_form_data = {
                    "competition_form_id": str(uuid.uuid4()),
                    "competition_id": competition_id,
                    "form_id": form.get("form_id"),
                    "is_required": competition_form.get("is_required"),
                }

                form_ids.add(str(form.get("form_id")))
                self.add_section_to_sql(f"Competition Form: {form.get('short_form_name')}")
                self.sql_statements.append(build_sql("competition_form", competition_form_data))

            for form in self.request.forms:
                if form not in form_ids:
                    competition_form_data = {
                        "competition_form_id": str(uuid.uuid4()),
                        "competition_id": competition_id,
                        "form_id": form,
                        "is_required": False,
                    }
                    self.add_section_to_sql(
                        f"Competition Form - Manually Added ID {form} - NOTE - defaulted to non-required"
                    )
                    self.sql_statements.append(build_sql("competition_form", competition_form_data))

            ### Competition Open To Applicants
            self.add_section_to_sql("Competition Open To Applicant")
            open_to_applicants = competition.get("open_to_applicants", [])
            for open_to_applicant in open_to_applicants:
                open_to_app_data = {
                    "competition_id": competition_id,
                    "competition_open_to_applicant_id": map_lookup_value(open_to_applicant),
                }

                self.sql_statements.append(
                    build_sql("link_competition_open_to_applicant", open_to_app_data)
                )

    def get_url(self) -> str:
        base_url = ENV_URL_MAP[self.request.environment]
        return base_url.format(self.request.opportunity_id)

    def build_headers(self) -> dict:
        return {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-Auth": self.config.non_local_api_auth_token,
        }

    def fetch_opportunity(self) -> dict:
        url = self.get_url()
        headers = self.build_headers()
        resp = requests.get(url, headers=headers, timeout=5)

        if resp.status_code == 404:
            raise Exception(
                f"No opportunity found in environment {self.request.environment} with opportunity ID {self.request.opportunity_id}"
            )
        if resp.status_code != 200:
            raise Exception(
                f"Error fetching opportunity from {self.request.environment}: {resp.text}"
            )

        # Load via the schema so lookup values and other types get
        # converted to their proper type which makes the logic simpler
        schema = OpportunityWithAttachmentsV1Schema()
        return schema.load(resp.json().get("data"))

    def add_section_to_sql(self, msg: str) -> None:
        # Add a header comment to the SQL for easier reading
        self.sql_statements.append("")
        self.sql_statements.append(f"-- {msg}")


def build_sql(table_name: str, field_mappings: dict[str, Any]) -> str:
    """Build an INSERT INTO statement for writing a row to the database.

    NOTE: We don't use SQLAlchemy to generate this for us as it smartly
          doesn't write the SQL in this way to avoid SQL injection and
          other issues instead using params. That's harder to read and
          we're assuming that risk with this utility a bit.
    """
    columns = []
    values = []
    for column, value in field_mappings.items():
        columns.append(column)
        values.append(convert_value_to_sql_representation(value))

    column_str = ", ".join(columns)
    value_str = ", ".join(values)

    return f"INSERT INTO api.{table_name}({column_str}) VALUES ({value_str});"  # nosec


###############
# Utilities
###############

T = TypeVar("T")


def str_format(value: str) -> str:
    """Format a string as it needs to be in a SQL insert with quotes"""
    # All single quotes already in the string need to be changed to two
    # single quotes to be escaped properly.
    v = value.replace("'", "''")
    return f"'{v}'"


SQL_FORMATTERS: dict[type[Any], Callable[[Any], str]] = {
    # Each of these dictates how to format an incoming
    # type into a proper format when put into a SQL insert statement
    str: str_format,
    int: lambda i: str(i),
    bool: lambda b: str(b).lower(),  # true/false instead of True/False
    datetime: lambda d: str_format(d.isoformat()),
    date: lambda d: str_format(d.isoformat()),
    uuid.UUID: lambda u: str_format(str(u)),
}


def convert_value_to_sql_representation(value: Any) -> str:
    """Convert a field into the Postgres representation in an insert query"""
    if value is None:
        return "null"

    value_type = type(value)
    if value_type not in SQL_FORMATTERS:
        raise Exception(f"Unsupported type in SQL converter: {value_type}")

    return SQL_FORMATTERS[value_type](value)


def get_columns(table: Any, columns_to_skips: list[str]) -> list[str]:
    """Get the columns from a SQLAlchemy table, skipping all those passed in"""
    columns = []

    # Always skip created_at/updated_at, let those get generated
    skip_columns = {"created_at", "updated_at"}
    skip_columns.update(columns_to_skips)

    for c in inspect(table).columns:
        if c.name in skip_columns:
            continue

        columns.append(c.name)

    return columns


LOOKUP_VALUE_TABLE_MAP = {
    OpportunityCategory: lookup_models.LkOpportunityCategory,
    OpportunityStatus: lookup_models.LkOpportunityStatus,
    FundingInstrument: lookup_models.LkFundingInstrument,
    FundingCategory: lookup_models.LkFundingCategory,
    ApplicantType: lookup_models.LkApplicantType,
    CompetitionOpenToApplicant: lookup_models.LkCompetitionOpenToApplicant,
}


def map_lookup_value(value: StrEnum | None) -> int | None:
    """Map a lookup value to its DB integer representation"""
    if value is None:
        return None

    # Fetch the lookup table that corresponds with an enum
    # Note we don't have this logic built into the LookupRegistry
    # as multiple enums COULD be on one table, or multiple tables
    # use the same enum. In this particular case, we know they're 1:1
    lookup_table = LOOKUP_VALUE_TABLE_MAP.get(type(value))
    if lookup_table is None:
        raise Exception(
            f"Unconfigured lookup enum - cannot map string back to int needed for creating insert: {type(value)}"
        )

    return LookupRegistry.get_lookup_int_for_enum(lookup_table, value)


@task_blueprint.cli.command("generate-opportunity-sql", help="Utility to generate SQL")
@click.option(
    "--environment", required=True, type=click.Choice(["local", "dev", "staging", "prod"])
)
@click.option("--opportunity-id", required=True, type=str)
@click.option(
    "--forms",
    default=[],
    multiple=True,
    help="List of forms to add, will be added as non-required. If form already exists, does nothing.",
)
def generate_opportunity_sql(environment: str, opportunity_id: str, forms: list[str]) -> None:
    # This script is only meant for running locally at this time
    error_if_not_local()

    GenerateOpportunitySqlProcessor(
        OppSqlRequest(environment=environment, opportunity_id=opportunity_id, forms=forms)
    ).run()

    logger.info("Completed SQL generation")
