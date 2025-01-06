import csv

import pytest

import src.util.file_util as file_util
from src.task.analytics.create_analytics_db_csvs import (
    CreateAnalyticsDbCsvsConfig,
    CreateAnalyticsDbCsvsTask,
)
from tests.conftest import BaseTestClass
from tests.src.db.models.factories import OpportunityFactory


def validate_file(file_path: str, expected_record_count: int) -> dict:
    with file_util.open_stream(file_path) as csvfile:
        records = [record for record in csv.DictReader(csvfile)]

        assert len(records) == expected_record_count

    return records


class TestCreateAnalyticsDbCsvsTask(BaseTestClass):

    @pytest.fixture(scope="class")
    def opportunities(self, truncate_opportunities, enable_factory_create):
        # Create a variety of opportunities
        opps = []
        opps.extend(OpportunityFactory.create_batch(size=5, is_posted_summary=True))
        opps.extend(OpportunityFactory.create_batch(size=3, is_forecasted_summary=True))
        opps.extend(OpportunityFactory.create_batch(size=4, is_closed_summary=True))
        opps.extend(OpportunityFactory.create_batch(size=2, is_archived_non_forecast_summary=True))
        opps.extend(OpportunityFactory.create_batch(size=4, is_archived_forecast_summary=True))
        opps.extend(OpportunityFactory.create_batch(size=2, is_draft=True))
        opps.extend(OpportunityFactory.create_batch(size=1, no_current_summary=True))
        return opps

    @pytest.fixture()
    def task(self, db_session, mock_s3_bucket, test_api_schema):
        config = CreateAnalyticsDbCsvsConfig(
            file_path=f"s3://{mock_s3_bucket}/table-extracts", db_schema=test_api_schema
        )
        return CreateAnalyticsDbCsvsTask(db_session, config=config)

    def test_create_analytics_db_csvs(self, db_session, task, opportunities):
        task.run()

        # Validate the opportunity file
        csv_opps = validate_file(task.config.file_path + "/opportunity.csv", len(opportunities))
        opportunity_ids = set([o.opportunity_id for o in opportunities])
        csv_opportunity_ids = set([int(record["opportunity_id"]) for record in csv_opps])
        assert opportunity_ids == csv_opportunity_ids

        # Validate the current opportunity file
        current_opportunity_summaries = [
            o.current_opportunity_summary
            for o in opportunities
            if o.current_opportunity_summary is not None
        ]
        csv_current_summaries = validate_file(
            task.config.file_path + "/current_opportunity_summary.csv",
            len(current_opportunity_summaries),
        )
        current_summary_ids = set(
            [(o.opportunity_id, o.opportunity_summary_id) for o in current_opportunity_summaries]
        )
        csv_current_summary_ids = set(
            [
                (int(record["opportunity_id"]), int(record["opportunity_summary_id"]))
                for record in csv_current_summaries
            ]
        )
        assert current_summary_ids == csv_current_summary_ids

        # Validate the opportunity summary file
        opportunity_summaries = [o.opportunity_summary for o in current_opportunity_summaries]
        csv_summaries = validate_file(
            task.config.file_path + "/opportunity_summary.csv", len(opportunity_summaries)
        )
        opportunity_summary_ids = set([o.opportunity_summary_id for o in opportunity_summaries])
        csv_opportunity_summary_ids = set(
            [int(record["opportunity_summary_id"]) for record in csv_summaries]
        )
        assert opportunity_summary_ids == csv_opportunity_summary_ids
