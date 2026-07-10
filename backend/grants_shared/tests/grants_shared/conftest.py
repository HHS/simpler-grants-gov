import os
import uuid

import _pytest.monkeypatch
import boto3
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from moto import mock_aws

import tests.grants_shared.db.models.factories as factories
from grants_shared.adapters import db
from grants_shared.adapters.aws import S3Config
from grants_shared.auth.login_gov_jwt_auth import LoginGovConfig
from grants_shared.db.models.base import metadata
from grants_shared.db.models.lookup import sync_lookup_values
from grants_shared.util.local import load_local_env_vars
from tests.grants_shared.test_utils import db_testing

# We import the test models we created so they're attached to the metadata
# and we can create them below in the db_client fixture
import tests.grants_shared.db_test_models.db_test_models  # noqa: F401 isort:skip


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


#################
# Monkeypatch
#################


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


#################
# Database Setup
#################


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
            metadata.create_all(bind=conn)

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
def enable_factory_create(monkeypatch, db_session) -> db.Session:
    """
    Allows the create method of factories to be called. By default, the create
    throws an exception to prevent accidental creation of database objects for tests
    that do not need persistence. This fixture only allows the create method to be
    called for the current test. Each test that needs to call Factory.create should pull in
    this fixture.
    """
    monkeypatch.setattr(factories, "_db_session", db_session)
    return db_session


#################
# AWS Mocking
#################


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
    with mock_aws(config={"core": {"service_whitelist": ["s3"]}}):
        yield boto3.resource("s3")


@pytest.fixture
def mock_s3_bucket_resource(mock_s3):
    bucket = mock_s3.Bucket("local-mock-public-bucket")
    bucket.create()
    return bucket


@pytest.fixture
def mock_s3_bucket(mock_s3_bucket_resource):
    return mock_s3_bucket_resource.name


@pytest.fixture
def other_mock_s3_bucket_resource(mock_s3):
    # This second bucket exists for tests where we want there to be multiple buckets
    # and/or test behavior when moving files between buckets.
    bucket = mock_s3.Bucket("local-mock-draft-bucket")
    bucket.create()
    return bucket


@pytest.fixture
def other_mock_s3_bucket(other_mock_s3_bucket_resource):
    return other_mock_s3_bucket_resource.name


@pytest.fixture
def mock_file_scan_s3_bucket_resource(mock_s3):
    bucket = mock_s3.Bucket("local-mock-file-scan-bucket")
    bucket.create()
    return bucket


@pytest.fixture
def mock_file_scan_s3_bucket(mock_file_scan_s3_bucket_resource):
    return mock_file_scan_s3_bucket_resource.name


@pytest.fixture
def s3_config(mock_s3_bucket, other_mock_s3_bucket, mock_file_scan_s3_bucket):
    return S3Config(
        PUBLIC_FILES_BUCKET=f"s3://{mock_s3_bucket}",
        DRAFT_FILES_BUCKET=f"s3://{other_mock_s3_bucket}",
        FILE_SCAN_BUCKET=f"s3://{mock_file_scan_s3_bucket}",
    )


@pytest.fixture
def ses_client(monkeypatch, reset_aws_env_vars):
    """
    Create a mocked SESv2 client using moto. The mock is automatically cleaned up after the test.

    We call reset_aws_env_vars so that the aws_config gets remade for test that uses this
    as we need the aws_config to be fresh.
    """
    monkeypatch.setenv("IS_LOCAL_AWS", "0")

    with mock_aws():
        ses_client = boto3.client("sesv2", region_name="us-east-1")
        ses_client.create_email_identity(EmailIdentity=os.getenv("AWS_SES_FROM_EMAIL"))
        yield ses_client


@pytest.fixture
def mock_dynamodb(reset_aws_env_vars):
    with mock_aws(config={"core": {"service_whitelist": ["dynamodb"]}}):
        yield


@pytest.fixture
def file_scan_dynamodb_table(mock_dynamodb, monkeypatch):
    dynamodb = boto3.client("dynamodb", region_name="us-east-1")
    table_name = "test-local-virus-scan"
    dynamodb.create_table(
        TableName=table_name,
        KeySchema=[
            {"AttributeName": "file_id", "KeyType": "HASH"},
        ],
        AttributeDefinitions=[
            {"AttributeName": "file_id", "AttributeType": "S"},
        ],
        BillingMode="PAY_PER_REQUEST",
    )
    monkeypatch.setenv("FILE_SCAN_CACHE_TABLE_NAME", table_name)
    return table_name


@pytest.fixture
def mock_sqs(reset_aws_env_vars):
    with mock_aws(config={"core": {"service_whitelist": ["sqs"]}}):
        yield


@pytest.fixture
def workflow_sqs_queue(mock_sqs, monkeypatch):
    sqs = boto3.client("sqs", region_name="us-east-1")
    # Create a default queue for tests
    queue = sqs.create_queue(QueueName="test-workflow-queue")
    # Set the env var of this queue so the SQSConfig picks it up
    monkeypatch.setenv("WORKFLOW_QUEUE_URL", queue["QueueUrl"])
    return queue["QueueUrl"]


#################
# Auth
#################


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


@pytest.fixture
def login_gov_config(public_rsa_key, private_rsa_key):
    # Note this isn't session scoped so it gets remade
    # for every test in the event of changes to it
    return LoginGovConfig(
        LOGIN_GOV_PUBLIC_KEY_MAP={"test-key-id": public_rsa_key},
        LOGIN_GOV_JWK_ENDPOINT="not_used",
        LOGIN_GOV_ENDPOINT="http://localhost:3000",
        LOGIN_GOV_CLIENT_ID="urn:gov:unit-test",
        LOGIN_GOV_CLIENT_ASSERTION_PRIVATE_KEY=private_rsa_key,
        LOGIN_GOV_AUTH_ENDPOINT="http://localhost:3000/auth",
        LOGIN_GOV_TOKEN_ENDPOINT="http://localhost:3000/token",
        LOGIN_FINAL_DESTINATION="http://localhost:3000/final",
    )


@pytest.fixture(scope="session")
def rsa_key_pair():
    return _generate_rsa_key_pair()


@pytest.fixture(scope="session")
def other_rsa_key_pair():
    return _generate_rsa_key_pair()


@pytest.fixture(scope="session")
def public_rsa_key(rsa_key_pair):
    return rsa_key_pair[1]


@pytest.fixture(scope="session")
def private_rsa_key(rsa_key_pair):
    return rsa_key_pair[0]
