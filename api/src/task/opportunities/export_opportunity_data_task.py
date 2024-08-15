import json
import logging
import os
from enum import StrEnum
from typing import Iterator, Sequence

from pydantic_settings import SettingsConfigDict
from sqlalchemy import select
from sqlalchemy.orm import noload, selectinload

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.util.file_util as file_util
from src.api.opportunities_v1.opportunity_schemas import OpportunityV1Schema
from src.db.models.opportunity_models import CurrentOpportunitySummary, Opportunity
from src.services.opportunities_v1.opportunity_to_csv import opportunities_to_csv
from src.task.task import Task
from src.task.task_blueprint import task_blueprint
from src.util.datetime_util import get_now_us_eastern_datetime
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


@task_blueprint.cli.command(
    "export-opportunity-data",
    help="Generate JSON and CSV files containing an export of all opportunity data",
)
@flask_db.with_db_session()
def export_opportunity_data(db_session: db.Session) -> None:
    ExportOpportunityDataTask(db_session).run()


class ExportOpportunityDataConfig(PydanticBaseEnvConfig):
    model_config = SettingsConfigDict(env_prefix="EXPORT_OPP_DATA_")

    # EXPORT_OPP_DATA_FILE_PATH
    file_path: str


class ExportOpportunityDataTask(Task):
    class Metrics(StrEnum):
        RECORDS_EXPORTED = "records_exported"

    def __init__(
        self,
        db_session: db.Session,
        config: ExportOpportunityDataConfig | None = None,
    ) -> None:
        super().__init__(db_session)

        if config is None:
            config = ExportOpportunityDataConfig()
        self.config = config

        self.current_timestamp = get_now_us_eastern_datetime().strftime("%Y-%m-%d_%H-%M-%S")

        self.json_file = os.path.join(
            config.file_path, f"opportunity_data-{self.current_timestamp}.json"
        )
        self.csv_file = os.path.join(
            config.file_path, f"opportunity_data-{self.current_timestamp}.csv"
        )

        self.set_metrics({"csv_file": self.csv_file, "json_file": self.json_file})

    def run_task(self) -> None:
        # Load records
        schema = OpportunityV1Schema()

        opportunities = []
        for opp_batch in self.fetch_opportunities():
            for record in opp_batch:
                self.increment(self.Metrics.RECORDS_EXPORTED)
                opportunities.append(schema.dump(record))

        # Format data
        data_to_export: dict = {
            "metadata": {"file_generated_at": self.current_timestamp},
            "opportunities": opportunities,
        }

        # Export data
        self.export_data_to_json(data_to_export)
        self.export_opportunities_to_csv(opportunities)

    def fetch_opportunities(self) -> Iterator[Sequence[Opportunity]]:
        """
        Fetch the opportunities in batches. The iterator returned
        will give you each individual batch to be processed.

        Fetches all opportunities where:
            * is_draft = False
            * current_opportunity_summary is not None
        """
        return (
            self.db_session.execute(
                select(Opportunity)
                .join(CurrentOpportunitySummary)
                .where(
                    Opportunity.is_draft.is_(False),
                    CurrentOpportunitySummary.opportunity_status.isnot(None),
                )
                .options(selectinload("*"), noload(Opportunity.all_opportunity_summaries))
                .execution_options(yield_per=5000)
            )
            .scalars()
            .partitions()
        )

    def export_data_to_json(self, data_to_export: dict) -> None:
        # create the json file
        logger.info(
            "Creating Opportunity JSON extract", extra={"json_extract_path": self.json_file}
        )
        json_object = json.dumps(data_to_export, indent=4)
        with file_util.open_stream(self.json_file, "w") as outfile:
            outfile.write(json_object)

    def export_opportunities_to_csv(self, opportunities: Sequence[dict]) -> None:
        # create the csv file
        logger.info("Creating Opportunity CSV extract", extra={"csv_extract_path": self.csv_file})
        with file_util.open_stream(self.csv_file, "w") as outfile:
            opportunities_to_csv(opportunities, outfile)
