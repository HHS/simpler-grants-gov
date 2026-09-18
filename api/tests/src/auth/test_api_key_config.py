import pytest
from pydantic import ValidationError

from src.auth.api_key_config import ApiKeyConfig


def test_pepper_read_from_env(monkeypatch):
    monkeypatch.setenv("API_KEY_PEPPER", "some-other-pepper")

    assert ApiKeyConfig().pepper == "some-other-pepper"


def test_pepper_is_required(monkeypatch):
    monkeypatch.delenv("API_KEY_PEPPER", raising=False)

    with pytest.raises(ValidationError):
        ApiKeyConfig()


def test_pepper_available_to_test_suite():
    """The pepper must resolve from local.env with no extra setup.

    Factory-built API keys are hashed with whatever pepper the test suite sees,
    so if this stops resolving those keys won't authenticate.
    """
    assert ApiKeyConfig().pepper == "local-dev-api-key-pepper-not-a-secret"
