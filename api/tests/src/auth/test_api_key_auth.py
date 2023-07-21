import pytest
from apiflask import HTTPError
from flask import g

from src.auth.api_key_auth import API_AUTH_USER, verify_token


def test_verify_token_success(app, api_auth_token):
    # Passing it the configured auth token successfully returns a user
    with app.app_context():  # So we can attach the user to the flask app
        user_map = verify_token(api_auth_token)

        assert user_map.get("uid") == API_AUTH_USER.id
        assert g.get("current_user") == API_AUTH_USER


def test_verify_token_invalid_token(api_auth_token):
    # If you pass it the wrong token
    with pytest.raises(HTTPError):
        verify_token("not the right token")


def test_verify_token_no_configuration(monkeypatch):
    # Remove the API_AUTH_TOKEN env var if set in
    # your local environment
    monkeypatch.delenv("API_AUTH_TOKEN", raising=False)
    # If the auth token is not setup
    with pytest.raises(HTTPError):
        verify_token("any token")
