import csv

import pytest

import src.util.file_util as file_util
from src.db.models.lookup_models import LkOpportunityCategory, LkOpportunityStatus
from src.db.models.user_models import User
from src.task.analytics.create_analytics_db_csvs import (
    TABLES_TO_EXTRACT,
    CreateAnalyticsDbCsvsConfig,
    CreateAnalyticsDbCsvsTask,
)
from tests.conftest import BaseTestClass
from tests.src.db.models.factories import (
    OpportunityFactory,
    UserFactory,
    UserSavedOpportunityFactory,
    UserSavedSearchFactory,
)


def validate_file(
    file_path: str, expected_record_count: int, expected_columns: list[str] = None
) -> dict:
    with file_util.open_stream(file_path) as csvfile:
        reader = csv.DictReader(csvfile)
        records = [record for record in reader]

        assert len(records) == expected_record_count

        # Validate columns if expected_columns is provided
        if expected_columns:
            actual_columns = list(reader.fieldnames)
            assert (
                actual_columns == expected_columns
            ), f"Expected columns {expected_columns}, but got {actual_columns}"

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

    @pytest.fixture
    def task(self, db_session, mock_s3_bucket, test_api_schema):
        config = CreateAnalyticsDbCsvsConfig(
            API_ANALYTICS_DB_EXTRACTS_PATH=f"s3://{mock_s3_bucket}/table-extracts",
            API_ANALYTICS_DB_SCHEMA=test_api_schema,
        )
        return CreateAnalyticsDbCsvsTask(db_session, config=config)

    def test_create_analytics_db_csvs(self, db_session, task, opportunities):
        task.run()

        # Validate the opportunity file
        csv_opps = validate_file(
            task.config.file_path + "/opportunity.csv",
            len(opportunities),
            TABLES_TO_EXTRACT["opportunity"],
        )
        opportunity_ids = set([str(o.opportunity_id) for o in opportunities])
        csv_opportunity_ids = set([record["opportunity_id"] for record in csv_opps])
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
            TABLES_TO_EXTRACT["current_opportunity_summary"],
        )
        current_summary_ids = set(
            [
                (str(o.opportunity_id), str(o.opportunity_summary_id))
                for o in current_opportunity_summaries
            ]
        )
        csv_current_summary_ids = set(
            [
                (record["opportunity_id"], record["opportunity_summary_id"])
                for record in csv_current_summaries
            ]
        )
        assert current_summary_ids == csv_current_summary_ids

        # Validate the opportunity summary file
        opportunity_summaries = [o.opportunity_summary for o in current_opportunity_summaries]
        csv_summaries = validate_file(
            task.config.file_path + "/opportunity_summary.csv",
            len(opportunity_summaries),
            TABLES_TO_EXTRACT["opportunity_summary"],
        )
        opportunity_summary_ids = set(
            [str(o.opportunity_summary_id) for o in opportunity_summaries]
        )
        csv_opportunity_summary_ids = set(
            [record["opportunity_summary_id"] for record in csv_summaries]
        )
        assert opportunity_summary_ids == csv_opportunity_summary_ids

    def test_user_saved_opportunities(self, db_session, task, opportunities):
        user_saved_opps = []
        user_saved_opps.extend(
            UserSavedOpportunityFactory.create_batch(size=5, opportunity=opportunities[0])
        )

        for oso in user_saved_opps[:3]:
            user_id = oso.user_id
            user_saved_opps.append(
                UserSavedOpportunityFactory.create(user_id=user_id, opportunity=opportunities[2])
            )
        task.run()
        csv_saved_opps = validate_file(
            task.config.file_path + "/user_saved_opportunity.csv",
            len(user_saved_opps),
            TABLES_TO_EXTRACT["user_saved_opportunity"],
        )
        saved_opps_ids = set([(str(o.opportunity_id), str(o.user_id)) for o in user_saved_opps])
        csv_saved_opps_ids = set(
            [(record["opportunity_id"], record["user_id"]) for record in csv_saved_opps]
        )
        assert saved_opps_ids == csv_saved_opps_ids

    def test_user_saved_searches(self, db_session, task, opportunities):
        user_saved_searches = []
        user_saved_searches.extend(
            UserSavedSearchFactory.create_batch(
                size=2,
                search_query={"keywords": "test"},
                searched_opportunity_ids=[o.opportunity_id for o in opportunities[:5]],
            )
        )
        user_saved_searches.extend(
            UserSavedSearchFactory.create_batch(
                size=2,
                search_query={"keywords": "code"},
                searched_opportunity_ids=[o.opportunity_id for o in opportunities[5:]],
            )
        )

        task.run()

        csv_saved_searches = validate_file(
            task.config.file_path + "/user_saved_search.csv",
            len(user_saved_searches),
            TABLES_TO_EXTRACT["user_saved_search"],
        )
        saved_search_ids = {
            (",".join(map(str, sorted(o.searched_opportunity_ids))), str(o.user_id))
            for o in user_saved_searches
        }

        csv_saved_search_ids = {
            (
                ",".join(
                    map(
                        str,
                        sorted(record["searched_opportunity_ids"].strip("{}").split(",")),
                    )
                ),
                record["user_id"],
            )
            for record in csv_saved_searches
        }
        assert saved_search_ids == csv_saved_search_ids

    def test_users(self, db_session, task, enable_factory_create):
        users = []
        current_users = db_session.query(User)
        users.extend(current_users)
        users.extend(UserFactory.create_batch(size=5))

        task.run()

        csv_users = validate_file(
            task.config.file_path + "/user.csv", len(users), TABLES_TO_EXTRACT["user"]
        )
        user_ids = set([str(u.user_id) for u in users])
        csv_user_ids = set([record["user_id"] for record in csv_users])
        assert user_ids == csv_user_ids

    def test_lookup_tables_columns(self, db_session, task, enable_factory_create):
        task.run()

        # We just use the existing record count since lookup table values are managed elsewhere
        count_lk_opportunity_category = db_session.query(LkOpportunityCategory).count()
        count_lk_opportunity_status = db_session.query(LkOpportunityStatus).count()

        validate_file(
            task.config.file_path + "/lk_opportunity_category.csv",
            count_lk_opportunity_category,
            TABLES_TO_EXTRACT["lk_opportunity_category"],
        )

        validate_file(
            task.config.file_path + "/lk_opportunity_status.csv",
            count_lk_opportunity_status,
            TABLES_TO_EXTRACT["lk_opportunity_status"],
        )
