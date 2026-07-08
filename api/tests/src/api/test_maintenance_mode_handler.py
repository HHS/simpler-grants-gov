import logging

import pytest
from grants_shared.api.maintenance_mode import MaintenanceModeLogEvent, get_maintenance_mode_config


@pytest.fixture
def enable_maintenance_mode(monkeypatch):
    monkeypatch.setenv("ENABLE_MAINTENANCE_MODE", "true")
    get_maintenance_mode_config.cache_clear()
    yield
    get_maintenance_mode_config.cache_clear()


def test_request_proceeds_normally_when_maintenance_mode_off(client):
    # No maintenance-mode env var set -> handler is a no-op and the request is served.
    response = client.get("/")
    assert response.status_code == 200


def test_non_allow_listed_request_returns_503_when_maintenance_mode_on(
    client, enable_maintenance_mode
):
    response = client.get("/")

    assert response.status_code == 503
    assert response.headers["Retry-After"] == str(get_maintenance_mode_config().retry_after_seconds)

    resp_json = response.get_json()
    assert resp_json["message"] == "API is undergoing scheduled maintenance"
    assert resp_json["status_code"] == 503
    assert resp_json["errors"] == []


def test_health_is_allow_listed_when_maintenance_mode_on(client, enable_maintenance_mode):
    # /health delegates to its own handler rather than returning the 503 body.
    response = client.get("/health")

    assert response.status_code == 200
    assert response.get_json()["message"] == "Service healthy"


def test_unauthenticated_request_returns_503_not_401_when_maintenance_mode_on(
    client, enable_maintenance_mode
):
    # Hitting a protected endpoint without auth returns 503 (handler runs before auth),
    # not the 401 it would return outside maintenance mode.
    response = client.get("/v1/opportunities/1")
    assert response.status_code == 503


def test_maintenance_rejection_emits_distinct_log_event(client, enable_maintenance_mode, caplog):
    caplog.set_level(logging.INFO)

    client.get("/")

    rejection_records = [
        record
        for record in caplog.records
        if getattr(record, "maintenance_mode_event", None)
        == MaintenanceModeLogEvent.REQUEST_REJECTED
    ]
    assert len(rejection_records) == 1
    assert rejection_records[0].message == "Request rejected due to maintenance mode"
