import json

import requests

from src.adapters.oauth.login_gov.login_gov_oauth_client import LoginGovOauthClient
from src.adapters.oauth.oauth_client_models import OauthTokenRequest
from src.auth.login_gov_jwt_auth import LoginGovConfig


def mock_response(monkeypatch, mocked_response: dict):
    def mock_post(*args, **kwargs):
        response = requests.Response()
        # _content is fetched by the text method which we use when deserializing
        response._content = bytes(json.dumps(mocked_response), "utf-8")
        return response

    monkeypatch.setattr("requests.Session.request", mock_post)


def test_get_token(monkeypatch):

    mock_response(
        monkeypatch,
        {"id_token": "abc123", "access_token": "xyz456", "token_type": "Bearer", "expires_in": 300},
    )

    client = LoginGovOauthClient(LoginGovConfig())
    resp = client.get_token(OauthTokenRequest(code="abc123"))

    assert resp.id_token == "abc123"
    assert resp.access_token == "xyz456"
    assert resp.token_type == "Bearer"
    assert resp.expires_in == 300
    assert resp.error is None
    assert resp.error_description is None
    assert resp.is_error_response() is False


def test_get_token_error(monkeypatch):
    mock_response(
        monkeypatch,
        {"error": "invalid_request", "error_description": "missing required parameter grant_type"},
    )

    client = LoginGovOauthClient(LoginGovConfig())
    resp = client.get_token(OauthTokenRequest(code="abc123"))

    assert resp.id_token == ""
    assert resp.access_token == ""
    assert resp.token_type == ""
    assert resp.expires_in == 0
    assert resp.error == "invalid_request"
    assert resp.error_description == "missing required parameter grant_type"
    assert resp.is_error_response() is True
