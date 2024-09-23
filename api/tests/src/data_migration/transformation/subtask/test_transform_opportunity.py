import pytest

import src.data_migration.transformation.transform_constants as transform_constants
from src.data_migration.transformation.subtask.transform_opportunity import TransformOpportunity
from tests.src.data_migration.transformation.conftest import (
    BaseTransformTestClass,
    setup_opportunity,
    validate_opportunity,
)


class TestTransformOpportunity(BaseTransformTestClass):
    @pytest.fixture()
    def transform_opportunity(self, transform_oracle_data_task, truncate_staging_tables):
        return TransformOpportunity(transform_oracle_data_task)

    def test_process_opportunities(self, db_session, transform_opportunity):
        ordinary_delete = setup_opportunity(
            create_existing=True, is_delete=True, all_fields_null=True
        )
        ordinary_delete2 = setup_opportunity(
            create_existing=True, is_delete=True, all_fields_null=False
        )
        delete_but_current_missing = setup_opportunity(create_existing=False, is_delete=True)

        basic_insert = setup_opportunity(create_existing=False)
        basic_insert2 = setup_opportunity(create_existing=False, all_fields_null=True)
        basic_insert3 = setup_opportunity(create_existing=False)

        basic_update = setup_opportunity(
            create_existing=True,
        )
        basic_update2 = setup_opportunity(create_existing=True, all_fields_null=True)
        basic_update3 = setup_opportunity(create_existing=True, all_fields_null=True)
        basic_update4 = setup_opportunity(create_existing=True)

        # Something else deleted it
        already_processed_insert = setup_opportunity(
            create_existing=False, is_already_processed=True
        )
        already_processed_update = setup_opportunity(
            create_existing=True, is_already_processed=True
        )

        insert_that_will_fail = setup_opportunity(
            create_existing=False, source_values={"oppcategory": "X"}
        )

        transform_opportunity.run_subtask()

        validate_opportunity(db_session, ordinary_delete, expect_in_db=False)
        validate_opportunity(db_session, ordinary_delete2, expect_in_db=False)
        validate_opportunity(db_session, delete_but_current_missing, expect_in_db=False)

        validate_opportunity(db_session, basic_insert)
        validate_opportunity(db_session, basic_insert2)
        validate_opportunity(db_session, basic_insert3)

        validate_opportunity(db_session, basic_update)
        validate_opportunity(db_session, basic_update2)
        validate_opportunity(db_session, basic_update3)
        validate_opportunity(db_session, basic_update4)

        validate_opportunity(db_session, already_processed_insert, expect_in_db=False)
        validate_opportunity(db_session, already_processed_update, expect_values_to_match=False)

        validate_opportunity(db_session, insert_that_will_fail, expect_in_db=False)

        metrics = transform_opportunity.metrics
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_PROCESSED] == 11
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_DELETED] == 2
        # Note this insert counts the case where the category fails
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_INSERTED] == 3
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_UPDATED] == 4
        assert metrics[transform_constants.Metrics.TOTAL_ERROR_COUNT] == 2

        # Rerunning does mostly nothing, it will attempt to re-process the two that errored
        # but otherwise won't find anything else
        db_session.commit()  # commit to end any existing transactions as run_subtask starts a new one
        transform_opportunity.run_subtask()
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_PROCESSED] == 13
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_DELETED] == 2
        # Note this insert counts the case where the category fails
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_INSERTED] == 3
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_UPDATED] == 4
        assert metrics[transform_constants.Metrics.TOTAL_ERROR_COUNT] == 4

    def test_process_opportunity_delete_but_current_missing(
        self, db_session, transform_opportunity
    ):
        # Verify an error is raised when we try to delete something that doesn't exist
        delete_but_current_missing = setup_opportunity(create_existing=False, is_delete=True)

        with pytest.raises(
            ValueError, match="Cannot delete opportunity record as it does not exist"
        ):
            transform_opportunity.process_opportunity(delete_but_current_missing, None)

        validate_opportunity(db_session, delete_but_current_missing, expect_in_db=False)

    def test_process_opportunity_invalid_category(self, db_session, transform_opportunity):
        # This will error in the transform as that isn't a category we have configured
        insert_that_will_fail = setup_opportunity(
            create_existing=False, source_values={"oppcategory": "X"}
        )

        with pytest.raises(ValueError, match="Unrecognized opportunity category"):
            transform_opportunity.process_opportunity(insert_that_will_fail, None)

        validate_opportunity(db_session, insert_that_will_fail, expect_in_db=False)
