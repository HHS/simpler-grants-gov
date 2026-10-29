import pytest
from flask import Flask, current_app
from sqlalchemy import text

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db


# Define an isolated example Flask app fixture specific to this test module
# to avoid dependencies on any project-specific fixtures in conftest.py
@pytest.fixture
def example_app() -> Flask:
    app = Flask(__name__)
    db_client = db.PostgresDBClient()
    flask_db.register_db_client(db_client, app)
    return app


def test_get_db(example_app: Flask):
    @example_app.route("/hello")
    def hello():
        with flask_db.get_db(current_app).get_connection() as conn:
            return {"data": conn.scalar(text("SELECT 'hello, world'"))}

    response = example_app.test_client().get("/hello")
    assert response.get_json() == {"data": "hello, world"}


def test_with_db_session(example_app: Flask):
    @example_app.route("/hello")
    @flask_db.with_db_session()
    def hello(db_session: db.Session):
        with db_session.begin():
            return {"data": db_session.scalar(text("SELECT 'hello, world'"))}

    response = example_app.test_client().get("/hello")
    assert response.get_json() == {"data": "hello, world"}


def test_with_db_session_not_default_name(example_app: Flask):
    db_client = db.PostgresDBClient()
    flask_db.register_db_client(db_client, example_app, client_name="something_else")

    @example_app.route("/hello")
    @flask_db.with_db_session(client_name="something_else")
    def hello(db_session: db.Session):
        with db_session.begin():
            return {"data": db_session.scalar(text("SELECT 'hello, world'"))}

    response = example_app.test_client().get("/hello")
    assert response.get_json() == {"data": "hello, world"}
