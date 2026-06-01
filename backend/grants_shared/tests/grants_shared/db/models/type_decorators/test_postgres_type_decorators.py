from enum import StrEnum

import pytest
from sqlalchemy import select, text

from grants_shared.adapters.db.type_decorators.postgres_type_decorators import LookupColumn
from tests.grants_shared.db.models.factories import ExampleTableFactory, FriendTableFactory

from tests.grants_shared.db_test_models.db_test_models import (
    ExampleTable,
    ExampleType,
    LkExampleType, FriendType,
)


@pytest.mark.parametrize(
    "example_type,db_value",
    [(ExampleType.ANECDOTE, 2), (ExampleType.CASE_STUDY, 3), (None, None)],
)
def test_lookup_column_conversion(
    db_session, enable_factory_create, example_type, db_value, db_schema_prefix
):
    # Verify column works with factories
    example = ExampleTableFactory.create(example_type=example_type)
    assert example.example_type == example_type

    # Verify fetching from the DB works
    db_session.expire_all()

    example_db = db_session.execute(
        select(ExampleTable).where(ExampleTable.example_id == example.example_id)
    ).scalar_one_or_none()
    assert example_db.example_type == example_type

    # Verify what we stored in the DB is the integer
    raw_db_value = db_session.execute(
        text(
            f"select example_type_id from {db_schema_prefix}grants_shared.{ExampleTable.get_table_name()} where example_id='{example.example_id}'"  # nosec
        )
    ).scalar()
    assert raw_db_value == db_value

def test_lookup_column_conversion_through_association_proxy(db_session, enable_factory_create):
    """Test that we can use an association proxy with the lookup values to make them act like a simple python set"""

    friend = FriendTableFactory.create(friend_types=[FriendType.BEST, FriendType.ACQUAINTANCE])

    assert friend.friend_types == {FriendType.BEST, FriendType.ACQUAINTANCE}


def test_lookup_column_bind_type_invalid():
    lookup_column = LookupColumn(LkExampleType)
    with pytest.raises(Exception, match="Cannot convert value of type"):
        lookup_column.process_bind_param("hello", None)

    class TestEnum(StrEnum):
        ABSTRACT = "abstract"

    # Verify that just because an enum looks similar, if it's a different
    # type it will also error
    with pytest.raises(Exception, match="Cannot convert value of type"):
        lookup_column.process_bind_param(TestEnum.ABSTRACT, None)


def test_lookup_column_process_result_type_invalid():
    lookup_column = LookupColumn(LkExampleType)
    with pytest.raises(Exception, match="Cannot process value from DB of type"):
        lookup_column.process_result_value("hello", None)
