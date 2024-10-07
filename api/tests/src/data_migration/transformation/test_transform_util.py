from datetime import datetime

import pytest
from freezegun import freeze_time

from src.constants.lookup_constants import OpportunityCategory
from src.data_migration.transformation import transform_util
from tests.src.db.models.factories import OpportunityFactory, StagingTopportunityFactory


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
    assert transform_util.transform_opportunity_category(value) == expected_value


@pytest.mark.parametrize("value", ["A", "B", "mandatory", "other", "hello"])
def test_transform_opportunity_category_unexpected_value(value):
    with pytest.raises(ValueError, match="Unrecognized opportunity category"):
        transform_util.transform_opportunity_category(value)


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

    transform_util.transform_update_create_timestamp(source, destination)

    assert destination.created_at == datetime.fromisoformat(expected_created_at)
    assert destination.updated_at == datetime.fromisoformat(expected_updated_at)


@pytest.mark.parametrize(
    "value,expected_value",
    [
        ("Y", True),
        ("N", False),
        ("Yes", True),
        ("No", False),
        ("Y", True),
        ("n", False),
        ("yes", True),
        ("no", False),
        ("", None),
        (None, None),
    ],
)
def test_convert_yn_boolean(value, expected_value):
    assert transform_util.convert_yn_bool(value) == expected_value


@pytest.mark.parametrize("value", ["X", "Z", "1", "0", "yEs", "nO"])
def test_convert_yn_boolean_unexpected_value(value):
    with pytest.raises(ValueError, match="Unexpected Y/N bool value"):
        transform_util.convert_yn_bool(value)


@pytest.mark.parametrize(
    "value,expected_value", [("D", True), ("U", False), ("", False), (None, False)]
)
def test_convert_action_type_to_is_deleted(value, expected_value):
    assert transform_util.convert_action_type_to_is_deleted(value) == expected_value


@pytest.mark.parametrize("value", ["A", "B", "d", "u"])
def test_convert_action_type_to_is_deleted_unexpected_value(value):
    with pytest.raises(ValueError, match="Unexpected action type value"):
        transform_util.convert_action_type_to_is_deleted(value)


@pytest.mark.parametrize(
    "value,expected_value",
    [
        ("1", 1),
        ("0", 0),
        ("123123123", 123123123),
        ("-5", -5),
        ("", None),
        (None, None),
        ("words", None),
        ("zero", None),
        ("n/a", None),
    ],
)
def test_convert_numeric_str_to_int(value, expected_value):
    assert transform_util.convert_numeric_str_to_int(value) == expected_value
