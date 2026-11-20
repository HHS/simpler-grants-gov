import pytest

from src.auth.session_duration_override import get_session_duration_override


@pytest.mark.parametrize("environment", ["local", "dev", "staging"])
@pytest.mark.parametrize("seconds", [30, 60, 900])
def test_get_session_duration_override_allowed(monkeypatch, environment, seconds):
    monkeypatch.setenv("ENVIRONMENT", environment)

    assert get_session_duration_override(seconds) == seconds


@pytest.mark.parametrize(
    "environment,seconds",
    [
        ("prod", 60),
        ("training", 60),
        ("grantor1", 60),
        ("staging", None),
        ("staging", 29),
        ("staging", 901),
        ("staging", 0),
        ("staging", -60),
    ],
)
def test_get_session_duration_override_ignored(monkeypatch, environment, seconds):
    monkeypatch.setenv("ENVIRONMENT", environment)

    assert get_session_duration_override(seconds) is None


def test_get_session_duration_override_ignored_without_environment(monkeypatch):
    monkeypatch.delenv("ENVIRONMENT", raising=False)

    assert get_session_duration_override(60) is None
