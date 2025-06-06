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

TABLES_TO_EXTRACT = [
    "opportunity",
    "opportunity_summary",
    "current_opportunity_summary",
    "lk_opportunity_category",
    "lk_opportunity_status",
    "user_saved_search",
    "user_saved_opportunity",
]


@task_blueprint.cli.command(
    "create-analytics-db-csvs",
    help="Create extract CSVs of our database tables that analytics can use",
)
@click.option("--tables-to-extract", "-t", help="Tables to extract to a CSV file", multiple=True)
@flask_db.with_db_session()
@ecs_background_task(task_name="create-analytics-db-csvs")
def create_analytics_db_csvs(db_session: db.Session, tables_to_extract: list[str]) -> None:
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
            tables_to_extract = TABLES_TO_EXTRACT

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

        with cursor.copy(
            f"COPY {schema}.{table.name} TO STDOUT with (DELIMITER ',', FORMAT CSV, HEADER TRUE, FORCE_QUOTE *, encoding 'utf-8')"
        ) as cursor_copy:
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
