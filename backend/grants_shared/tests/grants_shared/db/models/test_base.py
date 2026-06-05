import uuid

from tests.grants_shared.db_test_models.db_test_models import ExampleTable, ExampleType, FriendTable


def test_get_table_name():
    assert ExampleTable.get_table_name() == "example"
    assert FriendTable.get_table_name() == "friend"


def test_for_json_example():

    example = ExampleTable(
        example_id=uuid.UUID("41fe3ffe-b211-415c-8f35-2250462e791d"), description="my description"
    )

    assert example.for_json() == {
        "example_id": "41fe3ffe-b211-415c-8f35-2250462e791d",
        "description": "my description",
        "my_count": None,
        "example_type": None,
        # Haven't flushed to DB yet, these aren't set
        "created_at": None,
        "updated_at": None,
    }

    example.my_count = 5
    example.description = "something else"
    example.example_type = ExampleType.ANECDOTE

    assert example.for_json() == {
        "example_id": "41fe3ffe-b211-415c-8f35-2250462e791d",
        "description": "something else",
        "my_count": 5,
        "example_type": ExampleType.ANECDOTE,
        # Haven't flushed to DB yet, these aren't set
        "created_at": None,
        "updated_at": None,
    }

    assert (
        repr(example)
        == "<ExampleTable(example_id='41fe3ffe-b211-415c-8f35-2250462e791d',description='something else',my_count=5,example_type=<ExampleType.ANECDOTE: 'anecdote'>,created_at=None,updated_at=None)"
    )


def test_db_models(db_session):
    """Sanity test that our DB models work that we use for testing / the DB setup works."""

    with db_session.begin():
        example = ExampleTable(description="a description")
        db_session.add(example)

        friend = FriendTable(best_example=example)
        db_session.add(friend)

    db_session.refresh(example)
    assert example.example_id is not None
    assert example.created_at is not None
    assert example.updated_at == example.created_at

    db_session.refresh(friend)
    assert friend.friend_id is not None
    assert friend.best_example is example
