import pytest


@pytest.fixture(autouse=True)
def form_x_api_key(monkeypatch_module):
    monkeypatch_module.setenv("FORM_X_API_KEY_ID", "fake-x-api-key")
