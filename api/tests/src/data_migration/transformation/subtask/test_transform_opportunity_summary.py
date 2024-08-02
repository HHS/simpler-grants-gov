import pytest

import src.data_migration.transformation.transform_constants as transform_constants
import tests.src.db.models.factories as f
from src.data_migration.transformation.subtask.transform_opportunity_summary import (
    TransformOpportunitySummary,
)
from tests.src.data_migration.transformation.conftest import (
    BaseTransformTestClass,
    setup_synopsis_forecast,
    validate_opportunity_summary,
)


class TestTransformOpportunitySummary(BaseTransformTestClass):
    @pytest.fixture()
    def transform_opportunity_summary(self, transform_oracle_data_task):
        return TransformOpportunitySummary(transform_oracle_data_task)

    def test_process_opportunity_summaries(self, db_session, transform_opportunity_summary):
        # Basic inserts
        opportunity1 = f.OpportunityFactory.create(
            no_current_summary=True, opportunity_assistance_listings=[]
        )
        forecast_insert1 = setup_synopsis_forecast(
            is_forecast=True, revision_number=None, create_existing=False, opportunity=opportunity1
        )
        synopsis_insert1 = setup_synopsis_forecast(
            is_forecast=False, revision_number=None, create_existing=False, opportunity=opportunity1
        )
        forecast_hist_insert1 = setup_synopsis_forecast(
            is_forecast=True, revision_number=1, create_existing=False, opportunity=opportunity1
        )
        synopsis_hist_insert1 = setup_synopsis_forecast(
            is_forecast=False, revision_number=1, create_existing=False, opportunity=opportunity1
        )

        # Mix of updates and inserts, somewhat resembling what happens when summary objects
        # get moved to the historical table (we'd update the synopsis/forecast records, and create new historical)
        opportunity2 = f.OpportunityFactory.create(
            no_current_summary=True, opportunity_assistance_listings=[]
        )
        forecast_update1 = setup_synopsis_forecast(
            is_forecast=True, revision_number=None, create_existing=True, opportunity=opportunity2
        )
        synopsis_update1 = setup_synopsis_forecast(
            is_forecast=False, revision_number=None, create_existing=True, opportunity=opportunity2
        )
        forecast_hist_update1 = setup_synopsis_forecast(
            is_forecast=True, revision_number=1, create_existing=True, opportunity=opportunity2
        )
        synopsis_hist_update1 = setup_synopsis_forecast(
            is_forecast=False, revision_number=1, create_existing=True, opportunity=opportunity2
        )
        forecast_hist_insert2 = setup_synopsis_forecast(
            is_forecast=True, revision_number=2, create_existing=False, opportunity=opportunity2
        )
        synopsis_hist_insert2 = setup_synopsis_forecast(
            is_forecast=False, revision_number=2, create_existing=False, opportunity=opportunity2
        )

        # Mix of inserts, updates, and deletes
        opportunity3 = f.OpportunityFactory.create(
            no_current_summary=True, opportunity_assistance_listings=[]
        )
        forecast_delete1 = setup_synopsis_forecast(
            is_forecast=True,
            revision_number=None,
            create_existing=True,
            is_delete=True,
            opportunity=opportunity3,
        )
        synopsis_delete1 = setup_synopsis_forecast(
            is_forecast=False,
            revision_number=None,
            create_existing=True,
            is_delete=True,
            opportunity=opportunity3,
        )
        forecast_hist_insert3 = setup_synopsis_forecast(
            is_forecast=True, revision_number=2, create_existing=False, opportunity=opportunity3
        )
        synopsis_hist_update2 = setup_synopsis_forecast(
            is_forecast=False,
            revision_number=1,
            create_existing=True,
            source_values={"action_type": "D"},
            opportunity=opportunity3,
        )

        # A few error scenarios
        opportunity4 = f.OpportunityFactory.create(
            no_current_summary=True, opportunity_assistance_listings=[]
        )
        forecast_delete_but_current_missing = setup_synopsis_forecast(
            is_forecast=True,
            revision_number=None,
            create_existing=False,
            is_delete=True,
            opportunity=opportunity4,
        )
        synopsis_update_invalid_yn_field = setup_synopsis_forecast(
            is_forecast=False,
            revision_number=None,
            create_existing=True,
            source_values={"sendmail": "E"},
            opportunity=opportunity4,
        )
        synopsis_hist_insert_invalid_yn_field = setup_synopsis_forecast(
            is_forecast=False,
            revision_number=1,
            create_existing=False,
            source_values={"cost_sharing": "1"},
            opportunity=opportunity4,
        )
        forecast_hist_update_invalid_action_type = setup_synopsis_forecast(
            is_forecast=True,
            revision_number=2,
            create_existing=True,
            source_values={"action_type": "X"},
            opportunity=opportunity4,
        )

        transform_opportunity_summary.run_subtask()

        validate_opportunity_summary(db_session, forecast_insert1)
        validate_opportunity_summary(db_session, synopsis_insert1)
        validate_opportunity_summary(db_session, forecast_hist_insert1)
        validate_opportunity_summary(db_session, synopsis_hist_insert1)
        validate_opportunity_summary(db_session, forecast_hist_insert2)
        validate_opportunity_summary(db_session, synopsis_hist_insert2)
        validate_opportunity_summary(db_session, forecast_hist_insert3)

        validate_opportunity_summary(db_session, forecast_update1)
        validate_opportunity_summary(db_session, synopsis_update1)
        validate_opportunity_summary(db_session, forecast_hist_update1)
        validate_opportunity_summary(db_session, synopsis_hist_update1)
        validate_opportunity_summary(db_session, synopsis_hist_update2)

        validate_opportunity_summary(db_session, forecast_delete1, expect_in_db=False)
        validate_opportunity_summary(db_session, synopsis_delete1, expect_in_db=False)

        validate_opportunity_summary(
            db_session, forecast_delete_but_current_missing, expect_in_db=False
        )
        validate_opportunity_summary(
            db_session,
            synopsis_update_invalid_yn_field,
            expect_in_db=True,
            expect_values_to_match=False,
        )
        validate_opportunity_summary(
            db_session, synopsis_hist_insert_invalid_yn_field, expect_in_db=False
        )
        validate_opportunity_summary(
            db_session,
            forecast_hist_update_invalid_action_type,
            expect_in_db=True,
            expect_values_to_match=False,
        )

        metrics = transform_opportunity_summary.metrics
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_PROCESSED] == 18
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_DELETED] == 2
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_INSERTED] == 7
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_UPDATED] == 5
        assert metrics[transform_constants.Metrics.TOTAL_ERROR_COUNT] == 3
        assert metrics[transform_constants.Metrics.TOTAL_DELETE_ORPHANS_SKIPPED] == 1

        # Rerunning will only attempt to re-process the errors, so total+errors goes up by 3
        db_session.commit()  # commit to end any existing transactions as run_subtask starts a new one
        transform_opportunity_summary.run_subtask()
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_PROCESSED] == 21
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_DELETED] == 2
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_INSERTED] == 7
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_UPDATED] == 5
        assert metrics[transform_constants.Metrics.TOTAL_ERROR_COUNT] == 6
        assert metrics[transform_constants.Metrics.TOTAL_DELETE_ORPHANS_SKIPPED] == 1

    @pytest.mark.parametrize(
        "is_forecast,revision_number", [(True, None), (False, None), (True, 5), (False, 10)]
    )
    def test_process_opportunity_summary_delete_but_current_missing(
        self, db_session, transform_opportunity_summary, is_forecast, revision_number
    ):
        opportunity = f.OpportunityFactory.create(
            no_current_summary=True, opportunity_assistance_listings=[]
        )
        delete_but_current_missing = setup_synopsis_forecast(
            is_forecast=is_forecast,
            revision_number=revision_number,
            create_existing=False,
            is_delete=True,
            opportunity=opportunity,
        )

        transform_opportunity_summary.process_opportunity_summary(
            delete_but_current_missing, None, opportunity
        )

        validate_opportunity_summary(db_session, delete_but_current_missing, expect_in_db=False)
        assert delete_but_current_missing.transformed_at is not None
        assert delete_but_current_missing.transformation_notes == "orphaned_delete_record"

    @pytest.mark.parametrize(
        "is_forecast,revision_number,source_values,expected_error",
        [
            (True, None, {"sendmail": "z"}, "Unexpected Y/N bool value: z"),
            (False, None, {"cost_sharing": "v"}, "Unexpected Y/N bool value: v"),
            (True, 5, {"action_type": "T"}, "Unexpected action type value: T"),
            (False, 10, {"action_type": "5"}, "Unexpected action type value: 5"),
        ],
    )
    def test_process_opportunity_summary_invalid_value_errors(
        self,
        db_session,
        transform_opportunity_summary,
        is_forecast,
        revision_number,
        source_values,
        expected_error,
    ):
        opportunity = f.OpportunityFactory.create(
            no_current_summary=True, opportunity_assistance_listings=[]
        )
        source_summary = setup_synopsis_forecast(
            is_forecast=is_forecast,
            revision_number=revision_number,
            create_existing=False,
            opportunity=opportunity,
            source_values=source_values,
        )

        with pytest.raises(ValueError, match=expected_error):
            transform_opportunity_summary.process_opportunity_summary(
                source_summary, None, opportunity
            )

    @pytest.mark.parametrize("is_forecast", [True, False])
    def test_process_opportunity_summary_but_no_opportunity_non_hist(
        self,
        db_session,
        transform_opportunity_summary,
        is_forecast,
    ):
        source_record = setup_synopsis_forecast(
            is_forecast=is_forecast,
            revision_number=None,
            create_existing=False,
            opportunity=None,
            source_values={"opportunity_id": 12121212},
        )

        with pytest.raises(
            ValueError,
            match="Opportunity summary cannot be processed as the opportunity for it does not exist",
        ):
            transform_opportunity_summary.process_opportunity_summary(source_record, None, None)

    @pytest.mark.parametrize("is_forecast,revision_number", [(True, 10), (False, 9)])
    def test_process_opportunity_summary_but_no_opportunity_hist(
        self,
        db_session,
        transform_opportunity_summary,
        is_forecast,
        revision_number,
    ):
        source_record = setup_synopsis_forecast(
            is_forecast=is_forecast,
            revision_number=revision_number,
            create_existing=False,
            opportunity=None,
            source_values={"opportunity_id": 12121212},
        )

        transform_opportunity_summary.process_opportunity_summary(source_record, None, None)

        validate_opportunity_summary(db_session, source_record, expect_in_db=False)
        assert source_record.transformed_at is not None
        assert source_record.transformation_notes == "orphaned_historical_record"
