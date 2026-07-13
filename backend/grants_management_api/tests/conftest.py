import uuid

import _pytest.monkeypatch
import boto3
import flask
import grants_shared.auth.login_gov_jwt_auth as login_gov_jwt_auth
import moto
import pytest
from apiflask import APIFlask
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from grants_shared.adapters import db
from grants_shared.adapters.oauth.login_gov.mock_login_gov_oauth_client import (
    MockLoginGovOauthClient,
)
from grants_shared.util.local import load_local_env_vars

import src.app as app_entry
import tests.db.models.factories as factories
from src.db import models
from src.db.models.lookup.sync_lookup_values import sync_lookup_values
from tests.test_utils import db_testing
from tests.test_utils.auth_test_utils import mock_oauth_endpoint

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
            models.metadata.create_all(bind=conn)

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


####################
# Auth/Login
####################


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
    monkeypatch_session,
    private_rsa_key,
    mock_oauth_client,
    setup_login_gov_auth,
) -> APIFlask:
    # Override the OAuth endpoint path before creating the app which loads the config at startup
    monkeypatch_session.setenv(
        "LOGIN_GOV_AUTH_ENDPOINT", "http://localhost:8089/test-endpoint/oauth-authorize"
    )
    monkeypatch_session.setenv(
        "LOGIN_FINAL_DESTINATION", "http://localhost:8089/v1/users/login/result"
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
    monkeypatch.delenv("AWS_S3_ENDPOINT_URL", raising=False)
    monkeypatch.delenv("AWS_SQS_ENDPOINT_URL", raising=False)
    monkeypatch.delenv("AWS_DYNAMODB_ENDPOINT_URL", raising=False)
    monkeypatch.delenv("CDN_URL", raising=False)
    monkeypatch.setattr("grants_shared.adapters.aws.aws_session._aws_config", None)


@pytest.fixture
def mock_s3(reset_aws_env_vars):
    # https://docs.getmoto.org/en/stable/docs/configuration/index.html#whitelist-services
    with moto.mock_aws(config={"core": {"service_whitelist": ["s3"]}}):
        yield boto3.resource("s3")


@pytest.fixture
def mock_s3_bucket_resource(mock_s3):
    bucket = mock_s3.Bucket("local-mock-public-bucket")
    bucket.create()
    return bucket


@pytest.fixture
def mock_s3_bucket(mock_s3_bucket_resource):
    return mock_s3_bucket_resource.name
