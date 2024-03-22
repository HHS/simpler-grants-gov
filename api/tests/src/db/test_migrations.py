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


def test_db_setup_via_alembic_migration(
    empty_schema, caplog: pytest.LogCaptureFixture, capsys: pytest.CaptureFixture
):
    """
    All of our tests run using temporary DB schemas. However the alembic
    migrations are generated with the schema hardcoded (eg. "api") and trying to make alembic
    work in a test requires intercepting those function calls to swap in our
    test schema. While this is doable, we'd need to do it for more than a dozen
    functions with varying signatures, which feels too brittle and complex
    to be a valuable test
    """

    caplog.set_level(logging.INFO)
    # Tell Alembic to run all migrations, generating SQL commands for each
    command.upgrade(alembic_cfg, "base:head", sql=True)

    # Verify that the upgrades ran and that at least one specific query is present
    # Alembic just writes to stdout, so capsys captures that.
    assert "Running upgrade" in caplog.text
    assert "CREATE TABLE api.opportunity" in capsys.readouterr().out


def test_db_init_with_migrations(empty_schema):
    # Verify the DB session works after initializing the migrations
    db_session = empty_schema.get_session()
    db_session.close()
