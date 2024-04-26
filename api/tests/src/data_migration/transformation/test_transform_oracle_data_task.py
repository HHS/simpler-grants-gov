from typing import Tuple

import pytest

from src.data_migration.transformation.transform_oracle_data_task import TransformOracleDataTask
from src.db.models.opportunity_models import Opportunity
from src.db.models.staging.opportunity import Topportunity
from tests.conftest import BaseTestClass
from tests.src.db.models.factories import OpportunityFactory, StagingTopportunityFactory


def setup_opportunity(
    create_existing: bool,
    is_delete: bool = False,
    is_already_processed: bool = False,
    source_values: dict | None = None,
) -> Topportunity:
    if source_values is None:
        source_values = {}

    source_opportunity = StagingTopportunityFactory.create(
        **source_values,
        is_deleted=is_delete,
        already_transformed=is_already_processed,
    )

    if create_existing:
        OpportunityFactory.create(
            opportunity_id=source_opportunity.opportunity_id,
            # set created_at/updated_at to an earlier time so its clear
            # when they were last updated
            timestamps_in_past=True,
        )

    return source_opportunity


def validate_opportunity(
    db_session,
    source_opportunity: Topportunity,
    expect_in_db: bool = True,
    expect_values_to_match: bool = True,
):
    opportunity = (
        db_session.query(Opportunity)
        .filter(Opportunity.opportunity_id == source_opportunity.opportunity_id)
        .one_or_none()
    )

    if expect_in_db:
        assert opportunity is not None

        # TODO - check created/updated at
        # assert opportunity.created_at > datetime.utcnow()

        # TODO - there's gotta be a better way to do this compare
        # just check a few basic fields as matching or not
        # these are only on fields that can't generate the same
        # based on how our factories work for the fields
        if expect_values_to_match:
            assert opportunity.opportunity_title == source_opportunity.opptitle
            assert opportunity.opportunity_number == source_opportunity.oppnumber
        else:
            assert opportunity.opportunity_title != source_opportunity.opptitle
            assert opportunity.opportunity_number != source_opportunity.oppnumber
    else:
        assert opportunity is None


class TestTransformOracleDataTask(BaseTestClass):
    @pytest.fixture()
    def transform_oracle_data_task(
        self, db_session, enable_factory_create, truncate_opportunities
    ) -> TransformOracleDataTask:
        return TransformOracleDataTask(db_session)

    def test_process_opportunities(self, db_session, transform_oracle_data_task):
        ordinary_delete = setup_opportunity(create_existing=True, is_delete=True)
        delete_but_current_missing = setup_opportunity(
            create_existing=False, is_delete=True
        )  # TODO - probably should verify it logged error

        basic_insert = setup_opportunity(create_existing=False)
        basic_update = setup_opportunity(create_existing=True)

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

        transform_oracle_data_task.process_opportunities()

        validate_opportunity(db_session, ordinary_delete, expect_in_db=False)
        validate_opportunity(db_session, delete_but_current_missing, expect_in_db=False)

        validate_opportunity(db_session, basic_insert)
        validate_opportunity(db_session, basic_update)

        validate_opportunity(db_session, already_processed_insert, expect_in_db=False)
        validate_opportunity(db_session, already_processed_update, expect_values_to_match=False)

        validate_opportunity(db_session, insert_that_will_fail, expect_in_db=False)

        # Rerunning won't do anything
        # TODO

        # TODO - check metrics

    def test_process_opportunity_delete_but_current_missing(
        self, db_session, transform_oracle_data_task
    ):
        # Verify an error is raised when we try to delete
        delete_but_current_missing = setup_opportunity(create_existing=False, is_delete=True)

        with pytest.raises(ValueError, match="Cannot delete opportunity as it does not exist"):
            transform_oracle_data_task.process_opportunity(delete_but_current_missing, None)

        validate_opportunity(db_session, delete_but_current_missing, expect_in_db=False)

    def test_process_opportunity_invalid_category(self, db_session, transform_oracle_data_task):
        # This will error in the transform as that isn't a category we have configured
        insert_that_will_fail = setup_opportunity(
            create_existing=False, source_values={"oppcategory": "X"}
        )

        with pytest.raises(ValueError, match="Unrecognized opportunity category"):
            transform_oracle_data_task.process_opportunity(insert_that_will_fail, None)

        validate_opportunity(db_session, insert_that_will_fail, expect_in_db=False)
