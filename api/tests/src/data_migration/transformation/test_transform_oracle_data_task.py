from typing import Tuple

import pytest

from src.constants.lookup_constants import OpportunityCategory
from src.data_migration.transformation.transform_oracle_data_task import TransformOracleDataTask, transform_opportunity_category
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


def validate_matching_fields(
    source, destination, fields: list[Tuple[str, str]], expect_all_to_match: bool
):
    mismatched_fields = []

    for source_field, destination_field in fields:
        source_value = getattr(source, source_field)
        destination_value = getattr(destination, destination_field)
        if source_value != destination_value:
            mismatched_fields.append(
                f"{source_field}/{destination_field}: '{source_value}' != '{destination_value}'"
            )

    # If a values weren't copied in an update
    # then we should expect most things to not match,
    # but randomness in the factories might cause some overlap
    if expect_all_to_match:
        assert (
            len(mismatched_fields) == 0
        ), f"Expected all fields to match between {source.__class__} and {destination.__class__}, but found mismatched fields: {','.join(mismatched_fields)}"
    else:
        assert (
            len(mismatched_fields) != 0
        ), f"Did not expect all fields to match between {source.__class__} and {destination.__class__}, but they did which means an unexpected update occurred"


def validate_create_update_timestamps():
    pass

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

        # For fields that we expect to match 1:1, verify that they match as expected
        validate_matching_fields(
            source_opportunity,
            opportunity,
            [
                ("oppnumber", "opportunity_number"),
                ("opptitle", "opportunity_title"),
                ("owningagency", "agency"),
                ("category_explanation", "category_explanation"),
                ("revision_number", "revision_number"),
                ("modified_comments", "modified_comments"),
                ("publisheruid", "publisher_user_id"),
                ("publisher_profile_id", "publisher_profile_id"),
            ],
            expect_values_to_match,
        )

        # TODO - updated_at/created_at
        if expect_values_to_match:
            # Deliberately doing this in a more direct manner
            if source_opportunity.is_draft == "N":
                assert opportunity.is_draft is False
            else:
                assert opportunity.is_draft is True
        else:
            pass

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
        # Verify an error is raised when we try to delete something that doesn't exist
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


@pytest.mark.parametrize("value,expected_value", [
    # Just check a few
    ("D", OpportunityCategory.DISCRETIONARY),
    ("M", OpportunityCategory.MANDATORY),
    ("O", OpportunityCategory.OTHER),
    (None, None),
    ("", None)
])
def test_transform_opportunity_category(value, expected_value):
    assert transform_opportunity_category(value) == expected_value

@pytest.mark.parametrize("value", ["A", "B", "mandatory", "other", "hello"])
def test_transform_opportunity_category_unexpected_value(value):
    with pytest.raises(ValueError, match="Unrecognized opportunity category"):
        transform_opportunity_category(value)
    pass