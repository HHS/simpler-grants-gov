import json
import logging
from enum import StrEnum
from typing import Iterator, Sequence

from smart_open import open
from sqlalchemy import select
from sqlalchemy.orm import noload, selectinload

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
from src.api.opportunities_v1.opportunity_schemas import OpportunityV1Schema
from src.db.models.opportunity_models import CurrentOpportunitySummary, Opportunity
from src.services.opportunities_v1.opportunity_to_csv import opportunities_to_csv
from src.task.task import Task
from src.task.task_blueprint import task_blueprint
from src.util.datetime_util import get_now_us_eastern_datetime

logger = logging.getLogger(__name__)


@task_blueprint.cli.command(
    "export-opportunity-data",
    help="Generate JSON and CSV files containing an export of all opportunity data",
)
@flask_db.with_db_session()
def export_opportunity_data(db_session: db.Session) -> None:
    ExportOpportunityDataTask(db_session).run()


class ExportOpportunityDataTask(Task):
    class Metrics(StrEnum):
        RECORDS_LOADED = "records_loaded"

    def __init__(
        self,
        db_session: db.Session,
    ) -> None:
        super().__init__(db_session)

        FILE_NAME: str = "opportunity_data"
        self.current_timestamp = get_now_us_eastern_datetime().strftime("%Y-%m-%d_%H-%M-%S")

        # Surely there is a better way to do paths in python?
        # I tried pathlib's Path.cwd() thinking it would resolve
        # to /api/src/task/opportunities/ but it resolved to just /api
        self.FILE_PATH = "/api/src/task/opportunities/output/"

        self.json_file = f"{FILE_NAME}-{self.current_timestamp}.json"
        self.csv_file = f"{FILE_NAME}-{self.current_timestamp}.csv"

        self.set_metrics({"csv_file": self.csv_file, "json_file": self.json_file})

    def run_task(self) -> None:
        # load records
        schema = OpportunityV1Schema()
        data_to_export: dict = {
            "metadata": {"file_generated_at": self.current_timestamp},
            "opportunities": [],
        }

        for opp_batch in self.fetch_opportunities():
            for record in opp_batch:
                self.increment(self.Metrics.RECORDS_LOADED)
                data_to_export["opportunities"].append(schema.dump(record))

        # Export the data to json
        self.export_data_to_json(data_to_export=data_to_export)

        # Export the opportunities to a csv
        self.export_opportunities_to_csv(opportunities=data_to_export["opportunities"])

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
        json_object = json.dumps(data_to_export, indent=4)
        json_file = self.FILE_PATH + self.json_file
        with open(json_file, "w") as outfile:
            outfile.write(json_object)

    def export_opportunities_to_csv(self, opportunities: Sequence[dict]) -> None:
        # create the csv file
        csv_file = self.FILE_PATH + self.csv_file
        with open(csv_file, "w") as outfile:
            opportunities_to_csv(opportunities, outfile)
