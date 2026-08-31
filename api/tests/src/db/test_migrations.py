import logging
import uuid
from unittest.mock import Mock

import alembic.command as command
import grants_shared.adapters.db as db
import pytest
import sqlalchemy
from alembic.script import ScriptDirectory
from alembic.script.revision import MultipleHeads
from alembic.util.exc import CommandError

from src.db.migrations.run import (
    alembic_cfg,
    collapse_sql,
    enable_query_error_logging,
    log_migration_sql_error,
)
from tests.lib import db_testing


@pytest.fixture
def empty_schema(monkeypatch) -> db.DBClient:
    """
    Create a test schema, if it doesn't already exist, and drop it after the
    test completes.

    This is similar to what the db_client fixture does but does not create any tables in the
    schema.
    """
    with db_testing.create_isolated_db(
        monkeypatch, f"test_migrations_{uuid.uuid4().int}_"
    ) as db_client:
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


@pytest.fixture
def query_error_logging():
    """Register the migration error logging listener, and clean it up afterwards.

    The listener attaches to the Engine class itself, so it'd otherwise
    stay registered for every test that runs after this one.
    """
    enable_query_error_logging()
    yield
    sqlalchemy.event.remove(sqlalchemy.engine.Engine, "handle_error", log_migration_sql_error)


@pytest.mark.parametrize(
    "statement,expected",
    [
        ("SELECT 1", "SELECT 1"),
        (
            "CREATE TABLE api.example (\n\texample_id UUID NOT NULL, \n\tname TEXT\n)\n\n",
            "CREATE TABLE api.example ( example_id UUID NOT NULL, name TEXT )",
        ),
    ],
)
def test_collapse_sql(statement, expected):
    assert collapse_sql(statement) == expected


def test_successful_migration_sql_not_logged(
    empty_schema, query_error_logging, caplog: pytest.LogCaptureFixture
):
    caplog.set_level(logging.DEBUG)

    db_session = empty_schema.get_session()
    db_session.execute(sqlalchemy.text("CREATE TABLE example (\n\texample_id INT\n)"))
    db_session.close()

    assert not [record for record in caplog.records if hasattr(record, "migrate.sql")]


def test_failing_migration_sql_logged_at_error(
    empty_schema, query_error_logging, caplog: pytest.LogCaptureFixture
):
    caplog.set_level(logging.INFO)

    db_session = empty_schema.get_session()
    with pytest.raises(sqlalchemy.exc.ProgrammingError):
        db_session.execute(sqlalchemy.text("CREATE TABLE example (\n\tbad_column NOT_A_TYPE\n)"))
    db_session.close()

    error_records = [record for record in caplog.records if record.levelno == logging.ERROR]
    assert [getattr(record, "migrate.sql") for record in error_records] == [
        "CREATE TABLE example ( bad_column NOT_A_TYPE )"
    ]


def test_failing_connection_without_statement_not_logged(caplog: pytest.LogCaptureFixture):
    """Errors that aren't tied to a statement (eg. failing to connect) have nothing to log."""
    caplog.set_level(logging.INFO)

    log_migration_sql_error(Mock(spec=sqlalchemy.ExceptionContext, statement=None))

    assert not caplog.records
