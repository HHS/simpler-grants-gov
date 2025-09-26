import pytest


@pytest.fixture(autouse=True)
def non_local_api_auth_token(monkeypatch_module):
    monkeypatch_module.setenv("NON_LOCAL_API_AUTH_TOKEN", "fake-auth-token")
