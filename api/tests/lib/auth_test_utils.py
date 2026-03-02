"""Utilities for creating and working with auth features in tests"""

import urllib
import uuid
from datetime import datetime, timedelta

import flask
import jwt

from src.adapters.oauth.oauth_client_models import OauthTokenResponse
from src.auth.login_gov_jwt_auth import get_config


def create_jwt(
    user_id: str,
    private_key: str | bytes,
    email: str = "fake_mail@mail.com",
    nonce: str = "abc123",
    expires_at: datetime | None = None,
    issued_at: datetime | None = None,
    not_before: datetime | None = None,
    # Note that these values need to match what we set
    # in conftest.py::setup_login_gov_auth
    issuer: str | None = None,
    audience: str | None = None,
    x509_presented: bool | None = None,
):
    """Create a JWT in roughly the format login.gov will give us"""

    # Default datetime values are set to clearly not be an issue
    if expires_at is None:
        expires_at = datetime.now() + timedelta(days=365)
    if issued_at is None:
        issued_at = datetime.now() - timedelta(days=365)
    if not_before is None:
        not_before = datetime.now() - timedelta(days=365)
    if issuer is None:
        issuer = get_config().login_gov_endpoint
    if audience is None:
        audience = get_config().client_id

    payload = {
        "sub": user_id,
        "iss": issuer,
        "aud": audience,
        "email": email,
        "nonce": nonce,
        # The jwt encode function automatically turns these datetime
        # objects into a UTC timestamp integer
        "exp": expires_at,
        "iat": issued_at,
        "nbf": not_before,
        # These values aren't checked by anything at the moment
        # but are a part of the token from login.gov
        "jti": "abc123",
        "at_hash": "abc123",
        "c_hash": "abc123",
        "acr": "urn:acr.login.gov:auth-only",
    }

    # Only include x509_presented if explicitly set (login.gov only includes it when requested)
    if x509_presented is not None:
        payload["x509_presented"] = x509_presented

    return jwt.encode(payload, private_key, algorithm="RS256", headers={"kid": "test-key-id"})


def oauth_param_override():
    """Override endpoint called in the mock authorize endpoint setup below.

    To override you can do the following in your test:

        def override():
            return {"error": "access_denied"}

        monkeypatch.setattr("tests.lib.auth_test_utils.oauth_param_override", override)
    """
    return {}


def mock_oauth_endpoint(app, monkeypatch, private_key, mock_oauth_client):
    """Add mock oauth endpoints to the application

    For the initial authorize endpoint, we create an endpoint on the app itself
    which redirects back to the configured redirect_uri and also sets up the
    mock_oauth_client to have a successful response when calling it later for a token.
    """

    @app.get("/test-endpoint/oauth-authorize")
    def oauth_authorize():
        # This endpoint represents a mocked version of
        # https://developers.login.gov/oidc/authorization/
        # and needs to return the state value as well as a code.
        query_args = flask.request.args

        params = {"state": query_args.get("state"), "code": str(uuid.uuid4())}
        params.update(oauth_param_override())

        # Add a dummy response we'll later get if the token endpoint is called
        id_token = create_jwt(
            user_id=query_args.get("state"),  # Re-use the state as the user ID
            private_key=private_key,
            nonce=query_args.get("nonce"),
        )
        mocked_token_response = OauthTokenResponse(
            id_token=id_token, access_token="fake_token", token_type="Bearer", expires_in=300
        )
        mock_oauth_client.add_token_response(params["code"], mocked_token_response)

        encoded_params = urllib.parse.urlencode(params)

        redirect_uri = f"{query_args['redirect_uri']}?{encoded_params}"

        return flask.redirect(redirect_uri)

    # Override our callback endpoint to use this mocked client instead of the real one
    def override_get_client():
        """Override the login_gov client we use in unit tests to be the mock version"""
        return mock_oauth_client

    monkeypatch.setattr(
        "src.services.users.login_gov_callback_handler.get_login_gov_client", override_get_client
    )
