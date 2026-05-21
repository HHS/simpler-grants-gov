import os

import pytest

from src.util.local import error_if_not_local, load_local_env_vars


@pytest.mark.parametrize(
    "environment_value",
    [
        pytest.param(None, id="environment_unset"),
        pytest.param("local", id="environment_local"),
    ],
)
def test_load_local_env_vars_loads_file_in_local_env(
    monkeypatch: pytest.MonkeyPatch, tmp_path, environment_value
) -> None:
    if environment_value is None:
        monkeypatch.delenv("ENVIRONMENT", raising=False)
    else:
        monkeypatch.setenv("ENVIRONMENT", environment_value)
    monkeypatch.delenv("LOCAL_TEST_FROM_DOTENV", raising=False)

    env_file = tmp_path / "local.env"
    env_file.write_text("LOCAL_TEST_FROM_DOTENV=loaded\n")

    load_local_env_vars(env_file=str(env_file))

    assert os.environ["LOCAL_TEST_FROM_DOTENV"] == "loaded"


def test_load_local_env_vars_skips_in_non_local_env(
    monkeypatch: pytest.MonkeyPatch, tmp_path
) -> None:
    monkeypatch.setenv("ENVIRONMENT", "dev")
    monkeypatch.delenv("LOCAL_TEST_FROM_DOTENV", raising=False)

    env_file = tmp_path / "local.env"
    env_file.write_text("LOCAL_TEST_FROM_DOTENV=should_not_load\n")

    load_local_env_vars(env_file=str(env_file))

    assert "LOCAL_TEST_FROM_DOTENV" not in os.environ


class TestErrorIfNotLocal:
    """Test the error_if_not_local function"""

    def test_raises_in_non_local(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test raising when ENVIRONMENT is set to a non-local value"""
        monkeypatch.setenv("ENVIRONMENT", "dev")

        with pytest.raises(
            Exception,
            match="Local-only process called when environment was set to non-local",
        ):
            error_if_not_local()

    def test_succeeds_in_local(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test returning None when ENVIRONMENT is local"""
        monkeypatch.setenv("ENVIRONMENT", "local")

        assert error_if_not_local() is None

    def test_raises_when_environment_unset(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Test raising when ENVIRONMENT is not set"""
        monkeypatch.delenv("ENVIRONMENT", raising=False)

        with pytest.raises(
            Exception,
            match="Local-only process called when environment was set to non-local",
        ):
            error_if_not_local()
