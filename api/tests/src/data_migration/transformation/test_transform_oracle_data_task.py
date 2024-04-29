from datetime import datetime
from typing import Tuple

import pytest
from freezegun import freeze_time

from src.constants.lookup_constants import OpportunityCategory
from src.data_migration.transformation.transform_oracle_data_task import (
    TransformOracleDataTask,
    transform_opportunity_category,
    transform_update_create_timestamp,
)
from src.db.models.opportunity_models import Opportunity
from src.db.models.staging.opportunity import Topportunity
from tests.conftest import BaseTestClass
from tests.src.db.models.factories import OpportunityFactory, StagingTopportunityFactory


def setup_opportunity(
    create_existing: bool,
    is_delete: bool = False,
    is_already_processed: bool = False,
    source_values: dict | None = None,
    all_fields_null: bool = False,
) -> Topportunity:
    if source_values is None:
        source_values = {}

    source_opportunity = StagingTopportunityFactory.create(
        **source_values,
        is_deleted=is_delete,
        already_transformed=is_already_processed,
        all_fields_null=all_fields_null,
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

        # Validation of fields that aren't copied exactly
        if expect_values_to_match:
            # Deliberately validating is_draft with a different calculation
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
        ordinary_delete = setup_opportunity(
            create_existing=True, is_delete=True, all_fields_null=True
        )
        ordinary_delete2 = setup_opportunity(
            create_existing=True, is_delete=True, all_fields_null=False
        )
        delete_but_current_missing = setup_opportunity(
            create_existing=False, is_delete=True
        )  # TODO - probably should verify it logged error

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

        transform_oracle_data_task.process_opportunities()

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

        metrics = transform_oracle_data_task.metrics
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_PROCESSED] == 11
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_DELETED] == 2
        # Note this insert counts the case where the category fails
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_INSERTED] == 3
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_UPDATED] == 4
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_ERROR_COUNT] == 2

        # Rerunning does mostly nothing, it will attempt to re-process the two that errored
        # but otherwise won't find anything else
        transform_oracle_data_task.process_opportunities()
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_PROCESSED] == 13
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_DELETED] == 2
        # Note this insert counts the case where the category fails
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_INSERTED] == 3
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_RECORDS_UPDATED] == 4
        assert metrics[transform_oracle_data_task.Metrics.TOTAL_ERROR_COUNT] == 4

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


@pytest.mark.parametrize(
    "value,expected_value",
    [
        # Just check a few
        ("D", OpportunityCategory.DISCRETIONARY),
        ("M", OpportunityCategory.MANDATORY),
        ("O", OpportunityCategory.OTHER),
        (None, None),
        ("", None),
    ],
)
def test_transform_opportunity_category(value, expected_value):
    assert transform_opportunity_category(value) == expected_value


@pytest.mark.parametrize("value", ["A", "B", "mandatory", "other", "hello"])
def test_transform_opportunity_category_unexpected_value(value):
    with pytest.raises(ValueError, match="Unrecognized opportunity category"):
        transform_opportunity_category(value)


@pytest.mark.parametrize(
    "created_date,last_upd_date,expected_created_at,expected_updated_at",
    [
        ### Using string timestamps rather than defining the dates directly for readability
        # A few happy scenarios
        (
            "2020-01-01T12:00:00",
            "2020-06-01T12:00:00",
            "2020-01-01T17:00:00+00:00",
            "2020-06-01T16:00:00+00:00",
        ),
        (
            "2021-01-31T21:30:15",
            "2021-12-31T23:59:59",
            "2021-02-01T02:30:15+00:00",
            "2022-01-01T04:59:59+00:00",
        ),
        # Leap year handling
        (
            "2024-02-28T23:00:59",
            "2024-02-29T19:10:10",
            "2024-02-29T04:00:59+00:00",
            "2024-03-01T00:10:10+00:00",
        ),
        # last_upd_date is None, created_date is used for both
        ("2020-05-31T16:32:08", None, "2020-05-31T20:32:08+00:00", "2020-05-31T20:32:08+00:00"),
        ("2020-07-15T20:00:00", None, "2020-07-16T00:00:00+00:00", "2020-07-16T00:00:00+00:00"),
        # both input values are None, the current time is used (which we set for the purposes of this test below)
        (None, None, "2023-05-10T12:00:00+00:00", "2023-05-10T12:00:00+00:00"),
    ],
)
@freeze_time("2023-05-10 12:00:00", tz_offset=0)
def test_transform_update_create_timestamp(
    created_date, last_upd_date, expected_created_at, expected_updated_at
):
    created_datetime = datetime.fromisoformat(created_date) if created_date is not None else None
    last_upd_datetime = datetime.fromisoformat(last_upd_date) if last_upd_date is not None else None

    source = StagingTopportunityFactory.build(
        created_date=created_datetime, last_upd_date=last_upd_datetime
    )
    destination = OpportunityFactory.build()

    transform_update_create_timestamp(source, destination)

    assert destination.created_at == datetime.fromisoformat(expected_created_at)
    assert destination.updated_at == datetime.fromisoformat(expected_updated_at)
