import logging
import time
from enum import StrEnum

import click
import sqlalchemy
from pydantic import Field

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
from src.db.models import metadata as api_metadata
from src.task.ecs_background_task import ecs_background_task
from src.task.task import Task
from src.task.task_blueprint import task_blueprint
from src.util import file_util
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)

TABLES_TO_EXTRACT = {
    "opportunity": [
        "opportunity_id",
        "legacy_opportunity_id",
        "opportunity_number",
        "opportunity_title",
        "agency_code",
        "opportunity_category_id",
        "category_explanation",
        "is_draft",
        "revision_number",
        "modified_comments",
        "publisher_user_id",
        "publisher_profile_id",
        "created_at",
        "updated_at",
    ],
    "opportunity_summary": [
        "opportunity_summary_id",
        "opportunity_id",
        "legacy_opportunity_id",
        "summary_description",
        "is_cost_sharing",
        "is_forecast",
        "post_date",
        "close_date",
        "close_date_description",
        "archive_date",
        "unarchive_date",
        "expected_number_of_awards",
        "estimated_total_program_funding",
        "award_floor",
        "award_ceiling",
        "additional_info_url",
        "additional_info_url_description",
        "forecasted_post_date",
        "forecasted_close_date",
        "forecasted_close_date_description",
        "forecasted_award_date",
        "forecasted_project_start_date",
        "fiscal_year",
        "modification_comments",
        "funding_category_description",
        "applicant_eligibility_description",
        "agency_phone_number",
        "agency_contact_description",
        "agency_email_address",
        "agency_email_address_description",
        "version_number",
        "can_send_mail",
        "publisher_profile_id",
        "publisher_user_id",
        "updated_by",
        "created_by",
        "agency_code",
        "agency_name",
        "created_at",
        "updated_at",
    ],
    "current_opportunity_summary": [
        "opportunity_id",
        "opportunity_summary_id",
        "opportunity_status_id",
        "created_at",
        "updated_at",
    ],
    "lk_opportunity_category": [
        "opportunity_category_id",
        "description",
        "created_at",
        "updated_at",
    ],
    "lk_opportunity_status": ["opportunity_status_id", "description", "created_at", "updated_at"],
    "user_saved_search": [
        "saved_search_id",
        "user_id",
        "search_query",
        "name",
        "last_notified_at",
        "searched_opportunity_ids",
        "is_deleted",
        "created_at",
        "updated_at",
    ],
    "user_saved_opportunity": [
        "user_id",
        "opportunity_id",
        "last_notified_at",
        "is_deleted",
        "created_at",
        "updated_at",
    ],
    "user": ["user_id", "created_at", "updated_at"],
}


@task_blueprint.cli.command(
    "create-analytics-db-csvs",
    help="Create extract CSVs of our database tables that analytics can use",
)
@click.option("--tables-to-extract", "-t", help="Tables to extract to a CSV file", multiple=True)
@click.option("--scheduled-job-name", default=None, help="Name of the scheduled job)
@flask_db.with_db_session()
@ecs_background_task(task_name="create-analytics-db-csvs")
def create_analytics_db_csvs(db_session: db.Session, tables_to_extract: list[str], scheduled_job_name: str | None) -> None:
    logger.info("Create extract CSV file start")

    CreateAnalyticsDbCsvsTask(db_session, tables_to_extract).run()

    logger.info("Create extract CSV file complete")


class CreateAnalyticsDbCsvsConfig(PydanticBaseEnvConfig):
    # API_ANALYTICS_DB_EXTRACTS_PATH
    file_path: str = Field(alias="API_ANALYTICS_DB_EXTRACTS_PATH")

    # Override the schema for where the tables exist, only needed
    # for testing right now
    db_schema: str | None = Field(None, alias="API_ANALYTICS_DB_SCHEMA")


class CreateAnalyticsDbCsvsTask(Task):

    class Metrics(StrEnum):
        TABLE_COUNT = "table_count"
        ROW_COUNT = "row_count"

    def __init__(
        self,
        db_session: db.Session,
        tables_to_extract: list[str] | None = None,
        config: CreateAnalyticsDbCsvsConfig | None = None,
    ) -> None:
        super().__init__(db_session)

        if tables_to_extract is None or len(tables_to_extract) == 0:
            tables_to_extract = list(TABLES_TO_EXTRACT.keys())

        # We only want to process tables that were configured
        self.tables: list[sqlalchemy.Table] = [
            t for t in api_metadata.tables.values() if t.name in tables_to_extract
        ]

        if config is None:
            config = CreateAnalyticsDbCsvsConfig()
        self.config = config

    def run_task(self) -> None:
        for table in self.tables:
            self.generate_csv(table)

    def generate_csv(self, table: sqlalchemy.Table) -> None:
        """Generate the CSV file of a given table"""
        output_path = file_util.join(self.config.file_path, f"{table.name}.csv")
        log_extra = {
            "table_name": table.name,
            "output_path": output_path,
        }
        logger.info("Generating CSV extract for table", extra=log_extra)

        start_time = time.monotonic()

        cursor = self.db_session.connection().connection.cursor()
        schema = table.schema if self.config.db_schema is None else self.config.db_schema

        # Get column configuration for this table
        columns = TABLES_TO_EXTRACT.get(table.name, ["*"])
        columns_str = ", ".join(columns)

        # Build the appropriate COPY query based on column configuration
        copy_query = f"COPY (SELECT {columns_str} FROM {schema}.{table.name}) TO STDOUT with (DELIMITER ',', FORMAT CSV, HEADER TRUE, FORCE_QUOTE *, encoding 'utf-8')"  # nosec B608

        with cursor.copy(copy_query) as cursor_copy:
            with file_util.open_stream(output_path, "wb") as outfile:
                for data in cursor_copy:
                    outfile.write(data)

            row_count = cursor.rowcount

        duration = round(time.monotonic() - start_time, 3)
        self.increment(self.Metrics.TABLE_COUNT)
        self.set_metrics({f"{table.name}.time": duration})
        self.increment(self.Metrics.ROW_COUNT, row_count, prefix=table.name)

        logger.info(
            "Generated CSV extract for table",
            extra=log_extra | {"table_extract_duration_sec": duration, "row_count": row_count},
        )
