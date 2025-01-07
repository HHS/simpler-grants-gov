import pytest

import tests.src.db.models.factories as f
from src.data_migration.transformation import transform_constants
from src.data_migration.transformation.subtask.transform_opportunity_attachment import (
    TransformOpportunityAttachment,
)
from tests.src.data_migration.transformation.conftest import (
    BaseTransformTestClass,
    setup_opportunity_attachment,
    validate_opportunity_attachment,
)


class TestTransformOpportunitySummary(BaseTransformTestClass):
    @pytest.fixture()
    def transform_opportunity_attachment(self, transform_oracle_data_task):
        return TransformOpportunityAttachment(transform_oracle_data_task)

    def test_transform_opportunity_attachment(self, db_session, transform_opportunity_attachment):

        opportunity1 = f.OpportunityFactory.create(opportunity_attachments=[])

        insert1 = setup_opportunity_attachment(create_existing=False, opportunity=opportunity1)
        insert2 = setup_opportunity_attachment(create_existing=False, opportunity=opportunity1)

        update1 = setup_opportunity_attachment(create_existing=True, opportunity=opportunity1)
        update2 = setup_opportunity_attachment(create_existing=True, opportunity=opportunity1)

        delete1 = setup_opportunity_attachment(
            create_existing=True, is_delete=True, opportunity=opportunity1
        )

        opportunity2 = f.OpportunityFactory.create(opportunity_attachments=[])

        insert3 = setup_opportunity_attachment(create_existing=False, opportunity=opportunity2)
        update3 = setup_opportunity_attachment(create_existing=True, opportunity=opportunity2)
        delete2 = setup_opportunity_attachment(
            create_existing=True, is_delete=True, opportunity=opportunity2
        )

        already_processed_insert = setup_opportunity_attachment(
            create_existing=False, opportunity=opportunity2, is_already_processed=True
        )
        already_processed_update = setup_opportunity_attachment(
            create_existing=True, opportunity=opportunity2, is_already_processed=True
        )

        delete_but_current_missing = setup_opportunity_attachment(
            create_existing=False, opportunity=opportunity2, is_delete=True
        )

        transform_opportunity_attachment.run_subtask()

        validate_opportunity_attachment(db_session, insert1)
        validate_opportunity_attachment(db_session, insert2)
        validate_opportunity_attachment(db_session, insert3)

        validate_opportunity_attachment(db_session, update1)
        validate_opportunity_attachment(db_session, update2)
        validate_opportunity_attachment(db_session, update3)

        validate_opportunity_attachment(db_session, delete1, expect_in_db=False)
        validate_opportunity_attachment(db_session, delete2, expect_in_db=False)

        validate_opportunity_attachment(db_session, already_processed_insert, expect_in_db=False)
        validate_opportunity_attachment(
            db_session, already_processed_update, expect_values_to_match=False
        )

        validate_opportunity_attachment(db_session, delete_but_current_missing, expect_in_db=False)

        metrics = transform_opportunity_attachment.metrics
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_PROCESSED] == 9
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_DELETED] == 2
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_INSERTED] == 3
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_UPDATED] == 3
        assert metrics[transform_constants.Metrics.TOTAL_DELETE_ORPHANS_SKIPPED] == 1

        db_session.commit()  # commit to end any existing transactions as run_subtask starts a new one
        transform_opportunity_attachment.run_subtask()
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_PROCESSED] == 9
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_DELETED] == 2
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_INSERTED] == 3
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_UPDATED] == 3
        assert metrics[transform_constants.Metrics.TOTAL_DELETE_ORPHANS_SKIPPED] == 1

    def test_transform_opportunity_attachment_delete_but_current_missing(
        self, db_session, transform_opportunity_attachment
    ):
        opportunity = f.OpportunityFactory.create(opportunity_attachments=[])
        delete_but_current_missing = setup_opportunity_attachment(
            create_existing=False, opportunity=opportunity, is_delete=True
        )

        transform_opportunity_attachment.process_opportunity_attachment(
            delete_but_current_missing, None, opportunity
        )

        validate_opportunity_attachment(db_session, delete_but_current_missing, expect_in_db=False)
        assert delete_but_current_missing.transformed_at is not None
        assert delete_but_current_missing.transformation_notes == "orphaned_delete_record"

    def test_transform_opportunity_attachment_no_opportunity(
        self, db_session, transform_opportunity_attachment
    ):
        opportunity = f.OpportunityFactory.create(opportunity_attachments=[])
        insert = setup_opportunity_attachment(create_existing=False, opportunity=opportunity)

        # Don't pass the opportunity in - as if it wasn't found
        with pytest.raises(
            ValueError,
            match="Opportunity attachment cannot be processed as the opportunity for it does not exist",
        ):
            transform_opportunity_attachment.process_opportunity_attachment(insert, None, None)

        assert insert.transformed_at is None
