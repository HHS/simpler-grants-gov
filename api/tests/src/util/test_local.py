import os

import pytest

from src.util.local import error_if_not_local, load_local_env_vars


def test_load_local_env_vars_when_environment_unset_loads_file(
    monkeypatch: pytest.MonkeyPatch, tmp_path
) -> None:
    monkeypatch.delenv("ENVIRONMENT", raising=False)
    monkeypatch.delenv("LOCAL_TEST_FROM_DOTENV", raising=False)

    env_file = tmp_path / "local.env"
    env_file.write_text("LOCAL_TEST_FROM_DOTENV=loaded\n")

    load_local_env_vars(env_file=str(env_file))

    assert os.environ["LOCAL_TEST_FROM_DOTENV"] == "loaded"


def test_load_local_env_vars_when_environment_is_local_loads_file(
    monkeypatch: pytest.MonkeyPatch, tmp_path
) -> None:
    monkeypatch.setenv("ENVIRONMENT", "local")
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


def test_error_if_not_local_raises_in_non_local(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("ENVIRONMENT", "dev")

    with pytest.raises(
        Exception,
        match="Local-only process called when environment was set to non-local",
    ):
        error_if_not_local()


def test_error_if_not_local_succeeds_in_local(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("ENVIRONMENT", "local")

    assert error_if_not_local() is None


def test_error_if_not_local_raises_when_environment_unset(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("ENVIRONMENT", raising=False)

    with pytest.raises(
        Exception,
        match="Local-only process called when environment was set to non-local",
    ):
        error_if_not_local()
