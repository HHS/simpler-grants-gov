import pytest

from src.maintenance_mode import get_maintenance_mode_config, is_maintenance_mode_enabled


@pytest.fixture(autouse=True)
def clear_maintenance_config_cache():
    get_maintenance_mode_config.cache_clear()
    yield
    get_maintenance_mode_config.cache_clear()


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
