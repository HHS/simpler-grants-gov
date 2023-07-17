import logging
import sys
import time

import pytest
from flask import Flask

import src.logging.flask_logger as flask_logger
from tests.lib.assertions import assert_dict_contains


@pytest.fixture
def logger():
    logger = logging.getLogger("src")
    before_level = logger.level

    logger.setLevel(logging.DEBUG)
    handler = logging.StreamHandler(sys.stdout)
    logger.addHandler(handler)
    yield logger
    logger.setLevel(before_level)
    logger.removeHandler(handler)


@pytest.fixture
def app(logger):
    app = Flask("test_app_name")

    @app.get("/hello/<name>")
    def hello(name):
        logging.getLogger("src.hello").info(f"hello, {name}!")
        return "ok"

    flask_logger.init_app(logger, app)
    return app


test_request_lifecycle_logs_data = [
    pytest.param(
        "/hello/jane",
        [
            {"msg": "start request"},
            {"msg": "hello, jane!"},
            {
                "msg": "end request",
                "response.status_code": 200,
                "response.content_length": 2,
                "response.content_type": "text/html; charset=utf-8",
                "response.mimetype": "text/html",
            },
        ],
        id="200",
    ),
    pytest.param(
        "/notfound",
        [
            {"msg": "start request"},
            {
                "msg": "end request",
                "response.status_code": 404,
                "response.content_length": 207,
                "response.content_type": "text/html; charset=utf-8",
                "response.mimetype": "text/html",
            },
        ],
        id="404",
    ),
]


@pytest.mark.parametrize(
    "route,expected_extras",
    test_request_lifecycle_logs_data,
)
def test_request_lifecycle_logs(
    app: Flask, caplog: pytest.LogCaptureFixture, route, expected_extras
):
    app.test_client().get(route)

    # Assert that the log messages are present
    # There should be the route log message that is logged in the before_request handler
    # as part of every request, followed by the log message in the route handler itself.
    # then the log message in the after_request handler.

    assert len(caplog.records) == len(expected_extras)
    for record, expected_extra in zip(caplog.records, expected_extras):
        assert_dict_contains(record.__dict__, expected_extra)


def test_app_context_extra_attributes(app: Flask, caplog: pytest.LogCaptureFixture):
    # Assert that extra attributes related to the app context are present in all log records
    expected_extra = {"app.name": "test_app_name"}

    app.test_client().get("/hello/jane")

    assert len(caplog.records) > 0
    for record in caplog.records:
        assert_dict_contains(record.__dict__, expected_extra)


def test_request_context_extra_attributes(app: Flask, caplog: pytest.LogCaptureFixture):
    # Assert that the extra attributes related to the request context are present in all log records
    expected_extra = {
        "request.id": "",
        "request.method": "GET",
        "request.path": "/hello/jane",
        "request.url_rule": "/hello/<name>",
        "request.query.up": "high",
        "request.query.down": "low",
    }

    app.test_client().get("/hello/jane?up=high&down=low")

    assert len(caplog.records) > 0
    for record in caplog.records:
        assert_dict_contains(record.__dict__, expected_extra)


def test_add_extra_log_data_for_current_request(app: Flask, caplog: pytest.LogCaptureFixture):
    @app.get("/pet/<name>")
    def pet(name):
        flask_logger.add_extra_data_to_current_request_logs({"pet.name": name})
        logging.getLogger("test.pet").info(f"petting {name}")
        return "ok"

    app.test_client().get("/pet/kitty")

    last_record = caplog.records[-1]
    assert_dict_contains(last_record.__dict__, {"pet.name": "kitty"})


def test_log_response_time(app: Flask, caplog: pytest.LogCaptureFixture):
    @app.get("/sleep")
    def sleep():
        time.sleep(0.1)  # 0.1 s = 100 ms
        return "ok"

    app.test_client().get("/sleep")

    last_record = caplog.records[-1]
    assert "response.time_ms" in last_record.__dict__
    response_time_ms = last_record.__dict__["response.time_ms"]
    expected_response_time_ms = 100  # ms
    allowed_error = 20  # ms

    assert response_time_ms == pytest.approx(expected_response_time_ms, abs=allowed_error)
