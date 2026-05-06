import pytest
from apiflask import APIFlask
import flask
import src.app as app_entry


@pytest.fixture(scope="session")
def app() -> APIFlask:
    return app_entry.create_app()

@pytest.fixture
def client(app: APIFlask) -> flask.testing.FlaskClient:
    return app.test_client()


