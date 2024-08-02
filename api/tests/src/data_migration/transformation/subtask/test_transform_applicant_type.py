import pytest

import src.data_migration.transformation.transform_constants as transform_constants
import tests.src.db.models.factories as f
from src.constants.lookup_constants import ApplicantType
from src.data_migration.transformation.subtask.transform_applicant_type import (
    TransformApplicantType,
)
from tests.src.data_migration.transformation.conftest import (
    BaseTransformTestClass,
    setup_applicant_type,
    validate_applicant_type,
)


class TestTransformApplicantType(BaseTransformTestClass):
    @pytest.fixture()
    def transform_applicant_type(self, transform_oracle_data_task):
        return TransformApplicantType(transform_oracle_data_task)

    def test_process_applicant_types(self, db_session, transform_applicant_type):
        opportunity_summary_forecast = f.OpportunitySummaryFactory.create(
            is_forecast=True, revision_number=None, no_link_values=True
        )
        forecast_insert1 = setup_applicant_type(
            create_existing=False,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="00",
        )
        forecast_update1 = setup_applicant_type(
            create_existing=True,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="01",
            applicant_type=ApplicantType.COUNTY_GOVERNMENTS,
        )
        forecast_update2 = setup_applicant_type(
            create_existing=True,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="02",
            applicant_type=ApplicantType.CITY_OR_TOWNSHIP_GOVERNMENTS,
        )
        forecast_delete1 = setup_applicant_type(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="04",
            applicant_type=ApplicantType.SPECIAL_DISTRICT_GOVERNMENTS,
        )
        forecast_delete2 = setup_applicant_type(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="05",
            applicant_type=ApplicantType.INDEPENDENT_SCHOOL_DISTRICTS,
        )
        forecast_update_already_processed = setup_applicant_type(
            create_existing=True,
            is_already_processed=True,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="06",
            applicant_type=ApplicantType.PUBLIC_AND_STATE_INSTITUTIONS_OF_HIGHER_EDUCATION,
        )

        opportunity_summary_forecast_hist = f.OpportunitySummaryFactory.create(
            is_forecast=True, revision_number=3, no_link_values=True
        )
        forecast_hist_insert1 = setup_applicant_type(
            create_existing=False,
            opportunity_summary=opportunity_summary_forecast_hist,
            legacy_lookup_value="07",
        )
        forecast_hist_update1 = setup_applicant_type(
            create_existing=True,
            opportunity_summary=opportunity_summary_forecast_hist,
            legacy_lookup_value="08",
            applicant_type=ApplicantType.PUBLIC_AND_INDIAN_HOUSING_AUTHORITIES,
        )
        forecast_hist_update2 = setup_applicant_type(
            create_existing=True,
            opportunity_summary=opportunity_summary_forecast_hist,
            legacy_lookup_value="11",
            applicant_type=ApplicantType.OTHER_NATIVE_AMERICAN_TRIBAL_ORGANIZATIONS,
        )
        forecast_hist_delete1 = setup_applicant_type(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_forecast_hist,
            legacy_lookup_value="12",
            applicant_type=ApplicantType.NONPROFITS_NON_HIGHER_EDUCATION_WITH_501C3,
        )
        forecast_hist_delete_already_processed = setup_applicant_type(
            create_existing=False,
            is_delete=True,
            is_already_processed=True,
            opportunity_summary=opportunity_summary_forecast_hist,
            legacy_lookup_value="13",
        )
        forecast_hist_duplicate_insert = setup_applicant_type(
            create_existing=False,
            opportunity_summary=opportunity_summary_forecast_hist,
            legacy_lookup_value="08",
        )

        opportunity_summary_syn = f.OpportunitySummaryFactory.create(
            is_forecast=False, revision_number=None, no_link_values=True
        )
        syn_insert1 = setup_applicant_type(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="20",
        )
        syn_insert2 = setup_applicant_type(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="21",
        )
        syn_update1 = setup_applicant_type(
            create_existing=True,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="22",
            applicant_type=ApplicantType.FOR_PROFIT_ORGANIZATIONS_OTHER_THAN_SMALL_BUSINESSES,
        )
        syn_update2 = setup_applicant_type(
            create_existing=True,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="23",
            applicant_type=ApplicantType.SMALL_BUSINESSES,
        )
        syn_delete1 = setup_applicant_type(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="25",
            applicant_type=ApplicantType.OTHER,
        )
        syn_delete2 = setup_applicant_type(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="99",
            applicant_type=ApplicantType.UNRESTRICTED,
        )
        syn_delete_but_current_missing = setup_applicant_type(
            create_existing=False,
            is_delete=True,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="07",
        )
        syn_update_already_processed = setup_applicant_type(
            create_existing=True,
            is_already_processed=True,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="08",
            applicant_type=ApplicantType.PUBLIC_AND_INDIAN_HOUSING_AUTHORITIES,
        )

        opportunity_summary_syn_hist = f.OpportunitySummaryFactory.create(
            is_forecast=False, revision_number=21, no_link_values=True
        )
        syn_hist_insert1 = setup_applicant_type(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="11",
        )
        syn_hist_update1 = setup_applicant_type(
            create_existing=True,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="12",
            applicant_type=ApplicantType.NONPROFITS_NON_HIGHER_EDUCATION_WITH_501C3,
        )
        syn_hist_update2 = setup_applicant_type(
            create_existing=True,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="13",
            applicant_type=ApplicantType.NONPROFITS_NON_HIGHER_EDUCATION_WITHOUT_501C3,
        )
        syn_hist_delete1 = setup_applicant_type(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="25",
            applicant_type=ApplicantType.OTHER,
        )
        syn_hist_delete2 = setup_applicant_type(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="99",
            applicant_type=ApplicantType.UNRESTRICTED,
        )
        syn_hist_insert_invalid_type = setup_applicant_type(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="X",
            applicant_type=ApplicantType.STATE_GOVERNMENTS,
        )

        transform_applicant_type.run_subtask()

        validate_applicant_type(
            db_session, forecast_insert1, expected_applicant_type=ApplicantType.STATE_GOVERNMENTS
        )
        validate_applicant_type(
            db_session,
            forecast_hist_insert1,
            expected_applicant_type=ApplicantType.FEDERALLY_RECOGNIZED_NATIVE_AMERICAN_TRIBAL_GOVERNMENTS,
        )
        validate_applicant_type(
            db_session,
            syn_insert1,
            expected_applicant_type=ApplicantType.PRIVATE_INSTITUTIONS_OF_HIGHER_EDUCATION,
        )
        validate_applicant_type(
            db_session, syn_insert2, expected_applicant_type=ApplicantType.INDIVIDUALS
        )
        validate_applicant_type(
            db_session,
            syn_hist_insert1,
            expected_applicant_type=ApplicantType.OTHER_NATIVE_AMERICAN_TRIBAL_ORGANIZATIONS,
        )

        validate_applicant_type(
            db_session, forecast_update1, expected_applicant_type=ApplicantType.COUNTY_GOVERNMENTS
        )
        validate_applicant_type(
            db_session,
            forecast_update2,
            expected_applicant_type=ApplicantType.CITY_OR_TOWNSHIP_GOVERNMENTS,
        )
        validate_applicant_type(
            db_session,
            forecast_hist_update1,
            expected_applicant_type=ApplicantType.PUBLIC_AND_INDIAN_HOUSING_AUTHORITIES,
        )
        validate_applicant_type(
            db_session,
            forecast_hist_update2,
            expected_applicant_type=ApplicantType.OTHER_NATIVE_AMERICAN_TRIBAL_ORGANIZATIONS,
        )
        validate_applicant_type(
            db_session,
            syn_update1,
            expected_applicant_type=ApplicantType.FOR_PROFIT_ORGANIZATIONS_OTHER_THAN_SMALL_BUSINESSES,
        )
        validate_applicant_type(
            db_session, syn_update2, expected_applicant_type=ApplicantType.SMALL_BUSINESSES
        )
        validate_applicant_type(
            db_session,
            syn_hist_update1,
            expected_applicant_type=ApplicantType.NONPROFITS_NON_HIGHER_EDUCATION_WITH_501C3,
        )
        validate_applicant_type(
            db_session,
            syn_hist_update2,
            expected_applicant_type=ApplicantType.NONPROFITS_NON_HIGHER_EDUCATION_WITHOUT_501C3,
        )

        validate_applicant_type(db_session, forecast_delete1, expect_in_db=False)
        validate_applicant_type(db_session, forecast_delete2, expect_in_db=False)
        validate_applicant_type(db_session, forecast_hist_delete1, expect_in_db=False)
        validate_applicant_type(db_session, syn_delete1, expect_in_db=False)
        validate_applicant_type(db_session, syn_delete2, expect_in_db=False)
        validate_applicant_type(db_session, syn_hist_delete1, expect_in_db=False)
        validate_applicant_type(db_session, syn_hist_delete2, expect_in_db=False)

        validate_applicant_type(
            db_session,
            forecast_update_already_processed,
            expected_applicant_type=ApplicantType.PUBLIC_AND_STATE_INSTITUTIONS_OF_HIGHER_EDUCATION,
            expect_values_to_match=False,
        )
        validate_applicant_type(
            db_session, forecast_hist_delete_already_processed, expect_in_db=False
        )
        validate_applicant_type(
            db_session,
            syn_update_already_processed,
            expected_applicant_type=ApplicantType.PUBLIC_AND_INDIAN_HOUSING_AUTHORITIES,
            expect_values_to_match=False,
        )

        validate_applicant_type(
            db_session, syn_delete_but_current_missing, expect_in_db=False, was_processed=True
        )
        validate_applicant_type(
            db_session, syn_hist_insert_invalid_type, expect_in_db=False, was_processed=False
        )

        validate_applicant_type(
            db_session, forecast_hist_duplicate_insert, expect_in_db=False, was_processed=True
        )

        metrics = transform_applicant_type.metrics
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_PROCESSED] == 23
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_DELETED] == 7
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_INSERTED] == 5
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_UPDATED] == 8
        assert metrics[transform_constants.Metrics.TOTAL_ERROR_COUNT] == 1
        assert metrics[transform_constants.Metrics.TOTAL_DUPLICATE_RECORDS_SKIPPED] == 1
        assert metrics[transform_constants.Metrics.TOTAL_DELETE_ORPHANS_SKIPPED] == 1

        # Rerunning will only attempt to re-process the errors, so total+errors goes up by 1
        db_session.commit()  # commit to end any existing transactions as run_subtask starts a new one
        transform_applicant_type.run_subtask()
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_PROCESSED] == 24
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_DELETED] == 7
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_INSERTED] == 5
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_UPDATED] == 8
        assert metrics[transform_constants.Metrics.TOTAL_ERROR_COUNT] == 2
        assert metrics[transform_constants.Metrics.TOTAL_DUPLICATE_RECORDS_SKIPPED] == 1
        assert metrics[transform_constants.Metrics.TOTAL_DELETE_ORPHANS_SKIPPED] == 1

    @pytest.mark.parametrize(
        "is_forecast,revision_number", [(True, None), (False, None), (True, 5), (False, 10)]
    )
    def test_process_applicant_types_but_current_missing(
        self, db_session, transform_applicant_type, is_forecast, revision_number
    ):
        opportunity_summary = f.OpportunitySummaryFactory.create(
            is_forecast=is_forecast, revision_number=revision_number, no_link_values=True
        )
        delete_but_current_missing = setup_applicant_type(
            create_existing=False,
            opportunity_summary=opportunity_summary,
            legacy_lookup_value="00",
            is_delete=True,
        )

        transform_applicant_type.process_link_applicant_type(
            delete_but_current_missing, None, opportunity_summary
        )

        validate_applicant_type(db_session, delete_but_current_missing, expect_in_db=False)
        assert delete_but_current_missing.transformed_at is not None
        assert delete_but_current_missing.transformation_notes == "orphaned_delete_record"

    @pytest.mark.parametrize(
        "is_forecast,revision_number,legacy_lookup_value",
        [(True, None, "90"), (False, None, "xx"), (True, 5, "50"), (False, 10, "1")],
    )
    def test_process_applicant_types_but_invalid_lookup_value(
        self,
        db_session,
        transform_applicant_type,
        is_forecast,
        revision_number,
        legacy_lookup_value,
    ):
        opportunity_summary = f.OpportunitySummaryFactory.create(
            is_forecast=is_forecast, revision_number=revision_number, no_link_values=True
        )
        insert_but_invalid_value = setup_applicant_type(
            create_existing=False,
            opportunity_summary=opportunity_summary,
            legacy_lookup_value=legacy_lookup_value,
        )

        with pytest.raises(ValueError, match="Unrecognized applicant type"):
            transform_applicant_type.process_link_applicant_type(
                insert_but_invalid_value, None, opportunity_summary
            )

    @pytest.mark.parametrize(
        "factory_cls",
        [f.StagingTapplicanttypesForecastFactory, f.StagingTapplicanttypesSynopsisFactory],
    )
    def test_process_applicant_type_but_no_opportunity_summary_non_hist(
        self,
        db_session,
        transform_applicant_type,
        factory_cls,
    ):
        source_record = factory_cls.create(orphaned_record=True)

        with pytest.raises(
            ValueError,
            match="Applicant type record cannot be processed as the opportunity summary for it does not exist",
        ):
            transform_applicant_type.process_link_applicant_type(source_record, None, None)

    @pytest.mark.parametrize(
        "factory_cls",
        [f.StagingTapplicanttypesForecastHistFactory, f.StagingTapplicanttypesSynopsisHistFactory],
    )
    def test_process_applicant_type_but_no_opportunity_summary_hist(
        self,
        db_session,
        transform_applicant_type,
        factory_cls,
    ):
        source_record = factory_cls.create(orphaned_record=True, revision_number=12)
        transform_applicant_type.process_link_applicant_type(source_record, None, None)
        assert source_record.transformed_at is not None
        assert source_record.transformation_notes == "orphaned_historical_record"
