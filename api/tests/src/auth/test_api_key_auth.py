import pytest
from apiflask import HTTPError
from flask import g

from src.auth.api_key_auth import api_key_auth, verify_token


def test_verify_token_success(app, api_auth_token):
    # Passing it the configured auth token successfully returns a user
    with app.test_request_context():  # So we can attach the user to the flask app
        user = verify_token(api_auth_token)

        assert user.username == "auth_token_0"
        assert g.get("current_user") == user


def test_verify_token_other_tokens(app, all_api_auth_tokens):
    # Verify all auth tokens configured are valid and have their own usernames
    with app.test_request_context():
        for i, auth_token in enumerate(all_api_auth_tokens):
            user = verify_token(auth_token)

            assert user.username == f"auth_token_{i}"
            assert g.get("current_user") == user


def test_username_logging(app, caplog, all_api_auth_tokens):
    # Create a quick endpoint to test that the username gets attached.
    # We don't use an existing one to avoid breaking this test as we implement other endpoints
    @app.get("/dummy_auth_endpoint")
    @app.auth_required(api_key_auth)
    def dummy_endpoint():
        return "ok"

    for i, api_auth_token in enumerate(all_api_auth_tokens):
        app.test_client().get("/dummy_auth_endpoint", headers={"X-Auth": api_auth_token})

        # Check that the username is attached to the log record, we'll just grab the last one
        assert caplog.records[-1].__dict__["auth.username"] == f"auth_token_{i}"


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
