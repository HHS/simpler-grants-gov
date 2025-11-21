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
    @pytest.fixture
    def transform_applicant_type(self, transform_oracle_data_task):
        return TransformApplicantType(transform_oracle_data_task)

    def test_process_applicant_types(self, db_session, transform_applicant_type):
        # Forecast scenarios
        opportunity_summary_forecast = f.OpportunitySummaryFactory.create(
            is_forecast=True, no_link_values=True
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

        # Synopsis scenarios
        opportunity_summary_syn = f.OpportunitySummaryFactory.create(
            is_forecast=False, no_link_values=True
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

        transform_applicant_type.run_subtask()

        # Validate forecast scenarios
        validate_applicant_type(
            db_session, forecast_insert1, expected_applicant_type=ApplicantType.STATE_GOVERNMENTS
        )
        validate_applicant_type(
            db_session, forecast_update1, expected_applicant_type=ApplicantType.COUNTY_GOVERNMENTS
        )
        validate_applicant_type(
            db_session,
            forecast_update2,
            expected_applicant_type=ApplicantType.CITY_OR_TOWNSHIP_GOVERNMENTS,
        )
        validate_applicant_type(db_session, forecast_delete1, expect_in_db=False)
        validate_applicant_type(db_session, forecast_delete2, expect_in_db=False)
        validate_applicant_type(
            db_session,
            forecast_update_already_processed,
            expected_applicant_type=ApplicantType.PUBLIC_AND_STATE_INSTITUTIONS_OF_HIGHER_EDUCATION,
            expect_values_to_match=False,
        )

        # Validate synopsis scenarios
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
            syn_update1,
            expected_applicant_type=ApplicantType.FOR_PROFIT_ORGANIZATIONS_OTHER_THAN_SMALL_BUSINESSES,
        )
        validate_applicant_type(
            db_session, syn_update2, expected_applicant_type=ApplicantType.SMALL_BUSINESSES
        )
        validate_applicant_type(db_session, syn_delete1, expect_in_db=False)
        validate_applicant_type(db_session, syn_delete2, expect_in_db=False)
        validate_applicant_type(
            db_session,
            syn_update_already_processed,
            expected_applicant_type=ApplicantType.PUBLIC_AND_INDIAN_HOUSING_AUTHORITIES,
            expect_values_to_match=False,
        )
        validate_applicant_type(
            db_session, syn_delete_but_current_missing, expect_in_db=False, was_processed=True
        )

        # Validate metrics
        metrics = transform_applicant_type.metrics
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_PROCESSED] == 12
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_DELETED] == 4
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_INSERTED] == 3
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_UPDATED] == 4
        assert transform_constants.Metrics.TOTAL_ERROR_COUNT not in metrics
        assert metrics[transform_constants.Metrics.TOTAL_DELETE_ORPHANS_SKIPPED] == 1

        # Rerunning will not reprocess anything since there were no errors
        db_session.commit()  # commit to end any existing transactions as run_subtask starts a new one
        transform_applicant_type.run_subtask()
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_PROCESSED] == 12
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_DELETED] == 4
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_INSERTED] == 3
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_UPDATED] == 4
        assert transform_constants.Metrics.TOTAL_ERROR_COUNT not in metrics
        assert metrics[transform_constants.Metrics.TOTAL_DELETE_ORPHANS_SKIPPED] == 1

    def test_process_applicant_types_delete_and_inserts(self, db_session, transform_applicant_type):
        """Test that if we receive an insert and delete of the same lookup value
        in a single batch, we'll delete and then insert the record (effectively no meaningful change)
        """
        opportunity_summary_forecast = f.OpportunitySummaryFactory.create(
            is_forecast=True, no_link_values=True
        )
        forecast_insert1 = setup_applicant_type(
            create_existing=False,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="04",
        )
        forecast_insert2 = setup_applicant_type(
            create_existing=False,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="05",
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

        opportunity_summary_syn = f.OpportunitySummaryFactory.create(
            is_forecast=False, no_link_values=True
        )
        syn_insert1 = setup_applicant_type(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="25",
        )
        syn_insert2 = setup_applicant_type(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="99",
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

        transform_applicant_type.run_subtask()

        validate_applicant_type(
            db_session,
            forecast_insert1,
            expected_applicant_type=ApplicantType.SPECIAL_DISTRICT_GOVERNMENTS,
        )
        validate_applicant_type(
            db_session,
            forecast_insert2,
            expected_applicant_type=ApplicantType.INDEPENDENT_SCHOOL_DISTRICTS,
        )
        validate_applicant_type(
            db_session, syn_insert1, expected_applicant_type=ApplicantType.OTHER
        )
        validate_applicant_type(
            db_session, syn_insert2, expected_applicant_type=ApplicantType.UNRESTRICTED
        )

        validate_applicant_type(db_session, forecast_delete1, expect_in_db=False)
        validate_applicant_type(db_session, forecast_delete2, expect_in_db=False)
        validate_applicant_type(db_session, syn_delete1, expect_in_db=False)
        validate_applicant_type(db_session, syn_delete2, expect_in_db=False)

        metrics = transform_applicant_type.metrics
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_PROCESSED] == 8
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_DELETED] == 4
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_INSERTED] == 4

    @pytest.mark.parametrize("is_forecast", [True, False])
    def test_process_applicant_type_but_no_opportunity_summary_non_hist(
        self,
        db_session,
        transform_applicant_type,
        is_forecast,
    ):
        opportunity_summary = f.OpportunitySummaryFactory.create(
            is_forecast=is_forecast, no_link_values=True
        )

        source_record = setup_applicant_type(
            create_existing=False,
            opportunity_summary=opportunity_summary,
            legacy_lookup_value="00",
        )

        with pytest.raises(
            ValueError,
            match="Applicant type record cannot be processed as the opportunity summary for it does not exist",
        ):
            transform_applicant_type.process_link_applicant_type(source_record, None, None)
