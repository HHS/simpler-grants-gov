import logging
import uuid
from os import path

import _pytest.monkeypatch
import boto3
import flask.testing
import moto
import pytest
from apiflask import APIFlask
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from sqlalchemy import text

import src.adapters.db as db
import src.app as app_entry
import src.auth.login_gov_jwt_auth as login_gov_jwt_auth
import tests.src.db.models.factories as factories
from src.adapters import search
from src.adapters.aws import S3Config
from src.adapters.oauth.login_gov.mock_login_gov_oauth_client import MockLoginGovOauthClient
from src.auth.api_jwt_auth import create_jwt_for_user
from src.constants.schema import Schemas
from src.db import models
from src.db.models.agency_models import Agency
from src.db.models.foreign import metadata as foreign_metadata
from src.db.models.lookup.sync_lookup_values import sync_lookup_values
from src.db.models.opportunity_models import Opportunity
from src.db.models.staging import metadata as staging_metadata
from src.util.local import load_local_env_vars
from tests.lib import db_testing
from tests.lib.auth_test_utils import mock_oauth_endpoint
from tests.lib.db_testing import cascade_delete_from_db_table

logger = logging.getLogger(__name__)


@pytest.fixture
def user(enable_factory_create, db_session):
    return factories.UserFactory.create()


@pytest.fixture
def user_auth_token(user, db_session):
    token, _ = create_jwt_for_user(user, db_session)
    db_session.commit()
    return token


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
def set_logging_defaults(monkeypatch_session):
    # Some loggers are noisy/buggy in our tests, so adjust them
    monkeypatch_session.setenv("LOG_LEVEL_OVERRIDES", "newrelic.core.agent=ERROR")


####################
# Test DB session
####################


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
            models.metadata.create_all(bind=conn)
            staging_metadata.create_all(bind=conn)
            foreign_metadata.create_all(bind=conn)

        sync_lookup_values(db_client)
        yield db_client


@pytest.fixture
def db_session(db_client: db.DBClient) -> db.Session:
    """
    Returns a database session connected to the schema used for the test session.
    """
    with db_client.get_session() as session:
        yield session


@pytest.fixture
def enable_factory_create(monkeypatch, db_session, mock_s3_bucket) -> db.Session:
    """
    Allows the create method of factories to be called. By default, the create
    throws an exception to prevent accidental creation of database objects for tests
    that do not need persistence. This fixture only allows the create method to be
    called for the current test. Each test that needs to call Factory.create should pull in
    this fixture.
    """
    monkeypatch.setattr(factories, "_db_session", db_session)
    return db_session


@pytest.fixture(scope="session")
def db_schema_prefix():
    return f"test_{uuid.uuid4().int}_"


@pytest.fixture(scope="session")
def test_api_schema(db_schema_prefix):
    return f"{db_schema_prefix}{Schemas.API}"


@pytest.fixture(scope="session")
def test_staging_schema(db_schema_prefix):
    return f"{db_schema_prefix}{Schemas.STAGING}"


@pytest.fixture(scope="session")
def test_foreign_schema(db_schema_prefix):
    return f"{db_schema_prefix}{Schemas.LEGACY}"


####################
# Opensearch Fixtures
####################


@pytest.fixture(scope="session")
def search_client() -> search.SearchClient:
    client = search.SearchClient()

    try:
        yield client
    finally:
        # Just in case a test setup an index
        # in a way that didn't clean it up, delete
        # all indexes at the end of a run that start with test
        client.delete_index("test-*")


@pytest.fixture(scope="session")
def search_attachment_pipeline(search_client) -> str:
    pipeline_name = "test-multi-attachment"
    search_client.put_pipeline(
        {
            "description": "Extract attachment information",
            "processors": [
                {
                    "foreach": {
                        "field": "attachments",
                        "processor": {
                            "attachment": {
                                "target_field": "_ingest._value.attachment",
                                "field": "_ingest._value.data",
                            }
                        },
                        "ignore_missing": True,
                    }
                }
            ],
        },
        pipeline_name=pipeline_name,
    )

    return pipeline_name


@pytest.fixture(scope="session")
def opportunity_index(search_client):
    # create a random index name just to make sure it won't ever conflict
    # with an actual one, similar to how we create schemas for database tests
    index_name = f"test-opportunity-index-{uuid.uuid4().int}"

    search_client.create_index(index_name)

    try:
        yield index_name
    finally:
        # Try to clean up the index at the end
        # Use a prefix which will delete the above (if it exists)
        # and any that might not have been cleaned up due to issues
        # in prior runs
        search_client.delete_index("test-opportunity-index-*")


@pytest.fixture(scope="session")
def opportunity_index_alias(search_client, monkeypatch_session):
    # Note we don't actually create anything, this is just a random name
    alias = f"test-opportunity-index-alias-{uuid.uuid4().int}"
    monkeypatch_session.setenv("OPPORTUNITY_SEARCH_INDEX_ALIAS", alias)
    return alias


@pytest.fixture(scope="session")
def agency_index(search_client, monkeypatch_session):
    # create a random index name just to make sure it won't ever conflict
    # with an actual one, similar to how we create schemas for database tests
    index_name = f"test-agency-index-{uuid.uuid4().int}"

    search_client.create_index(index_name)

    try:
        yield index_name
    finally:
        # Try to clean up the index at the end
        # Use a prefix which will delete the above (if it exists)
        # and any that might not have been cleaned up due to issues
        # in prior runs
        search_client.delete_index("test-agency-index-*")


@pytest.fixture(scope="session")
def agency_index_alias(search_client, monkeypatch_session):
    # Note we don't actually create anything, this is just a random name
    alias = f"test-agency-index-alias-{uuid.uuid4().int}"
    monkeypatch_session.setenv("AGENCY_SEARCH_INDEX_ALIAS", alias)
    return alias


def _generate_rsa_key_pair():
    # Rather than define a private/public key, generate one for the tests
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    private_key = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption(),
    )

    public_key = key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM, format=serialization.PublicFormat.SubjectPublicKeyInfo
    )

    return private_key, public_key


@pytest.fixture(scope="session")
def rsa_key_pair():
    return _generate_rsa_key_pair()


@pytest.fixture(scope="session")
def private_rsa_key(rsa_key_pair):
    return rsa_key_pair[0]


@pytest.fixture(scope="session")
def public_rsa_key(rsa_key_pair):
    return rsa_key_pair[1]


@pytest.fixture(scope="session")
def other_rsa_key_pair():
    return _generate_rsa_key_pair()


@pytest.fixture(scope="session")
def mock_oauth_client():
    return MockLoginGovOauthClient()


@pytest.fixture(scope="session")
def setup_login_gov_auth(monkeypatch_session, public_rsa_key):
    """Setup login.gov JWK endpoint to be stubbed out"""

    def override_method(config):
        config.public_key_map = {"test-key-id": public_rsa_key}

    monkeypatch_session.setattr(login_gov_jwt_auth, "_refresh_keys", override_method)


####################
# Test App & Client
####################


# Make app session scoped so the database connection pool is only created once
# for the test session. This speeds up the tests.
@pytest.fixture(scope="session")
def app(
    db_client,
    opportunity_index_alias,
    monkeypatch_session,
    private_rsa_key,
    mock_oauth_client,
    setup_login_gov_auth,
) -> APIFlask:
    # Override the OAuth endpoint path before creating the app which loads the config at startup
    monkeypatch_session.setenv(
        "LOGIN_GOV_AUTH_ENDPOINT", "http://localhost:8080/test-endpoint/oauth-authorize"
    )
    app = app_entry.create_app()

    # Add endpoints and mocks for handling the external OAuth logic
    mock_oauth_endpoint(app, monkeypatch_session, private_rsa_key, mock_oauth_client)

    return app


@pytest.fixture
def client(app: flask.Flask) -> flask.testing.FlaskClient:
    return app.test_client()


@pytest.fixture
def cli_runner(app: flask.Flask) -> flask.testing.CliRunner:
    return app.test_cli_runner()


@pytest.fixture
def all_api_auth_tokens(monkeypatch):
    all_auth_tokens = ["abcd1234", "wxyz7890", "lmno56"]
    monkeypatch.setenv("API_AUTH_TOKEN", ",".join(all_auth_tokens))
    return all_auth_tokens


@pytest.fixture
def api_auth_token(monkeypatch, all_api_auth_tokens):
    auth_token = all_api_auth_tokens[0]
    return auth_token


####################
# AWS Mock Fixtures
####################


@pytest.fixture
def reset_aws_env_vars(monkeypatch):
    # Reset the env vars so you can't accidentally connect
    # to a real AWS account if you were doing some local testing
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "testing")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "testing")
    monkeypatch.setenv("AWS_SECURITY_TOKEN", "testing")
    monkeypatch.setenv("AWS_SESSION_TOKEN", "testing")
    monkeypatch.setenv("AWS_DEFAULT_REGION", "us-east-1")
    monkeypatch.delenv("S3_ENDPOINT_URL")


@pytest.fixture
def mock_s3(reset_aws_env_vars):
    # https://docs.getmoto.org/en/stable/docs/configuration/index.html#whitelist-services
    with moto.mock_aws(config={"core": {"service_whitelist": ["s3"]}}):
        yield boto3.resource("s3")


@pytest.fixture
def mock_s3_bucket_resource(mock_s3):
    bucket = mock_s3.Bucket("local-mock-public-bucket")
    bucket.create()
    yield bucket


@pytest.fixture
def mock_s3_bucket(mock_s3_bucket_resource):
    yield mock_s3_bucket_resource.name


@pytest.fixture
def other_mock_s3_bucket_resource(mock_s3):
    # This second bucket exists for tests where we want there to be multiple buckets
    # and/or test behavior when moving files between buckets.
    bucket = mock_s3.Bucket("local-mock-draft-bucket")
    bucket.create()
    yield bucket


@pytest.fixture
def other_mock_s3_bucket(other_mock_s3_bucket_resource):
    yield other_mock_s3_bucket_resource.name


@pytest.fixture
def s3_config(mock_s3_bucket, other_mock_s3_bucket):
    return S3Config(
        PUBLIC_FILES_BUCKET=f"s3://{mock_s3_bucket}",
        DRAFT_FILES_BUCKET=f"s3://{other_mock_s3_bucket}",
    )


####################
# Class-based testing
####################


class BaseTestClass:
    """
    A base class to derive a test class from. This lets
    us have a set of fixtures with a scope greater than
    an individual test, but that need to be more granular than
    session scoping.

    Useful for avoiding repetition in setup of tests which
    can be clearer or provide better performance.

    See: https://docs.pytest.org/en/7.1.x/how-to/fixtures.html#fixture-scopes

    For example:

    class TestExampleClass(BaseTestClass):

        @pytest.fixture(scope="class")
        def setup_data(db_session):
            # note that the db_session here would be the one created in this class
            # as it will pull from the class scope instead

            examples = ExampleFactory.create_batch(size=100)
    """

    @pytest.fixture(scope="class")
    def db_session(self, db_client, monkeypatch_class):
        # Note this shadows the db_session fixture for tests in this class
        with db_client.get_session() as db_session:
            yield db_session

    @pytest.fixture(scope="class")
    def enable_factory_create(self, monkeypatch_class, db_session):
        """
        Allows the create method of factories to be called. By default, the create
            throws an exception to prevent accidental creation of database objects for tests
            that do not need persistence. This fixture only allows the create method to be
            called for the current class of tests. Each test that needs to call Factory.create should pull in
            this fixture.
        """
        monkeypatch_class.setattr(factories, "_db_session", db_session)

    @pytest.fixture(scope="class")
    def truncate_opportunities(self, db_session):
        """
        Use this fixture when you want to truncate the opportunity table
        and handle deleting all related records.

        As this is at the class scope, this will only run once for a given
        class implementation.
        """
        cascade_delete_from_db_table(db_session, Opportunity)

    @pytest.fixture(scope="class")
    def truncate_agencies(self, db_session):
        cascade_delete_from_db_table(db_session, Agency)

    @pytest.fixture(scope="class")
    def truncate_staging_tables(self, db_session, test_staging_schema):
        for table in staging_metadata.tables.values():
            db_session.execute(text(f"TRUNCATE TABLE {test_staging_schema}.{table.name}"))

        db_session.commit()

    @pytest.fixture(scope="class")
    def truncate_foreign_tables(self, db_session, test_foreign_schema):
        for table in foreign_metadata.tables.values():
            db_session.execute(text(f"TRUNCATE TABLE {test_foreign_schema}.{table.name}"))

        db_session.commit()


###################
# File fixtures
###################

FILE_FIXTURE_DIR = path.join(path.dirname(__file__), ".", "fixtures")


@pytest.fixture
def fixture_from_file():
    """
    Fixture to read a fixture file content based given a file path relative to
     the tests/fixtures/ directory.

    Example:
    def test_foo(fixture_from_file):
        mock_data = fixture_from_file("/fix/data.json")
    """

    def _file_reader(file_path: str):
        full_file_path = path.join(FILE_FIXTURE_DIR, file_path.lstrip("/"))
        with open(full_file_path, "r") as f:
            return f.read()

    return _file_reader


@pytest.fixture
def fixture_file_path():
    def _get_fixture_file_path(fixture_path_relative_to_fixture_dir: str) -> str:
        return path.join(FILE_FIXTURE_DIR, fixture_path_relative_to_fixture_dir.lstrip("/"))

    return _get_fixture_file_path
