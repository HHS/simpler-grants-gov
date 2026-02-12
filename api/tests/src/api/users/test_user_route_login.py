import urllib
import uuid
from datetime import timedelta

import pytest

import src.auth.login_gov_jwt_auth as login_gov_jwt_auth
from src.adapters.oauth.oauth_client_models import OauthTokenResponse
from src.api.route_utils import raise_flask_error
from src.auth.api_jwt_auth import parse_jwt_for_user
from src.db.models.user_models import LinkExternalUser, LoginGovState
from src.util import datetime_util
from tests.lib.auth_test_utils import create_jwt
from tests.src.db.models.factories import LinkExternalUserFactory, LoginGovStateFactory

##########################################
# Full login flow tests
##########################################


def test_user_login_flow_happy_path_302(client, db_session):
    """Happy path for a user logging in through the whole flow"""
    login_gov_config = login_gov_jwt_auth.get_config()
    resp = client.get("/v1/users/login", follow_redirects=True)

    # The final endpoint returns a 200
    # and dumps the params it was called with
    assert resp.status_code == 200
    resp_json = resp.get_json()
    assert resp_json["is_user_new"] == "1"
    assert resp_json["message"] == "success"
    assert resp_json["token"] is not None

    # Verify the token we generated works with our later parsing logic
    user_token_session = parse_jwt_for_user(resp_json["token"], db_session)
    assert user_token_session.expires_at > datetime_util.utcnow()
    assert user_token_session.is_valid is True

    # History contains each redirect, we redirected 3 times
    assert len(resp.history) == 3

    first_redirect, second_redirect, third_redirect = resp.history

    # Redirect to oauth
    assert first_redirect.status_code == 302
    first_redirect_url = urllib.parse.urlparse(first_redirect.headers["Location"])
    assert first_redirect_url.path == "/test-endpoint/oauth-authorize"

    first_redirect_params = urllib.parse.parse_qs(first_redirect_url.query)
    assert first_redirect_params["client_id"][0] == login_gov_config.client_id
    assert first_redirect_params["nonce"][0] is not None
    assert first_redirect_params["state"][0] is not None
    assert first_redirect_params["redirect_uri"][0] == "http://localhost/v1/users/login/callback"
    assert first_redirect_params["acr_values"][0] == login_gov_config.acr_value
    assert first_redirect_params["scope"][0] == login_gov_config.scope
    assert first_redirect_params["prompt"][0] == "select_account"
    assert first_redirect_params["response_type"][0] == "code"

    # Redirect back to our callback endpoint
    assert second_redirect.status_code == 302
    second_redirect_url = urllib.parse.urlparse(second_redirect.headers["Location"])
    assert second_redirect_url.path == "/v1/users/login/callback"

    second_redirect_params = urllib.parse.parse_qs(second_redirect_url.query)
    assert second_redirect_params["code"][0] is not None
    assert second_redirect_params["state"][0] == first_redirect_params["state"][0]

    # Redirect to the final destination page
    assert third_redirect.status_code == 302
    third_redirect_url = urllib.parse.urlparse(third_redirect.headers["Location"])
    assert third_redirect_url.path == "/v1/users/login/result"

    third_redirect_params = urllib.parse.parse_qs(third_redirect_url.query)
    assert third_redirect_params["message"][0] == "success"
    assert third_redirect_params["is_user_new"][0] == "1"
    assert third_redirect_params["token"][0] == resp_json["token"]


def test_user_login_flow_error_in_login_302(client, monkeypatch):
    """Test that the redirect happens to the final endpoint directly if an error occurs"""

    # Force the api to error by overriding a function call
    def override(*args, **kwargs):
        raise Exception("I am an error")

    monkeypatch.setattr("flask.url_for", override)

    resp = client.get("/v1/users/login", follow_redirects=True)

    # The final endpoint returns a 200
    # and dumps the params it was called with
    assert resp.status_code == 200
    resp_json = resp.get_json()

    assert resp_json["message"] == "error"
    assert resp_json["error_description"] == "internal error"

    # History contains each redirect, we redirected just once
    assert len(resp.history) == 1
    redirect = resp.history[0]

    assert redirect.status_code == 302
    redirect_url = urllib.parse.urlparse(redirect.headers["Location"])
    assert redirect_url.path == "/v1/users/login/result"


def test_user_login_flow_error_in_http_error_302(client, monkeypatch):
    """Test that the redirect happens to the final endpoint directly if an error occurs

    Only difference from above test is that the error message gets passed through
    for an HTTPError that we rose
    """

    # Force the api to error by overriding a function call
    def override(*args, **kwargs):
        raise_flask_error(422, "I am an error")

    monkeypatch.setattr("flask.url_for", override)

    resp = client.get("/v1/users/login", follow_redirects=True)

    # The final endpoint returns a 200
    # and dumps the params it was called with
    assert resp.status_code == 200
    resp_json = resp.get_json()

    assert resp_json["message"] == "error"
    assert resp_json["error_description"] == "I am an error"

    # History contains each redirect, we redirected just once
    assert len(resp.history) == 1
    redirect = resp.history[0]

    assert redirect.status_code == 302
    redirect_url = urllib.parse.urlparse(redirect.headers["Location"])
    assert redirect_url.path == "/v1/users/login/result"


def test_user_login_flow_error_in_http_error_internal_302(client, monkeypatch):
    """Test that the redirect happens to the final endpoint directly if an error occurs

    Even if it is raised by raise_flask_error, if it is a 5xx error, we want to not display the message
    """

    # Force the api to error by overriding a function call
    def override(*args, **kwargs):
        raise_flask_error(503, "I am an internal error")

    monkeypatch.setattr("flask.url_for", override)

    resp = client.get("/v1/users/login", follow_redirects=True)

    # The final endpoint returns a 200
    # and dumps the params it was called with
    assert resp.status_code == 200
    resp_json = resp.get_json()

    assert resp_json["message"] == "error"
    assert resp_json["error_description"] == "internal error"

    # History contains each redirect, we redirected just once
    assert len(resp.history) == 1
    redirect = resp.history[0]

    assert redirect.status_code == 302
    redirect_url = urllib.parse.urlparse(redirect.headers["Location"])
    assert redirect_url.path == "/v1/users/login/result"


def test_user_login_flow_access_denied_in_auth_response_302(client, monkeypatch):
    """Test behavior when we get a redirect back from login.gov with an error"""

    def override():
        return {"error": "access_denied", "error_description": "user does not have access"}

    monkeypatch.setattr("tests.lib.auth_test_utils.oauth_param_override", override)

    resp = client.get("/v1/users/login", follow_redirects=True)

    # The final endpoint returns a 200 even when erroring as it is just a GET endpoint
    assert resp.status_code == 200
    resp_json = resp.get_json()

    # Because it was a 403 error, the error message is passed through as a description
    assert resp_json["message"] == "error"
    assert resp_json["error_description"] == "User declined to login"

    # We still redirected through every endpoint
    assert len(resp.history) == 3


def test_user_login_flow_error_in_auth_response_302(client, monkeypatch):
    """Test behavior when we get a redirect back from login.gov with an error"""

    def override():
        return {"error": "invalid_request", "error_description": "user does not have access"}

    monkeypatch.setattr("tests.lib.auth_test_utils.oauth_param_override", override)

    resp = client.get("/v1/users/login", follow_redirects=True)

    # The final endpoint returns a 200 even when erroring as it is just a GET endpoint
    assert resp.status_code == 200
    resp_json = resp.get_json()

    # Because it was a 5xx error, the errors are intentionally vague
    assert resp_json["message"] == "error"
    assert resp_json["error_description"] == "internal error"

    # We still redirected through every endpoint
    assert len(resp.history) == 3


##########################################
# Callback endpoint direct tests
##########################################


def test_user_callback_new_user_302(
    client, db_session, enable_factory_create, mock_oauth_client, private_rsa_key
):
    # Create state so the callback gets past the check
    login_gov_state = LoginGovStateFactory.create()

    code = str(uuid.uuid4())
    id_token = create_jwt(
        user_id="bob-xyz",
        nonce=str(login_gov_state.nonce),
        private_key=private_rsa_key,
    )
    mock_oauth_client.add_token_response(
        code,
        OauthTokenResponse(
            id_token=id_token, access_token="fake_token", token_type="Bearer", expires_in=300
        ),
    )

    resp = client.get(
        f"/v1/users/login/callback?state={login_gov_state.login_gov_state_id}&code={code}",
        follow_redirects=True,
    )

    assert resp.status_code == 200
    resp_json = resp.get_json()
    assert resp_json["is_user_new"] == "1"
    assert resp_json["message"] == "success"
    assert resp_json["token"] is not None

    user_token_session = parse_jwt_for_user(resp_json["token"], db_session)
    assert user_token_session.expires_at > datetime_util.utcnow()
    assert user_token_session.is_valid is True

    # Make sure the external user record is created with expected IDs
    external_user = (
        db_session.query(LinkExternalUser)
        .filter(
            LinkExternalUser.user_id == user_token_session.user_id,
            LinkExternalUser.external_user_id == "bob-xyz",
        )
        .one_or_none()
    )
    assert external_user is not None

    # Make sure the login gov state was deleted
    db_state = (
        db_session.query(LoginGovState)
        .filter(LoginGovState.login_gov_state_id == login_gov_state.login_gov_state_id)
        .one_or_none()
    )
    assert db_state is None


def test_user_callback_existing_user_302(
    client, db_session, enable_factory_create, mock_oauth_client, private_rsa_key
):
    # Create state so the callback gets past the check
    login_gov_state = LoginGovStateFactory.create()

    login_gov_id = str(uuid.uuid4())
    external_user = LinkExternalUserFactory.create(
        external_user_id=login_gov_id, email="some_old_email@mail.com"
    )

    code = str(uuid.uuid4())
    id_token = create_jwt(
        user_id=login_gov_id,
        nonce=str(login_gov_state.nonce),
        private_key=private_rsa_key,
    )
    mock_oauth_client.add_token_response(
        code,
        OauthTokenResponse(
            id_token=id_token, access_token="fake_token", token_type="Bearer", expires_in=300
        ),
    )

    resp = client.get(
        f"/v1/users/login/callback?state={login_gov_state.login_gov_state_id}&code={code}",
        follow_redirects=True,
    )

    assert resp.status_code == 200
    resp_json = resp.get_json()
    assert resp_json["is_user_new"] == "0"
    assert resp_json["message"] == "success"
    assert resp_json["token"] is not None

    user_token_session = parse_jwt_for_user(resp_json["token"], db_session)
    assert user_token_session.expires_at > datetime_util.utcnow()
    assert user_token_session.is_valid is True
    assert user_token_session.user_id == external_user.user_id

    # Make sure the login gov state was deleted
    db_state = (
        db_session.query(LoginGovState)
        .filter(LoginGovState.login_gov_state_id == login_gov_state.login_gov_state_id)
        .one_or_none()
    )
    assert db_state is None


def test_user_callback_unknown_state_302(client, monkeypatch):
    """Test behavior when we get a redirect back from login.gov with an unknown state value"""

    # We can just call the callback directly with the state that doesn't exist
    resp = client.get(
        f"/v1/users/login/callback?state={uuid.uuid4()}&code=xyz456", follow_redirects=True
    )

    # The final endpoint returns a 200 even when erroring as it is just a GET endpoint
    assert resp.status_code == 200
    resp_json = resp.get_json()

    assert resp_json["message"] == "error"
    assert resp_json["error_description"] == "OAuth state not found"


def test_user_callback_invalid_state_302(client, monkeypatch):
    """Test behavior when we get a redirect back from login.gov with an invalid state value"""

    # We can just call the callback directly with the state that isn't a uuid
    resp = client.get("/v1/users/login/callback?state=abc123&code=xyz456", follow_redirects=True)

    # The final endpoint returns a 200 even when erroring as it is just a GET endpoint
    assert resp.status_code == 200
    resp_json = resp.get_json()

    assert resp_json["message"] == "error"
    assert resp_json["error_description"] == "Invalid OAuth state value"


def test_user_callback_error_in_token_302(client, enable_factory_create, caplog):
    """Test behavior when we call the callback endpoint, but the oauth token endpoint has nothing"""

    # Create state so the callback gets past the check
    login_gov_state = LoginGovStateFactory.create()

    resp = client.get(
        f"/v1/users/login/callback?state={login_gov_state.login_gov_state_id}&code=xyz456",
        follow_redirects=True,
    )

    # The final endpoint returns a 200 even when erroring as it is just a GET endpoint
    assert resp.status_code == 200
    resp_json = resp.get_json()

    assert resp_json["message"] == "error"
    assert resp_json["error_description"] == "internal error"

    # Verify it errored because of the response from token Oauth
    assert (
        "Unexpected error occurred in login flow via raise_flask_error: default mock error description"
        in caplog.messages
    )


@pytest.mark.parametrize(
    "jwt_params,error_description",
    [
        ({"issuer": "not-the-right-issuer"}, "Unknown Issuer"),
        ({"audience": "jeff"}, "Unknown Audience"),
        ({"expires_at": datetime_util.utcnow() - timedelta(days=1)}, "Expired Token"),
        ({"issued_at": datetime_util.utcnow() + timedelta(days=1)}, "Token not yet valid"),
        ({"not_before": datetime_util.utcnow() + timedelta(days=1)}, "Token not yet valid"),
    ],
)
def test_user_callback_token_fails_validation_302(
    client,
    db_session,
    enable_factory_create,
    mock_oauth_client,
    private_rsa_key,
    jwt_params,
    error_description,
):
    # Create state so the callback gets past the check
    login_gov_state = LoginGovStateFactory.create()

    code = str(uuid.uuid4())
    id_token = create_jwt(
        user_id=str(uuid.uuid4()),
        nonce=str(login_gov_state.nonce),
        private_key=private_rsa_key,
        **jwt_params,
    )
    mock_oauth_client.add_token_response(
        code,
        OauthTokenResponse(
            id_token=id_token, access_token="fake_token", token_type="Bearer", expires_in=300
        ),
    )

    resp = client.get(
        f"/v1/users/login/callback?state={login_gov_state.login_gov_state_id}&code={code}",
        follow_redirects=True,
    )

    assert resp.status_code == 200
    resp_json = resp.get_json()
    assert resp_json["message"] == "error"
    assert resp_json["error_description"] == error_description

    # Make sure the login gov state was deleted even though it errored
    db_state = (
        db_session.query(LoginGovState)
        .filter(LoginGovState.login_gov_state_id == login_gov_state.login_gov_state_id)
        .one_or_none()
    )
    assert db_state is None


def test_user_callback_token_fails_validation_bad_token_302(
    client, db_session, enable_factory_create, mock_oauth_client, private_rsa_key
):
    # Create state so the callback gets past the check
    login_gov_state = LoginGovStateFactory.create()

    code = str(uuid.uuid4())

    mock_oauth_client.add_token_response(
        code,
        OauthTokenResponse(
            id_token="bad-token", access_token="fake_token", token_type="Bearer", expires_in=300
        ),
    )

    resp = client.get(
        f"/v1/users/login/callback?state={login_gov_state.login_gov_state_id}&code={code}",
        follow_redirects=True,
    )

    assert resp.status_code == 200
    resp_json = resp.get_json()
    assert resp_json["message"] == "error"
    assert resp_json["error_description"] == "Unable to parse token - invalid format"

    # Make sure the login gov state was deleted even though it errored
    db_state = (
        db_session.query(LoginGovState)
        .filter(LoginGovState.login_gov_state_id == login_gov_state.login_gov_state_id)
        .one_or_none()
    )
    assert db_state is None


def test_user_callback_token_fails_validation_no_valid_key_302(
    client, db_session, enable_factory_create, mock_oauth_client, other_rsa_key_pair
):
    """Create the token with a different key than we check against"""
    # Create state so the callback gets past the check
    login_gov_state = LoginGovStateFactory.create()

    code = str(uuid.uuid4())
    id_token = create_jwt(
        user_id=str(uuid.uuid4()),
        nonce=str(login_gov_state.nonce),
        private_key=other_rsa_key_pair[0],
    )
    mock_oauth_client.add_token_response(
        code,
        OauthTokenResponse(
            id_token=id_token, access_token="fake_token", token_type="Bearer", expires_in=300
        ),
    )

    resp = client.get(
        f"/v1/users/login/callback?state={login_gov_state.login_gov_state_id}&code={code}",
        follow_redirects=True,
    )

    assert resp.status_code == 200
    resp_json = resp.get_json()
    assert resp_json["message"] == "error"
    assert resp_json["error_description"] == "Invalid Signature"

    # Make sure the login gov state was deleted even though it errored
    db_state = (
        db_session.query(LoginGovState)
        .filter(LoginGovState.login_gov_state_id == login_gov_state.login_gov_state_id)
        .one_or_none()
    )
    assert db_state is None


##########################################
# PIV/CAC validation tests
##########################################


def test_agency_user_without_piv_fails_when_required(
    client, db_session, enable_factory_create, mock_oauth_client, private_rsa_key, monkeypatch
):
    """Agency user logging in without PIV should fail when IS_PIV_REQUIRED=true"""
    from tests.src.db.models.factories import AgencyFactory, AgencyUserFactory, LinkExternalUserFactory

    # Enable PIV requirement
    monkeypatch.setattr("src.auth.login_gov_jwt_auth._config.is_piv_required", True)

    # Create state and existing agency user
    login_gov_state = LoginGovStateFactory.create()
    login_gov_id = str(uuid.uuid4())
    external_user = LinkExternalUserFactory.create(external_user_id=login_gov_id)

    # Make the user an agency user
    agency = AgencyFactory.create()
    AgencyUserFactory.create(user=external_user.user, agency=agency)

    code = str(uuid.uuid4())
    id_token = create_jwt(
        user_id=login_gov_id,
        nonce=str(login_gov_state.nonce),
        private_key=private_rsa_key,
        x509_presented=False,  # No PIV
    )
    mock_oauth_client.add_token_response(
        code,
        OauthTokenResponse(
            id_token=id_token, access_token="fake_token", token_type="Bearer", expires_in=300
        ),
    )

    resp = client.get(
        f"/v1/users/login/callback?state={login_gov_state.login_gov_state_id}&code={code}",
        follow_redirects=True,
    )

    assert resp.status_code == 200
    resp_json = resp.get_json()
    assert resp_json["message"] == "error"
    assert resp_json["error_description"] == "Agency users must authenticate using a PIV/CAC card"


def test_agency_user_with_piv_succeeds_when_required(
    client, db_session, enable_factory_create, mock_oauth_client, private_rsa_key, monkeypatch
):
    """Agency user logging in with PIV should succeed when IS_PIV_REQUIRED=true"""
    from tests.src.db.models.factories import AgencyFactory, AgencyUserFactory, LinkExternalUserFactory

    # Enable PIV requirement
    monkeypatch.setattr("src.auth.login_gov_jwt_auth._config.is_piv_required", True)

    # Create state and existing agency user
    login_gov_state = LoginGovStateFactory.create()
    login_gov_id = str(uuid.uuid4())
    external_user = LinkExternalUserFactory.create(external_user_id=login_gov_id)

    # Make the user an agency user
    agency = AgencyFactory.create()
    AgencyUserFactory.create(user=external_user.user, agency=agency)

    code = str(uuid.uuid4())
    id_token = create_jwt(
        user_id=login_gov_id,
        nonce=str(login_gov_state.nonce),
        private_key=private_rsa_key,
        x509_presented=True,  # With PIV
    )
    mock_oauth_client.add_token_response(
        code,
        OauthTokenResponse(
            id_token=id_token, access_token="fake_token", token_type="Bearer", expires_in=300
        ),
    )

    resp = client.get(
        f"/v1/users/login/callback?state={login_gov_state.login_gov_state_id}&code={code}",
        follow_redirects=True,
    )

    assert resp.status_code == 200
    resp_json = resp.get_json()
    assert resp_json["message"] == "success"
    assert resp_json["token"] is not None


def test_non_agency_user_without_piv_succeeds_when_required(
    client, db_session, enable_factory_create, mock_oauth_client, private_rsa_key, monkeypatch
):
    """Non-agency user logging in without PIV should succeed even when IS_PIV_REQUIRED=true"""
    # Enable PIV requirement
    monkeypatch.setattr("src.auth.login_gov_jwt_auth._config.is_piv_required", True)

    # Create state (user will be created as new, non-agency user)
    login_gov_state = LoginGovStateFactory.create()

    code = str(uuid.uuid4())
    id_token = create_jwt(
        user_id="new-non-agency-user",
        nonce=str(login_gov_state.nonce),
        private_key=private_rsa_key,
        x509_presented=False,  # No PIV
    )
    mock_oauth_client.add_token_response(
        code,
        OauthTokenResponse(
            id_token=id_token, access_token="fake_token", token_type="Bearer", expires_in=300
        ),
    )

    resp = client.get(
        f"/v1/users/login/callback?state={login_gov_state.login_gov_state_id}&code={code}",
        follow_redirects=True,
    )

    assert resp.status_code == 200
    resp_json = resp.get_json()
    assert resp_json["message"] == "success"
    assert resp_json["token"] is not None


def test_agency_user_without_piv_succeeds_when_not_required(
    client, db_session, enable_factory_create, mock_oauth_client, private_rsa_key, monkeypatch
):
    """Agency user logging in without PIV should succeed when IS_PIV_REQUIRED=false"""
    from tests.src.db.models.factories import AgencyFactory, AgencyUserFactory, LinkExternalUserFactory

    # Disable PIV requirement (default behavior)
    monkeypatch.setattr("src.auth.login_gov_jwt_auth._config.is_piv_required", False)

    # Create state and existing agency user
    login_gov_state = LoginGovStateFactory.create()
    login_gov_id = str(uuid.uuid4())
    external_user = LinkExternalUserFactory.create(external_user_id=login_gov_id)

    # Make the user an agency user
    agency = AgencyFactory.create()
    AgencyUserFactory.create(user=external_user.user, agency=agency)

    code = str(uuid.uuid4())
    id_token = create_jwt(
        user_id=login_gov_id,
        nonce=str(login_gov_state.nonce),
        private_key=private_rsa_key,
        x509_presented=False,  # No PIV
    )
    mock_oauth_client.add_token_response(
        code,
        OauthTokenResponse(
            id_token=id_token, access_token="fake_token", token_type="Bearer", expires_in=300
        ),
    )

    resp = client.get(
        f"/v1/users/login/callback?state={login_gov_state.login_gov_state_id}&code={code}",
        follow_redirects=True,
    )

    assert resp.status_code == 200
    resp_json = resp.get_json()
    assert resp_json["message"] == "success"
    assert resp_json["token"] is not None
