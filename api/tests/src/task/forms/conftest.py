import pytest


@pytest.fixture(autouse=True)
def non_local_api_auth_token(monkeypatch_module):
    monkeypatch_module.setenv("NON_LOCAL_API_AUTH_TOKEN", "fake-auth-token")


@pytest.fixture(autouse=True)
def form_x_api_key(monkeypatch_module):
    monkeypatch_module.setenv("FORM_X_API_KEY_ID", "fake-x-api-key")
