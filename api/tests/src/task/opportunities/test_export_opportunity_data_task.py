import csv
import json

import pytest

import src.util.file_util as file_util
from src.api.opportunities_v1.opportunity_schemas import OpportunityV1Schema
from src.task.opportunities.export_opportunity_data_task import (
    ExportOpportunityDataConfig,
    ExportOpportunityDataTask,
)
from tests.conftest import BaseTestClass
from tests.src.db.models.factories import OpportunityFactory


class TestExportOpportunityDataTask(BaseTestClass):
    @pytest.fixture
    def export_opportunity_data_task(self, db_session, mock_s3_bucket):
        config = ExportOpportunityDataConfig(file_path=f"s3://{mock_s3_bucket}/")
        return ExportOpportunityDataTask(db_session, config)

    def test_export_opportunity_data_task(
        self,
        db_session,
        truncate_opportunities,
        enable_factory_create,
        export_opportunity_data_task,
    ):
        # Create 25 opportunities we will load
        opportunities = []
        opportunities.extend(OpportunityFactory.create_batch(size=6, is_posted_summary=True))
        opportunities.extend(OpportunityFactory.create_batch(size=3, is_forecasted_summary=True))
        opportunities.extend(OpportunityFactory.create_batch(size=2, is_closed_summary=True))
        opportunities.extend(
            OpportunityFactory.create_batch(size=8, is_archived_non_forecast_summary=True)
        )
        opportunities.extend(
            OpportunityFactory.create_batch(size=6, is_archived_forecast_summary=True)
        )

        # Create some opportunities that won't get fetched / exported
        OpportunityFactory.create_batch(size=3, is_draft=True)
        OpportunityFactory.create_batch(size=4, no_current_summary=True)

        export_opportunity_data_task.run()

        # Verify some metrics first
        # Make sure the opportunities we have created matches the number
        # That get exported
        assert (
            len(opportunities)
            == export_opportunity_data_task.metrics[
                export_opportunity_data_task.Metrics.RECORDS_EXPORTED
            ]
        )

        expected_opportunity_ids = set([opp.opportunity_id for opp in opportunities])
        # Verify csv file contents
        with file_util.open_stream(export_opportunity_data_task.csv_file, "r") as infile:
            reader = csv.DictReader(infile)
            assert expected_opportunity_ids == set(
                [int(record["opportunity_id"]) for record in reader]
            )

        # Verify JSON file contents
        with file_util.open_stream(export_opportunity_data_task.json_file, "r") as infile:
            # Parse JSON File
            json_opportunities = json.load(infile)

            assert expected_opportunity_ids == set(
                [int(record["opportunity_id"]) for record in json_opportunities["opportunities"]]
            )

            schema = OpportunityV1Schema(many=True)

            errors = schema.validate(json_opportunities["opportunities"])
            assert len(errors) == 0
