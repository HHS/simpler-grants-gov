import os

import pytest

from grants_shared.util.local import error_if_not_local, load_local_env_vars


class TestLoadLocalEnvVars:
    def test_loads_dotenv_when_environment_is_local(self, monkeypatch, tmp_path):
        env_file = tmp_path / "local.env"
        env_file.write_text("TEST_VAR=hello\n")
        monkeypatch.setenv("ENVIRONMENT", "local")
        monkeypatch.delenv("TEST_VAR", raising=False)

        load_local_env_vars(str(env_file))

        assert os.getenv("TEST_VAR") == "hello"

    def test_loads_dotenv_when_environment_is_unset(self, monkeypatch, tmp_path):
        env_file = tmp_path / "local.env"
        env_file.write_text("TEST_VAR2=world\n")
        monkeypatch.delenv("ENVIRONMENT", raising=False)
        monkeypatch.delenv("TEST_VAR2", raising=False)

        load_local_env_vars(str(env_file))

        assert os.getenv("TEST_VAR2") == "world"

    def test_skips_dotenv_when_environment_is_not_local(self, monkeypatch, tmp_path):
        env_file = tmp_path / "local.env"
        env_file.write_text("TEST_VAR3=should_not_load\n")
        monkeypatch.setenv("ENVIRONMENT", "dev")
        monkeypatch.delenv("TEST_VAR3", raising=False)

        load_local_env_vars(str(env_file))

        assert os.getenv("TEST_VAR3") is None

    @pytest.mark.parametrize("env", ["staging", "prod", "production", "test"])
    def test_skips_dotenv_for_non_local_environments(self, monkeypatch, tmp_path, env):
        env_file = tmp_path / "local.env"
        env_file.write_text("SKIP_VAR=skip\n")
        monkeypatch.setenv("ENVIRONMENT", env)
        monkeypatch.delenv("SKIP_VAR", raising=False)

        load_local_env_vars(str(env_file))

        assert os.getenv("SKIP_VAR") is None


class TestErrorIfNotLocal:
    def test_passes_when_environment_is_local(self, monkeypatch):
        monkeypatch.setenv("ENVIRONMENT", "local")
        # Should not raise
        error_if_not_local()

    def test_raises_when_environment_is_not_local(self, monkeypatch):
        monkeypatch.setenv("ENVIRONMENT", "dev")
        with pytest.raises(
            Exception, match="Local-only process called when environment was set to non-local"
        ):
            error_if_not_local()

    def test_raises_when_environment_is_unset(self, monkeypatch):
        monkeypatch.delenv("ENVIRONMENT", raising=False)
        with pytest.raises(
            Exception, match="Local-only process called when environment was set to non-local"
        ):
            error_if_not_local()

    @pytest.mark.parametrize("env", ["staging", "prod", "production", "test"])
    def test_raises_for_non_local_environments(self, monkeypatch, env):
        monkeypatch.setenv("ENVIRONMENT", env)
        with pytest.raises(
            Exception, match="Local-only process called when environment was set to non-local"
        ):
            error_if_not_local()
