import pytest

import src.data_migration.transformation.transform_constants as transform_constants
import tests.src.db.models.factories as f
from src.constants.lookup_constants import FundingCategory
from src.data_migration.transformation.subtask.transform_funding_category import (
    TransformFundingCategory,
)
from tests.src.data_migration.transformation.conftest import (
    BaseTransformTestClass,
    setup_funding_category,
    validate_funding_category,
)


class TestTransformFundingCategory(BaseTransformTestClass):
    @pytest.fixture
    def transform_funding_category(self, transform_oracle_data_task):
        return TransformFundingCategory(transform_oracle_data_task)

    def test_process_funding_categories(self, db_session, transform_funding_category):
        opportunity_summary_forecast = f.OpportunitySummaryFactory.create(
            is_forecast=True, no_link_values=True
        )
        forecast_insert1 = setup_funding_category(
            create_existing=False,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="RA",
        )
        forecast_insert2 = setup_funding_category(
            create_existing=False,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="AG",
        )
        forecast_update1 = setup_funding_category(
            create_existing=True,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="AR",
            funding_category=FundingCategory.ARTS,
        )
        forecast_delete1 = setup_funding_category(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="BC",
            funding_category=FundingCategory.BUSINESS_AND_COMMERCE,
        )
        forecast_delete2 = setup_funding_category(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="CD",
            funding_category=FundingCategory.COMMUNITY_DEVELOPMENT,
        )
        forecast_update_already_processed = setup_funding_category(
            create_existing=True,
            is_already_processed=True,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="CP",
            funding_category=FundingCategory.CONSUMER_PROTECTION,
        )

        opportunity_summary_syn = f.OpportunitySummaryFactory.create(
            is_forecast=False, no_link_values=True
        )
        syn_insert1 = setup_funding_category(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="FN",
        )
        syn_insert2 = setup_funding_category(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="HL",
        )
        syn_update1 = setup_funding_category(
            create_existing=True,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="HO",
            funding_category=FundingCategory.HOUSING,
        )
        syn_delete1 = setup_funding_category(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="HU",
            funding_category=FundingCategory.HUMANITIES,
        )
        syn_delete2 = setup_funding_category(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="IIJ",
            funding_category=FundingCategory.INFRASTRUCTURE_INVESTMENT_AND_JOBS_ACT,
        )
        syn_delete_but_current_missing = setup_funding_category(
            create_existing=False,
            is_delete=True,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="IS",
        )
        syn_update_already_processed = setup_funding_category(
            create_existing=True,
            is_already_processed=True,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="ISS",
            funding_category=FundingCategory.INCOME_SECURITY_AND_SOCIAL_SERVICES,
        )

        transform_funding_category.run_subtask()

        validate_funding_category(
            db_session, forecast_insert1, expected_funding_category=FundingCategory.RECOVERY_ACT
        )
        validate_funding_category(
            db_session, forecast_insert2, expected_funding_category=FundingCategory.AGRICULTURE
        )
        validate_funding_category(
            db_session, syn_insert1, expected_funding_category=FundingCategory.FOOD_AND_NUTRITION
        )
        validate_funding_category(
            db_session, syn_insert2, expected_funding_category=FundingCategory.HEALTH
        )

        validate_funding_category(
            db_session, forecast_update1, expected_funding_category=FundingCategory.ARTS
        )
        validate_funding_category(
            db_session, syn_update1, expected_funding_category=FundingCategory.HOUSING
        )

        validate_funding_category(db_session, forecast_delete1, expect_in_db=False)
        validate_funding_category(db_session, forecast_delete2, expect_in_db=False)
        validate_funding_category(db_session, syn_delete1, expect_in_db=False)
        validate_funding_category(db_session, syn_delete2, expect_in_db=False)

        validate_funding_category(
            db_session,
            forecast_update_already_processed,
            expected_funding_category=FundingCategory.CONSUMER_PROTECTION,
            expect_values_to_match=False,
        )
        validate_funding_category(
            db_session,
            syn_update_already_processed,
            expected_funding_category=FundingCategory.INCOME_SECURITY_AND_SOCIAL_SERVICES,
            expect_values_to_match=False,
        )

        validate_funding_category(
            db_session, syn_delete_but_current_missing, expect_in_db=False, was_processed=True
        )

        metrics = transform_funding_category.metrics
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_PROCESSED] == 11
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_DELETED] == 4
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_INSERTED] == 4
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_UPDATED] == 2
        assert transform_constants.Metrics.TOTAL_ERROR_COUNT not in metrics
        assert metrics[transform_constants.Metrics.TOTAL_DELETE_ORPHANS_SKIPPED] == 1

        # Rerunning will only attempt to re-process the errors, so total+errors goes up by 1
        db_session.commit()  # commit to end any existing transactions as run_subtask starts a new one
        transform_funding_category.run_subtask()
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_PROCESSED] == 11
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_DELETED] == 4
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_INSERTED] == 4
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_UPDATED] == 2
        assert transform_constants.Metrics.TOTAL_ERROR_COUNT not in metrics
        assert metrics[transform_constants.Metrics.TOTAL_DELETE_ORPHANS_SKIPPED] == 1

    @pytest.mark.parametrize("is_forecast", [True, False])
    def test_process_funding_category_but_current_missing(
        self,
        db_session,
        transform_funding_category,
        is_forecast,
    ):
        opportunity_summary = f.OpportunitySummaryFactory.create(
            is_forecast=is_forecast, no_link_values=True
        )
        delete_but_current_missing = setup_funding_category(
            create_existing=False,
            opportunity_summary=opportunity_summary,
            legacy_lookup_value="00",
            is_delete=True,
        )

        transform_funding_category.process_link_funding_category(
            delete_but_current_missing, None, opportunity_summary
        )

        validate_funding_category(db_session, delete_but_current_missing, expect_in_db=False)
        assert delete_but_current_missing.transformed_at is not None
        assert delete_but_current_missing.transformation_notes == "orphaned_delete_record"

    def test_process_funding_categories_delete_and_inserts(
        self, db_session, transform_funding_category
    ):
        """Test that if we receive an insert and delete of the same lookup value
        in a single batch, we'll delete and then insert the record (effectively no meaningful change)
        """
        opportunity_summary_forecast = f.OpportunitySummaryFactory.create(
            is_forecast=True, no_link_values=True
        )
        forecast_insert1 = setup_funding_category(
            create_existing=False,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="BC",
        )
        forecast_delete1 = setup_funding_category(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="BC",
            funding_category=FundingCategory.BUSINESS_AND_COMMERCE,
        )

        forecast_delete2 = setup_funding_category(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="ED",
            funding_category=FundingCategory.EDUCATION,
        )
        forecast_insert2 = setup_funding_category(
            create_existing=False,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="ED",
        )

        opportunity_summary_syn = f.OpportunitySummaryFactory.create(
            is_forecast=False, no_link_values=True
        )

        syn_insert1 = setup_funding_category(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="FN",
        )
        syn_delete1 = setup_funding_category(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="FN",
            funding_category=FundingCategory.FOOD_AND_NUTRITION,
        )

        syn_insert2 = setup_funding_category(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="ISS",
        )
        syn_delete2 = setup_funding_category(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="ISS",
            funding_category=FundingCategory.INCOME_SECURITY_AND_SOCIAL_SERVICES,
        )

        syn_insert3 = setup_funding_category(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="RD",
        )
        syn_delete3 = setup_funding_category(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="RD",
            funding_category=FundingCategory.REGIONAL_DEVELOPMENT,
        )

        transform_funding_category.run_subtask()

        validate_funding_category(
            db_session,
            forecast_insert1,
            expected_funding_category=FundingCategory.BUSINESS_AND_COMMERCE,
        )
        validate_funding_category(
            db_session, forecast_insert2, expected_funding_category=FundingCategory.EDUCATION
        )

        validate_funding_category(
            db_session, syn_insert1, expected_funding_category=FundingCategory.FOOD_AND_NUTRITION
        )
        validate_funding_category(
            db_session,
            syn_insert2,
            expected_funding_category=FundingCategory.INCOME_SECURITY_AND_SOCIAL_SERVICES,
        )
        validate_funding_category(
            db_session, syn_insert3, expected_funding_category=FundingCategory.REGIONAL_DEVELOPMENT
        )

        # Despite the same lookup values being in the DB, the records were in fact deleted
        validate_funding_category(db_session, forecast_delete1, expect_in_db=False)
        validate_funding_category(db_session, forecast_delete2, expect_in_db=False)
        validate_funding_category(db_session, syn_delete1, expect_in_db=False)
        validate_funding_category(db_session, syn_delete2, expect_in_db=False)
        validate_funding_category(db_session, syn_delete3, expect_in_db=False)

        metrics = transform_funding_category.metrics
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_PROCESSED] == 10
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_DELETED] == 5
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_INSERTED] == 5

    @pytest.mark.parametrize(
        "is_forecast,legacy_lookup_value",
        [(True, "ab"), (False, "cd"), (True, "ef"), (False, "Ag")],
    )
    def test_process_funding_category_but_invalid_lookup_value(
        self,
        db_session,
        transform_funding_category,
        is_forecast,
        legacy_lookup_value,
    ):
        opportunity_summary = f.OpportunitySummaryFactory.create(
            is_forecast=is_forecast, no_link_values=True
        )
        insert_but_invalid_value = setup_funding_category(
            create_existing=False,
            opportunity_summary=opportunity_summary,
            legacy_lookup_value=legacy_lookup_value,
        )

        with pytest.raises(ValueError, match="Unrecognized funding category"):
            transform_funding_category.process_link_funding_category(
                insert_but_invalid_value, None, opportunity_summary
            )

    @pytest.mark.parametrize(
        "factory_cls", [f.StagingTfundactcatForecastFactory, f.StagingTfundactcatSynopsisFactory]
    )
    def test_process_funding_category_but_no_opportunity_summary_non_hist(
        self,
        db_session,
        transform_funding_category,
        factory_cls,
    ):
        source_record = factory_cls.create(orphaned_record=True)

        with pytest.raises(
            ValueError,
            match="Funding category record cannot be processed as the opportunity summary for it does not exist",
        ):
            transform_funding_category.process_link_funding_category(source_record, None, None)
