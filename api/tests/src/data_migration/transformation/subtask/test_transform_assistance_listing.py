import pytest

import src.data_migration.transformation.transform_constants as transform_constants
import tests.src.db.models.factories as f
from src.data_migration.transformation.subtask.transform_assistance_listing import (
    TransformAssistanceListing,
)
from src.db.models.opportunity_models import Opportunity, OpportunityAssistanceListing
from tests.src.data_migration.transformation.conftest import (
    BaseTransformTestClass,
    setup_cfda,
    validate_assistance_listing,
)


class TestTransformAssistanceListing(BaseTransformTestClass):
    @pytest.fixture()
    def transform_assistance_listing(self, transform_oracle_data_task):
        return TransformAssistanceListing(transform_oracle_data_task)

    def test_process_opportunity_assistance_listings(
        self, db_session, transform_assistance_listing
    ):
        opportunity1 = f.OpportunityFactory.create(opportunity_assistance_listings=[])
        cfda_insert1 = setup_cfda(create_existing=False, opportunity=opportunity1)
        cfda_insert2 = setup_cfda(create_existing=False, opportunity=opportunity1)
        cfda_update1 = setup_cfda(create_existing=True, opportunity=opportunity1)
        cfda_delete1 = setup_cfda(create_existing=True, is_delete=True, opportunity=opportunity1)
        cfda_update_already_processed1 = setup_cfda(
            create_existing=True, is_already_processed=True, opportunity=opportunity1
        )

        opportunity2 = f.OpportunityFactory.create(opportunity_assistance_listings=[])
        cfda_insert3 = setup_cfda(create_existing=False, opportunity=opportunity2)
        cfda_update_already_processed2 = setup_cfda(
            create_existing=True, is_already_processed=True, opportunity=opportunity2
        )
        cfda_delete_already_processed1 = setup_cfda(
            create_existing=False,
            is_already_processed=True,
            is_delete=True,
            opportunity=opportunity2,
        )
        cfda_delete2 = setup_cfda(create_existing=True, is_delete=True, opportunity=opportunity2)

        opportunity3 = f.OpportunityFactory.create(opportunity_assistance_listings=[])
        cfda_update2 = setup_cfda(create_existing=True, opportunity=opportunity3)
        cfda_delete_but_current_missing = setup_cfda(
            create_existing=False, is_delete=True, opportunity=opportunity3
        )

        cfda_insert_without_opportunity = setup_cfda(
            create_existing=False, source_values={"opportunity_id": 12345678}, opportunity=None
        )
        cfda_delete_without_opportunity = setup_cfda(
            create_existing=False, source_values={"opportunity_id": 34567890}, opportunity=None
        )

        transform_assistance_listing.run_subtask()

        validate_assistance_listing(db_session, cfda_insert1)
        validate_assistance_listing(db_session, cfda_insert2)
        validate_assistance_listing(db_session, cfda_insert3)
        validate_assistance_listing(db_session, cfda_update1)
        validate_assistance_listing(db_session, cfda_update2)
        validate_assistance_listing(db_session, cfda_delete1, expect_in_db=False)
        validate_assistance_listing(db_session, cfda_delete2, expect_in_db=False)

        # Records that won't have been fetched
        validate_assistance_listing(
            db_session,
            cfda_update_already_processed1,
            expect_in_db=True,
            expect_values_to_match=False,
        )
        validate_assistance_listing(
            db_session,
            cfda_update_already_processed2,
            expect_in_db=True,
            expect_values_to_match=False,
        )
        validate_assistance_listing(db_session, cfda_delete_already_processed1, expect_in_db=False)

        validate_assistance_listing(db_session, cfda_delete_but_current_missing, expect_in_db=False)

        validate_assistance_listing(db_session, cfda_insert_without_opportunity, expect_in_db=False)
        validate_assistance_listing(db_session, cfda_delete_without_opportunity, expect_in_db=False)

        metrics = transform_assistance_listing.metrics
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_PROCESSED] == 10
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_DELETED] == 2
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_INSERTED] == 3
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_UPDATED] == 2
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_ORPHANED] == 2
        assert metrics[transform_constants.Metrics.TOTAL_DELETE_ORPHANS_SKIPPED] == 1

        # Rerunning finds nothing - no metrics update
        db_session.commit()  # commit to end any existing transactions as run_subtask starts a new one
        transform_assistance_listing.run_subtask()
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_PROCESSED] == 10
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_DELETED] == 2
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_INSERTED] == 3
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_UPDATED] == 2
        assert metrics[transform_constants.Metrics.TOTAL_RECORDS_ORPHANED] == 2
        assert metrics[transform_constants.Metrics.TOTAL_DELETE_ORPHANS_SKIPPED] == 1

    def test_process_assistance_listing_orphaned_record(
        self, db_session, transform_assistance_listing
    ):
        cfda_insert_without_opportunity = setup_cfda(
            create_existing=False, source_values={"opportunity_id": 987654321}, opportunity=None
        )

        # Verify it gets marked as transformed
        assert cfda_insert_without_opportunity.transformed_at is None
        transform_assistance_listing.process_assistance_listing(
            cfda_insert_without_opportunity, None, None
        )
        assert cfda_insert_without_opportunity.transformed_at is not None
        assert cfda_insert_without_opportunity.transformation_notes == "orphaned_cfda"
        assert (
            transform_assistance_listing.metrics[transform_constants.Metrics.TOTAL_RECORDS_ORPHANED]
            == 1
        )

        # Verify nothing actually gets created
        opportunity = (
            db_session.query(Opportunity)
            .filter(Opportunity.opportunity_id == cfda_insert_without_opportunity.opportunity_id)
            .one_or_none()
        )
        assert opportunity is None
        assistance_listing = (
            db_session.query(OpportunityAssistanceListing)
            .filter(
                OpportunityAssistanceListing.opportunity_assistance_listing_id
                == cfda_insert_without_opportunity.opp_cfda_id
            )
            .one_or_none()
        )
        assert assistance_listing is None

    def test_process_assistance_listing_delete_but_current_missing(
        self, db_session, transform_assistance_listing
    ):
        opportunity = f.OpportunityFactory.create(opportunity_assistance_listings=[])
        delete_but_current_missing = setup_cfda(
            create_existing=False, is_delete=True, opportunity=opportunity
        )

        transform_assistance_listing.process_assistance_listing(
            delete_but_current_missing, None, opportunity
        )

        validate_assistance_listing(db_session, delete_but_current_missing, expect_in_db=False)
        assert delete_but_current_missing.transformed_at is not None
        assert delete_but_current_missing.transformation_notes == "orphaned_delete_record"
