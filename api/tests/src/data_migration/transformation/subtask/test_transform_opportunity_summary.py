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
    @pytest.fixture
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

        # Mix of updates and inserts
        opportunity2 = f.OpportunityFactory.create(
            no_current_summary=True, opportunity_assistance_listings=[]
        )
        forecast_update1 = setup_synopsis_forecast(
            is_forecast=True, revision_number=None, create_existing=True, opportunity=opportunity2
        )
        synopsis_update1 = setup_synopsis_forecast(
            is_forecast=False, revision_number=None, create_existing=True, opportunity=opportunity2
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
            is_existing_current_opportunity_summary=True,
        )
        synopsis_delete1 = setup_synopsis_forecast(
            is_forecast=False,
            revision_number=None,
            create_existing=True,
            is_delete=True,
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
            is_existing_current_opportunity_summary=True,
        )
        synopsis_update_invalid_yn_field = setup_synopsis_forecast(
            is_forecast=False,
            revision_number=None,
            create_existing=True,
            source_values={"sendmail": "E"},
            opportunity=opportunity4,
        )

        transform_opportunity_summary.run_subtask()

        validate_opportunity_summary(db_session, forecast_insert1)
        validate_opportunity_summary(db_session, synopsis_insert1)
        validate_opportunity_summary(db_session, forecast_update1)
        validate_opportunity_summary(db_session, synopsis_update1)
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

        metrics = transform_opportunity_summary.metrics
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_PROCESSED] == 8
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_DELETED] == 2
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_INSERTED] == 2
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_UPDATED] == 2
        assert metrics[transform_constants.Metrics.TOTAL_ERROR_COUNT] == 1
        assert metrics[transform_constants.Metrics.TOTAL_DELETE_ORPHANS_SKIPPED] == 1

        # Rerunning will only attempt to re-process the errors, so total+errors goes up by 1
        db_session.commit()  # commit to end any existing transactions as run_subtask starts a new one
        transform_opportunity_summary.run_subtask()
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_PROCESSED] == 9
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_DELETED] == 2
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_INSERTED] == 2
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_UPDATED] == 2
        assert metrics[transform_constants.Metrics.TOTAL_ERROR_COUNT] == 2
        assert metrics[transform_constants.Metrics.TOTAL_DELETE_ORPHANS_SKIPPED] == 1

    @pytest.mark.parametrize("is_forecast,revision_number", [(True, None), (False, None)])
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
