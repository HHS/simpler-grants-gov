import uuid
import src.app as app_entry
import flask
import pytest
import _pytest.monkeypatch
from apiflask import APIFlask
from grants_shared.adapters import db

from grants_shared.util.local import load_local_env_vars
from tests.test_utils import db_testing


####################
# General test setup/utils
####################

@pytest.fixture(scope="session", autouse=True)
def env_vars():
    """
    Default environment variables for tests to be
    based on the local.env file. These get set once
    before all tests run. As "session" is the highest
    scope, this will run before any other explicit fixtures
    in a test.

    See: https://docs.pytest.org/en/6.2.x/fixture.html#autouse-order

    To set a different environment variable for a test,
    use the monkeypatch fixture, for example:

    ```py
    def test_example(monkeypatch):
        monkeypatch.setenv("LOG_LEVEL", "debug")
    ```

    Several monkeypatch fixtures exists below for different
    scope levels.
    """
    load_local_env_vars()


@pytest.fixture(scope="session", autouse=True)
def set_env_var_defaults(monkeypatch_session):
    """Set env vars to default values for unit tests

    While many of our env vars have defaults defined in local.env
    these are ones that developers frequently override for local development
    in override.env which can interfere with unit tests. To avoid
    that issue, we re-set them here so tests don't fail that depend on the defaults.
    """
    # For local dev, it's convenient to override this to a higher value, but our tests
    # assume the default configured value of 30 minutes
    monkeypatch_session.setenv("API_JWT_TOKEN_EXPIRATION_MINUTES", "30")
    # Some loggers are noisy/buggy in our tests, so adjust them
    monkeypatch_session.setenv("LOG_LEVEL_OVERRIDES", "newrelic.core.agent=ERROR")

    # We will set this to false so we skip logs during unit tests and keep enabled during dev.
    monkeypatch_session.setenv("SOAP_ENABLE_VERBOSE_LOGGING", "0")

    # Stops the local file-scan watcher from spawning a thread per app fixture.
    monkeypatch_session.setenv("ENABLE_LOCAL_FILE_SCANNER", "FALSE")



# From https://github.com/pytest-dev/pytest/issues/363
@pytest.fixture(scope="session")
def monkeypatch_session():
    """
    Create a monkeypatch instance that can be used to
    monkeypatch global environment, objects, and attributes
    for the duration the test session.
    """
    mpatch = _pytest.monkeypatch.MonkeyPatch()
    yield mpatch
    mpatch.undo()

# From https://github.com/pytest-dev/pytest/issues/363
@pytest.fixture(scope="class")
def monkeypatch_class():
    """
    Create a monkeypatch instance that can be used to
    monkeypatch global environment, objects, and attributes
    for the duration of a test class.
    """
    mpatch = _pytest.monkeypatch.MonkeyPatch()
    yield mpatch
    mpatch.undo()


# From https://github.com/pytest-dev/pytest/issues/363
@pytest.fixture(scope="module")
def monkeypatch_module():
    mpatch = _pytest.monkeypatch.MonkeyPatch()
    yield mpatch
    mpatch.undo()

####################
# Database
####################

@pytest.fixture(scope="session")
def db_schema_prefix():
    return f"test_{uuid.uuid4().int}_"

@pytest.fixture(scope="session")
def db_client(monkeypatch_session, db_schema_prefix) -> db.DBClient:
    """
    Creates an isolated database for the test session.

    Creates a new empty PostgreSQL schema, creates all tables in the new schema
    using SQLAlchemy, then returns a db.DBClient instance that can be used to
    get connections or sessions to this database schema. The schema is dropped
    after the test suite session completes.
    """

    with db_testing.create_isolated_db(monkeypatch_session, db_schema_prefix) as db_client:
        with db_client.get_connection() as conn, conn.begin():
            # TODO
            # models.metadata.create_all(bind=conn)
            # staging_metadata.create_all(bind=conn)
            # foreign_metadata.create_all(bind=conn)
            pass

        # TODO
        # sync_lookup_values(db_client)
        yield db_client


####################
# Test App & Client
####################

# Make app session scoped so the database connection pool is only created once
# for the test session. This speeds up the tests.
@pytest.fixture(scope="session")
def app(
    db_client,
    monkeypatch_session,
) -> APIFlask:
    # TODO - when we add auth, need to add connections here and mock out oauth
    app = app_entry.create_app()

    return app


@pytest.fixture
def client(app: flask.Flask) -> flask.testing.FlaskClient:
    return app.test_client()