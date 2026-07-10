import logging

import pytest
from apiflask import APIFlask

import grants_shared.logs
from grants_shared.api.maintenance_mode import (
    MaintenanceModeLogEvent,
    get_maintenance_mode_config,
    is_maintenance_mode_enabled,
    register_maintenance_mode_handler,
)
from grants_shared.api.response import restructure_error_response
from grants_shared.api.schemas.response_schema import ErrorResponseSchema

ALLOW_LISTED_PATH = "/health"


@pytest.fixture(autouse=True)
def clear_maintenance_config_cache():
    get_maintenance_mode_config.cache_clear()
    yield
    get_maintenance_mode_config.cache_clear()


@pytest.fixture
def enable_maintenance_mode(monkeypatch):
    monkeypatch.setenv("ENABLE_MAINTENANCE_MODE", "true")
    get_maintenance_mode_config.cache_clear()


@pytest.fixture
def maintenance_client(monkeypatch):
    app = APIFlask(__name__, title="maintenance_test_app")
    app.config["HTTP_ERROR_SCHEMA"] = ErrorResponseSchema
    app.config["VALIDATION_ERROR_SCHEMA"] = ErrorResponseSchema

    @app.error_processor
    def error_processor(error):
        return restructure_error_response(error)

    register_maintenance_mode_handler(app, {ALLOW_LISTED_PATH})

    @app.get("/example")
    def example():
        return {"message": "ok"}

    @app.get(ALLOW_LISTED_PATH)
    def health():
        return {"message": "healthy"}

    with grants_shared.logs.init(__package__):
        yield app.test_client()


#################
# Config / helper
#################


def test_maintenance_mode_defaults_to_disabled(monkeypatch):
    monkeypatch.delenv("ENABLE_MAINTENANCE_MODE", raising=False)
    assert is_maintenance_mode_enabled() is False


@pytest.mark.parametrize("value", ["true", "True", "TRUE", "1"])
def test_maintenance_mode_enabled_for_truthy_values(monkeypatch, value):
    monkeypatch.setenv("ENABLE_MAINTENANCE_MODE", value)
    assert is_maintenance_mode_enabled() is True


@pytest.mark.parametrize("value", ["false", "False", "FALSE", "0"])
def test_maintenance_mode_disabled_for_falsy_values(monkeypatch, value):
    monkeypatch.setenv("ENABLE_MAINTENANCE_MODE", value)
    assert is_maintenance_mode_enabled() is False


def test_retry_after_seconds_defaults_to_3600(monkeypatch):
    monkeypatch.delenv("MAINTENANCE_RETRY_AFTER_SECONDS", raising=False)
    assert get_maintenance_mode_config().retry_after_seconds == 3600


def test_retry_after_seconds_honors_override(monkeypatch):
    monkeypatch.setenv("MAINTENANCE_RETRY_AFTER_SECONDS", "120")
    assert get_maintenance_mode_config().retry_after_seconds == 120


#################
# Handler
#################


def test_request_proceeds_normally_when_maintenance_mode_off(maintenance_client):
    response = maintenance_client.get("/example")
    assert response.status_code == 200
    assert response.get_json()["message"] == "ok"


def test_non_allow_listed_request_returns_503_when_maintenance_mode_on(
    maintenance_client, enable_maintenance_mode
):
    response = maintenance_client.get("/example")

    assert response.status_code == 503
    assert response.headers["Retry-After"] == str(get_maintenance_mode_config().retry_after_seconds)

    resp_json = response.get_json()
    assert resp_json["message"] == "API is undergoing scheduled maintenance"
    assert resp_json["status_code"] == 503
    assert resp_json["errors"] == []


def test_allow_listed_path_is_served_when_maintenance_mode_on(
    maintenance_client, enable_maintenance_mode
):
    response = maintenance_client.get(ALLOW_LISTED_PATH)

    assert response.status_code == 200
    assert response.get_json()["message"] == "healthy"


def test_maintenance_rejection_emits_distinct_log_event(
    maintenance_client, enable_maintenance_mode, caplog
):
    caplog.set_level(logging.INFO)

    maintenance_client.get("/example")

    rejection_records = [
        record
        for record in caplog.records
        if getattr(record, "maintenance_mode_event", None)
        == MaintenanceModeLogEvent.REQUEST_REJECTED
    ]
    assert len(rejection_records) == 1
    assert rejection_records[0].message == "Request rejected due to maintenance mode"
