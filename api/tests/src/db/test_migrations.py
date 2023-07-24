import logging  # noqa: B1

import alembic.command as command
import pytest
from alembic.script import ScriptDirectory
from alembic.script.revision import MultipleHeads
from alembic.util.exc import CommandError

import src.adapters.db as db
from src.db.migrations.run import alembic_cfg
from tests.lib import db_testing


@pytest.fixture
def empty_schema(monkeypatch) -> db.DBClient:
    """
    Create a test schema, if it doesn't already exist, and drop it after the
    test completes.

    This is similar to what the db_client fixture does but does not create any tables in the
    schema.
    """
    with db_testing.create_isolated_db(monkeypatch) as db_client:
        yield db_client


def test_only_single_head_revision_in_migrations():
    script = ScriptDirectory.from_config(alembic_cfg)

    try:
        # This will raise if there are multiple heads
        script.get_current_head()
        multihead_situation = False
    except CommandError as e:
        # re-raise anything not expected
        if not isinstance(e.__cause__, MultipleHeads):
            raise

        multihead_situation = True

    # raising assertion error here instead of in `except` block to avoid pytest
    # printing the huge stacktrace of the multi-head exception, which in this
    # case we don't really care about the details, just using it as a flag
    if multihead_situation:
        raise AssertionError(
            "Multi-head migration issue: run `make db-migrate-merge-heads` to resolve"
        )


def test_db_setup_via_alembic_migration(empty_schema, caplog: pytest.LogCaptureFixture):
    caplog.set_level(logging.INFO)  # noqa: B1
    command.upgrade(alembic_cfg, "head")
    # Verify the migration ran by checking the logs
    assert "Running upgrade" in caplog.text


def test_db_init_with_migrations(empty_schema):
    # Verify the DB session works after initializing the migrations
    db_session = empty_schema.get_session()
    db_session.close()
