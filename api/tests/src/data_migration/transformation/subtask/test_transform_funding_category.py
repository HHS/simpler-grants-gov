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
    @pytest.fixture()
    def transform_funding_category(self, transform_oracle_data_task):
        return TransformFundingCategory(transform_oracle_data_task)

    def test_process_funding_categories(self, db_session, transform_funding_category):
        opportunity_summary_forecast = f.OpportunitySummaryFactory.create(
            is_forecast=True, revision_number=None, no_link_values=True
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

        opportunity_summary_forecast_hist = f.OpportunitySummaryFactory.create(
            is_forecast=True, revision_number=3, no_link_values=True
        )
        forecast_hist_insert1 = setup_funding_category(
            create_existing=False,
            opportunity_summary=opportunity_summary_forecast_hist,
            legacy_lookup_value="DPR",
        )
        forecast_hist_insert2 = setup_funding_category(
            create_existing=False,
            opportunity_summary=opportunity_summary_forecast_hist,
            legacy_lookup_value="ED",
        )
        forecast_hist_update1 = setup_funding_category(
            create_existing=True,
            opportunity_summary=opportunity_summary_forecast_hist,
            legacy_lookup_value="ELT",
            funding_category=FundingCategory.EMPLOYMENT_LABOR_AND_TRAINING,
        )
        forecast_hist_delete1 = setup_funding_category(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_forecast_hist,
            legacy_lookup_value="EN",
            funding_category=FundingCategory.ENERGY,
        )
        forecast_hist_delete_already_processed = setup_funding_category(
            create_existing=False,
            is_delete=True,
            is_already_processed=True,
            opportunity_summary=opportunity_summary_forecast_hist,
            legacy_lookup_value="ENV",
        )

        opportunity_summary_syn = f.OpportunitySummaryFactory.create(
            is_forecast=False, revision_number=None, no_link_values=True
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

        opportunity_summary_syn_hist = f.OpportunitySummaryFactory.create(
            is_forecast=False, revision_number=21, no_link_values=True
        )
        syn_hist_insert1 = setup_funding_category(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="LJL",
        )
        syn_hist_insert2 = setup_funding_category(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="NR",
        )
        syn_hist_insert3 = setup_funding_category(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="OZ",
        )
        syn_hist_update1 = setup_funding_category(
            create_existing=True,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="RD",
            funding_category=FundingCategory.REGIONAL_DEVELOPMENT,
        )

        syn_hist_delete1 = setup_funding_category(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="ST",
            funding_category=FundingCategory.SCIENCE_TECHNOLOGY_AND_OTHER_RESEARCH_AND_DEVELOPMENT,
        )
        syn_hist_delete2 = setup_funding_category(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="T",
            funding_category=FundingCategory.TRANSPORTATION,
        )
        syn_hist_insert_invalid_type = setup_funding_category(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="XYZ",
            funding_category=FundingCategory.HEALTH,
        )

        transform_funding_category.run_subtask()

        validate_funding_category(
            db_session, forecast_insert1, expected_funding_category=FundingCategory.RECOVERY_ACT
        )
        validate_funding_category(
            db_session, forecast_insert2, expected_funding_category=FundingCategory.AGRICULTURE
        )
        validate_funding_category(
            db_session,
            forecast_hist_insert1,
            expected_funding_category=FundingCategory.DISASTER_PREVENTION_AND_RELIEF,
        )
        validate_funding_category(
            db_session, forecast_hist_insert2, expected_funding_category=FundingCategory.EDUCATION
        )
        validate_funding_category(
            db_session, syn_insert1, expected_funding_category=FundingCategory.FOOD_AND_NUTRITION
        )
        validate_funding_category(
            db_session, syn_insert2, expected_funding_category=FundingCategory.HEALTH
        )
        validate_funding_category(
            db_session,
            syn_hist_insert1,
            expected_funding_category=FundingCategory.LAW_JUSTICE_AND_LEGAL_SERVICES,
        )
        validate_funding_category(
            db_session,
            syn_hist_insert2,
            expected_funding_category=FundingCategory.NATURAL_RESOURCES,
        )
        validate_funding_category(
            db_session,
            syn_hist_insert3,
            expected_funding_category=FundingCategory.OPPORTUNITY_ZONE_BENEFITS,
        )

        validate_funding_category(
            db_session, forecast_update1, expected_funding_category=FundingCategory.ARTS
        )
        validate_funding_category(
            db_session,
            forecast_hist_update1,
            expected_funding_category=FundingCategory.EMPLOYMENT_LABOR_AND_TRAINING,
        )
        validate_funding_category(
            db_session, syn_update1, expected_funding_category=FundingCategory.HOUSING
        )
        validate_funding_category(
            db_session,
            syn_hist_update1,
            expected_funding_category=FundingCategory.REGIONAL_DEVELOPMENT,
        )

        validate_funding_category(db_session, forecast_delete1, expect_in_db=False)
        validate_funding_category(db_session, forecast_delete2, expect_in_db=False)
        validate_funding_category(db_session, forecast_hist_delete1, expect_in_db=False)
        validate_funding_category(db_session, syn_delete1, expect_in_db=False)
        validate_funding_category(db_session, syn_delete2, expect_in_db=False)
        validate_funding_category(db_session, syn_hist_delete1, expect_in_db=False)
        validate_funding_category(db_session, syn_hist_delete2, expect_in_db=False)

        validate_funding_category(
            db_session,
            forecast_update_already_processed,
            expected_funding_category=FundingCategory.CONSUMER_PROTECTION,
            expect_values_to_match=False,
        )
        validate_funding_category(
            db_session, forecast_hist_delete_already_processed, expect_in_db=False
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
        validate_funding_category(
            db_session, syn_hist_insert_invalid_type, expect_in_db=False, was_processed=False
        )

        metrics = transform_funding_category.metrics
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_PROCESSED] == 22
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_DELETED] == 7
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_INSERTED] == 9
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_UPDATED] == 4
        assert metrics[transform_constants.Metrics.TOTAL_ERROR_COUNT] == 1
        assert metrics[transform_constants.Metrics.TOTAL_DELETE_ORPHANS_SKIPPED] == 1

        # Rerunning will only attempt to re-process the errors, so total+errors goes up by 1
        db_session.commit()  # commit to end any existing transactions as run_subtask starts a new one
        transform_funding_category.run_subtask()
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_PROCESSED] == 23
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_DELETED] == 7
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_INSERTED] == 9
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_UPDATED] == 4
        assert metrics[transform_constants.Metrics.TOTAL_ERROR_COUNT] == 2
        assert metrics[transform_constants.Metrics.TOTAL_DELETE_ORPHANS_SKIPPED] == 1

    @pytest.mark.parametrize(
        "is_forecast,revision_number", [(True, None), (False, None), (True, 1), (False, 70)]
    )
    def test_process_funding_category_but_current_missing(
        self, db_session, transform_funding_category, is_forecast, revision_number
    ):
        opportunity_summary = f.OpportunitySummaryFactory.create(
            is_forecast=is_forecast, revision_number=revision_number, no_link_values=True
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

    @pytest.mark.parametrize(
        "is_forecast,revision_number,legacy_lookup_value",
        [(True, None, "ab"), (False, None, "cd"), (True, 5, "ef"), (False, 10, "Ag")],
    )
    def test_process_funding_category_but_invalid_lookup_value(
        self,
        db_session,
        transform_funding_category,
        is_forecast,
        revision_number,
        legacy_lookup_value,
    ):
        opportunity_summary = f.OpportunitySummaryFactory.create(
            is_forecast=is_forecast, revision_number=revision_number, no_link_values=True
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

    @pytest.mark.parametrize(
        "factory_cls",
        [f.StagingTfundactcatForecastHistFactory, f.StagingTfundactcatSynopsisHistFactory],
    )
    def test_process_funding_category_but_no_opportunity_summary_hist(
        self,
        db_session,
        transform_funding_category,
        factory_cls,
    ):
        source_record = factory_cls.create(orphaned_record=True, revision_number=12)
        transform_funding_category.process_link_funding_category(source_record, None, None)
        assert source_record.transformed_at is not None
        assert source_record.transformation_notes == "orphaned_historical_record"
