import os
import os.path as path
import re

import flask.testing
import pytest
from pytest_lazyfixture import lazy_fixture
from smart_open import open as smart_open

import src.adapters.db as db
from src.db.models.user_models import User
from tests.src.db.models.factories import UserFactory


@pytest.fixture
def prepopulate_user_table(enable_factory_create, db_session: db.Session) -> list[User]:
    # First make sure the table is empty, as other tests may have inserted data
    # and this test expects a clean slate (unlike most tests that are designed to
    # be isolated from other tests)
    db_session.query(User).delete()
    return [
        UserFactory.create(first_name="Jon", last_name="Doe", is_active=True),
        UserFactory.create(first_name="Jane", last_name="Doe", is_active=False),
        UserFactory.create(
            first_name="Alby",
            last_name="Testin",
            is_active=True,
        ),
    ]


@pytest.fixture
def tmp_s3_folder(mock_s3_bucket):
    return f"s3://{mock_s3_bucket}/path/to/"


@pytest.mark.parametrize(
    "dir",
    [
        pytest.param(lazy_fixture("tmp_s3_folder"), id="write-to-s3"),
        pytest.param(lazy_fixture("tmp_path"), id="write-to-local"),
    ],
)
def test_create_user_csv(
    prepopulate_user_table: list[User],
    cli_runner: flask.testing.FlaskCliRunner,
    dir: str,
):
    cli_runner.invoke(args=["user", "create-csv", "--dir", dir, "--filename", "test.csv"])
    output = smart_open(path.join(dir, "test.csv")).read()
    expected_output = open(
        path.join(path.dirname(__file__), "test_create_user_csv_expected.csv")
    ).read()
    assert output == expected_output


def test_default_filename(cli_runner: flask.testing.FlaskCliRunner, tmp_path: str):
    cli_runner.invoke(args=["user", "create-csv", "--dir", tmp_path])
    filenames = os.listdir(tmp_path)
    assert re.match(r"\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}-user-roles.csv", filenames[0])
