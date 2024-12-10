import csv
import json

import pytest
from freezegun import freeze_time

import src.util.file_util as file_util
from src.api.opportunities_v1.opportunity_schemas import OpportunityV1Schema
from src.constants.lookup_constants import ExtractType
from src.db.models.extract_models import ExtractMetadata
from src.task.opportunities.export_opportunity_data_task import (
    ExportOpportunityDataConfig,
    ExportOpportunityDataTask,
)
from tests.conftest import BaseTestClass
from tests.src.db.models.factories import OpportunityFactory


@freeze_time("2024-01-10 12:00:00")
class TestExportOpportunityDataTask(BaseTestClass):
    @pytest.fixture
    def export_opportunity_data_task(self, db_session, mock_s3_bucket):
        config = ExportOpportunityDataConfig(file_path=f"s3://{mock_s3_bucket}/")
        return ExportOpportunityDataTask(db_session, config)

    def test_export_opportunity_data_task_paths(
        self,
        db_session,
        monkeypatch: pytest.MonkeyPatch,
    ):
        config = ExportOpportunityDataConfig(file_path="/tmp")
        task = ExportOpportunityDataTask(db_session, config)

        assert task.json_file == "/tmp/opportunity_data-2024-01-10_07-00-00.json"
        assert task.csv_file == "/tmp/opportunity_data-2024-01-10_07-00-00.csv"

        monkeypatch.setenv("GENERAL_S3_BUCKET_URL", "s3://test-bucket/")
        config1 = ExportOpportunityDataConfig(file_path="/tmp")

        task1 = ExportOpportunityDataTask(db_session, config1)
        assert task1.json_file == "s3://test-bucket/tmp/opportunity_data-2024-01-10_07-00-00.json"
        assert task1.csv_file == "s3://test-bucket/tmp/opportunity_data-2024-01-10_07-00-00.csv"

    def test_export_opportunity_data_task(
        self,
        db_session,
        truncate_opportunities,
        enable_factory_create,
        export_opportunity_data_task,
    ):
        db_session.query(ExtractMetadata).delete()
        db_session.commit()

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

        # Verify ExtractMetadata entries were created
        metadata_entries = db_session.query(ExtractMetadata).all()
        assert len(metadata_entries) == 2

        # Verify JSON metadata
        json_metadata = next(
            m for m in metadata_entries if m.extract_type == ExtractType.OPPORTUNITIES_JSON
        )
        assert json_metadata.file_name.endswith(".json")
        assert json_metadata.file_name.startswith("opportunity_data-")
        assert json_metadata.file_path == export_opportunity_data_task.json_file
        assert json_metadata.file_size_bytes > 0

        # Verify CSV metadata
        csv_metadata = next(
            m for m in metadata_entries if m.extract_type == ExtractType.OPPORTUNITIES_CSV
        )
        assert csv_metadata.file_name.endswith(".csv")
        assert csv_metadata.file_name.startswith("opportunity_data-")
        assert csv_metadata.file_path == export_opportunity_data_task.csv_file
        assert csv_metadata.file_size_bytes > 0
