import pytest
from pydantic import ValidationError

from src.auth.api_key_config import ApiKeyConfig


def test_pepper_read_from_env(monkeypatch):
    monkeypatch.setenv("API_KEY_PEPPER", "a-different-pepper-long-enough-to-pass")

    assert ApiKeyConfig().pepper == "a-different-pepper-long-enough-to-pass"


def test_pepper_is_required(monkeypatch):
    monkeypatch.delenv("API_KEY_PEPPER", raising=False)

    with pytest.raises(ValidationError):
        ApiKeyConfig()


@pytest.mark.parametrize("pepper", ["", "too-short"])
def test_pepper_rejects_blank_or_short(monkeypatch, pepper):
    monkeypatch.setenv("API_KEY_PEPPER", pepper)

    with pytest.raises(ValidationError):
        ApiKeyConfig()


def test_pepper_not_in_repr(monkeypatch):
    monkeypatch.setenv("API_KEY_PEPPER", "a-pepper-that-must-not-be-logged-ever")

    assert "must-not-be-logged" not in repr(ApiKeyConfig())


def test_pepper_available_to_test_suite():
    """The pepper must resolve with no per-test setup.

    Factory-built API keys are hashed with whatever pepper the test suite sees,
    so if this stops resolving those keys won't authenticate. The value is
    pinned by set_env_var_defaults in conftest rather than asserted here, so an
    override.env entry can't break this test.
    """
    assert ApiKeyConfig().pepper
