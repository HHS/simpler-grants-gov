import pytest

import src.data_migration.transformation.transform_constants as transform_constants
import tests.src.db.models.factories as f
from src.constants.lookup_constants import FundingInstrument
from src.data_migration.transformation.subtask.transform_funding_instrument import (
    TransformFundingInstrument,
)
from tests.src.data_migration.transformation.conftest import (
    BaseTransformTestClass,
    setup_funding_instrument,
    validate_funding_instrument,
)


class TestTransformFundingInstrument(BaseTransformTestClass):
    @pytest.fixture()
    def transform_funding_instrument(self, transform_oracle_data_task):
        return TransformFundingInstrument(transform_oracle_data_task)

    def test_process_funding_instruments(self, db_session, transform_funding_instrument):
        opportunity_summary_forecast = f.OpportunitySummaryFactory.create(
            is_forecast=True, revision_number=None, no_link_values=True
        )
        forecast_insert1 = setup_funding_instrument(
            create_existing=False,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="CA",
        )
        forecast_update1 = setup_funding_instrument(
            create_existing=True,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="G",
            funding_instrument=FundingInstrument.GRANT,
        )
        forecast_delete1 = setup_funding_instrument(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="PC",
            funding_instrument=FundingInstrument.PROCUREMENT_CONTRACT,
        )
        forecast_update_already_processed = setup_funding_instrument(
            create_existing=True,
            is_already_processed=True,
            opportunity_summary=opportunity_summary_forecast,
            legacy_lookup_value="O",
            funding_instrument=FundingInstrument.OTHER,
        )

        opportunity_summary_forecast_hist = f.OpportunitySummaryFactory.create(
            is_forecast=True, revision_number=3, no_link_values=True
        )
        forecast_hist_insert1 = setup_funding_instrument(
            create_existing=False,
            opportunity_summary=opportunity_summary_forecast_hist,
            legacy_lookup_value="G",
        )
        forecast_hist_delete1 = setup_funding_instrument(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_forecast_hist,
            legacy_lookup_value="CA",
            funding_instrument=FundingInstrument.COOPERATIVE_AGREEMENT,
        )
        forecast_hist_delete_already_processed = setup_funding_instrument(
            create_existing=False,
            is_delete=True,
            is_already_processed=True,
            opportunity_summary=opportunity_summary_forecast_hist,
            legacy_lookup_value="O",
        )
        syn_delete_but_current_missing = setup_funding_instrument(
            create_existing=False,
            is_delete=True,
            opportunity_summary=opportunity_summary_forecast_hist,
            legacy_lookup_value="PC",
        )

        opportunity_summary_syn = f.OpportunitySummaryFactory.create(
            is_forecast=False, revision_number=None, no_link_values=True
        )
        syn_insert1 = setup_funding_instrument(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="O",
        )
        syn_insert2 = setup_funding_instrument(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="G",
        )
        syn_delete1 = setup_funding_instrument(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="CA",
            funding_instrument=FundingInstrument.COOPERATIVE_AGREEMENT,
        )
        syn_update_already_processed = setup_funding_instrument(
            create_existing=True,
            is_already_processed=True,
            opportunity_summary=opportunity_summary_syn,
            legacy_lookup_value="PC",
            funding_instrument=FundingInstrument.PROCUREMENT_CONTRACT,
        )

        opportunity_summary_syn_hist = f.OpportunitySummaryFactory.create(
            is_forecast=False, revision_number=21, no_link_values=True
        )
        syn_hist_insert1 = setup_funding_instrument(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="CA",
        )
        syn_hist_update1 = setup_funding_instrument(
            create_existing=True,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="O",
            funding_instrument=FundingInstrument.OTHER,
        )
        syn_hist_delete1 = setup_funding_instrument(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="PC",
            funding_instrument=FundingInstrument.PROCUREMENT_CONTRACT,
        )
        syn_hist_delete2 = setup_funding_instrument(
            create_existing=True,
            is_delete=True,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="G",
            funding_instrument=FundingInstrument.GRANT,
        )
        syn_hist_insert_invalid_type = setup_funding_instrument(
            create_existing=False,
            opportunity_summary=opportunity_summary_syn_hist,
            legacy_lookup_value="X",
        )

        transform_funding_instrument.run_subtask()

        validate_funding_instrument(
            db_session,
            forecast_insert1,
            expected_funding_instrument=FundingInstrument.COOPERATIVE_AGREEMENT,
        )
        validate_funding_instrument(
            db_session, forecast_hist_insert1, expected_funding_instrument=FundingInstrument.GRANT
        )
        validate_funding_instrument(
            db_session, syn_insert1, expected_funding_instrument=FundingInstrument.OTHER
        )
        validate_funding_instrument(
            db_session, syn_insert2, expected_funding_instrument=FundingInstrument.GRANT
        )
        validate_funding_instrument(
            db_session,
            syn_hist_insert1,
            expected_funding_instrument=FundingInstrument.COOPERATIVE_AGREEMENT,
        )

        validate_funding_instrument(
            db_session, forecast_update1, expected_funding_instrument=FundingInstrument.GRANT
        )
        validate_funding_instrument(
            db_session, syn_hist_update1, expected_funding_instrument=FundingInstrument.OTHER
        )

        validate_funding_instrument(db_session, forecast_delete1, expect_in_db=False)
        validate_funding_instrument(db_session, forecast_hist_delete1, expect_in_db=False)
        validate_funding_instrument(db_session, syn_delete1, expect_in_db=False)
        validate_funding_instrument(db_session, syn_hist_delete1, expect_in_db=False)
        validate_funding_instrument(db_session, syn_hist_delete2, expect_in_db=False)

        validate_funding_instrument(
            db_session,
            forecast_update_already_processed,
            expected_funding_instrument=FundingInstrument.OTHER,
            expect_values_to_match=False,
        )
        validate_funding_instrument(
            db_session, forecast_hist_delete_already_processed, expect_in_db=False
        )
        validate_funding_instrument(
            db_session,
            syn_update_already_processed,
            expected_funding_instrument=FundingInstrument.PROCUREMENT_CONTRACT,
            expect_values_to_match=False,
        )

        validate_funding_instrument(
            db_session, syn_delete_but_current_missing, expect_in_db=False, was_processed=True
        )
        validate_funding_instrument(
            db_session, syn_hist_insert_invalid_type, expect_in_db=False, was_processed=False
        )

        metrics = transform_funding_instrument.metrics
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_PROCESSED] == 14
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_DELETED] == 5
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_INSERTED] == 5
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_UPDATED] == 2
        assert metrics[transform_constants.Metrics.TOTAL_ERROR_COUNT] == 1
        assert metrics[transform_constants.Metrics.TOTAL_DELETE_ORPHANS_SKIPPED] == 1

        # Rerunning will only attempt to re-process the errors, so total+errors goes up by 2
        db_session.commit()  # commit to end any existing transactions as run_subtask starts a new one
        transform_funding_instrument.run_subtask()
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_PROCESSED] == 15
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_DELETED] == 5
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_INSERTED] == 5
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_UPDATED] == 2
        assert metrics[transform_constants.Metrics.TOTAL_ERROR_COUNT] == 2
        assert metrics[transform_constants.Metrics.TOTAL_DELETE_ORPHANS_SKIPPED] == 1

    @pytest.mark.parametrize(
        "is_forecast,revision_number", [(True, None), (False, None), (True, 1), (False, 4)]
    )
    def test_process_funding_instrument_but_current_missing(
        self, db_session, transform_funding_instrument, is_forecast, revision_number
    ):
        opportunity_summary = f.OpportunitySummaryFactory.create(
            is_forecast=is_forecast, revision_number=revision_number, no_link_values=True
        )
        delete_but_current_missing = setup_funding_instrument(
            create_existing=False,
            opportunity_summary=opportunity_summary,
            legacy_lookup_value="G",
            is_delete=True,
        )

        transform_funding_instrument.process_link_funding_instrument(
            delete_but_current_missing, None, opportunity_summary
        )

        validate_funding_instrument(db_session, delete_but_current_missing, expect_in_db=False)
        assert delete_but_current_missing.transformed_at is not None
        assert delete_but_current_missing.transformation_notes == "orphaned_delete_record"

    @pytest.mark.parametrize(
        "is_forecast,revision_number,legacy_lookup_value",
        [(True, None, "X"), (False, None, "4"), (True, 5, "Y"), (False, 10, "A")],
    )
    def test_process_funding_instrument_but_invalid_lookup_value(
        self,
        db_session,
        transform_funding_instrument,
        is_forecast,
        revision_number,
        legacy_lookup_value,
    ):
        opportunity_summary = f.OpportunitySummaryFactory.create(
            is_forecast=is_forecast, revision_number=revision_number, no_link_values=True
        )
        insert_but_invalid_value = setup_funding_instrument(
            create_existing=False,
            opportunity_summary=opportunity_summary,
            legacy_lookup_value=legacy_lookup_value,
        )

        with pytest.raises(ValueError, match="Unrecognized funding instrument"):
            transform_funding_instrument.process_link_funding_instrument(
                insert_but_invalid_value, None, opportunity_summary
            )

    @pytest.mark.parametrize(
        "factory_cls", [f.StagingTfundinstrForecastFactory, f.StagingTfundinstrSynopsisFactory]
    )
    def test_process_funding_instrument_but_no_opportunity_summary_non_hist(
        self,
        db_session,
        transform_funding_instrument,
        factory_cls,
    ):
        source_record = factory_cls.create(orphaned_record=True)

        with pytest.raises(
            ValueError,
            match="Funding instrument record cannot be processed as the opportunity summary for it does not exist",
        ):
            transform_funding_instrument.process_link_funding_instrument(source_record, None, None)

    @pytest.mark.parametrize(
        "factory_cls",
        [f.StagingTfundinstrForecastHistFactory, f.StagingTfundinstrSynopsisHistFactory],
    )
    def test_process_funding_instrument_but_no_opportunity_summary_hist(
        self,
        db_session,
        transform_funding_instrument,
        factory_cls,
    ):
        source_record = factory_cls.create(orphaned_record=True, revision_number=12)
        transform_funding_instrument.process_link_funding_instrument(source_record, None, None)
        assert source_record.transformed_at is not None
        assert source_record.transformation_notes == "orphaned_historical_record"
