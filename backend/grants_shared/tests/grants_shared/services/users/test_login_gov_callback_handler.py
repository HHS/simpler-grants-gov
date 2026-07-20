import uuid
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from apiflask import HTTPError
from sqlalchemy import select

import grants_shared.auth.login_gov_jwt_auth as login_gov_jwt_auth
from grants_shared.adapters.oauth.login_gov.mock_login_gov_oauth_client import (
    MockLoginGovOauthClient,
)
from grants_shared.adapters.oauth.oauth_client_models import OauthTokenResponse
from grants_shared.auth.api_jwt_auth import ApiJwtConfig, JwtAuth
from grants_shared.services.users.login_gov_callback_handler import LoginGovDataContainer
from tests.grants_shared.db.models.factories import (
    SharedLinkExternalUserFactory,
    SharedLoginGovStateFactory,
)
from tests.grants_shared.db_test_models.db_test_models import (
    SharedLinkExternalUser,
    SharedLoginGovState,
    SharedUserTokenSession,
)
from tests.grants_shared.test_utils.auth_handler import AuthHandler
from tests.grants_shared.test_utils.login_gov_callback_handler import LoginGovCallbackHandler

# These match the values on the login_gov_config fixture in conftest.py
DEFAULT_ISSUER = "http://localhost:3000"
DEFAULT_CLIENT_ID = "urn:gov:unit-test"
DEFAULT_NONCE = "abc123"


def create_id_token(
    user_id: str,
    private_key: str | bytes,
    email: str = "fake@mail.com",
    nonce: str = DEFAULT_NONCE,
    issuer: str = DEFAULT_ISSUER,
    audience: str = DEFAULT_CLIENT_ID,
    kid: str = "test-key-id",
):
    """Create an id_token in roughly the format login.gov returns from the token endpoint"""
    payload = {
        "sub": user_id,
        "iss": issuer,
        "aud": audience,
        "email": email,
        "nonce": nonce,
        # The jwt encode function automatically turns these datetime
        # objects into a UTC timestamp integer
        "exp": datetime.now(tz=timezone.utc) + timedelta(days=30),
        "iat": datetime.now(tz=timezone.utc) - timedelta(days=1),
        "nbf": datetime.now(tz=timezone.utc) - timedelta(days=1),
        "jti": "abc123",
        "acr": "urn:acr.login.gov:auth-only",
    }
    return jwt.encode(payload, private_key, algorithm="RS256", headers={"kid": kid})


@pytest.fixture
def jwt_config(private_rsa_key, public_rsa_key):
    return ApiJwtConfig(
        API_JWT_PRIVATE_KEY=private_rsa_key,
        API_JWT_PUBLIC_KEY=public_rsa_key,
    )


@pytest.fixture
def login_gov_callback_handler(db_session, jwt_config):
    auth_handler = AuthHandler(db_session)
    jwt_auth = JwtAuth(auth_handler, jwt_config)
    return LoginGovCallbackHandler(auth_handler, jwt_auth)


@pytest.fixture
def mock_oauth_client(monkeypatch):
    """Swap the real login.gov client for a mock one in the callback handler"""
    client = MockLoginGovOauthClient()
    monkeypatch.setattr(
        "grants_shared.services.users.login_gov_callback_handler.get_login_gov_client",
        lambda: client,
    )
    return client


@pytest.fixture
def set_login_gov_config(monkeypatch, login_gov_config):
    """Set the module-level login.gov config the handler reads via get_config()"""
    monkeypatch.setattr(login_gov_jwt_auth, "_config", login_gov_config)
    return login_gov_config


##########################################
# handle_callback_request
##########################################


def test_handle_callback_request(enable_factory_create, db_session, login_gov_callback_handler):
    login_gov_state = SharedLoginGovStateFactory.create()
    query = {
        "code": "1234",
        "state": str(login_gov_state.shared_login_gov_state_id),
    }
    login_gov_data_container = login_gov_callback_handler.handle_callback_request(query)
    assert login_gov_data_container.code == query["code"]
    assert login_gov_data_container.nonce == str(login_gov_state.nonce)

    # The state should have been deleted so it can't be reused
    remaining_state = db_session.execute(
        select(SharedLoginGovState).where(
            SharedLoginGovState.shared_login_gov_state_id
            == login_gov_state.shared_login_gov_state_id
        )
    ).scalar_one_or_none()
    assert remaining_state is None


@pytest.mark.parametrize(
    "query,expected_status,expected_message",
    [
        # access_denied means the user cancelled/declined, so we send back a 401
        (
            {"error": "access_denied", "error_description": "user declined"},
            401,
            "User declined to login",
        ),
        # any other error indicates a misconfiguration on our end, so it's a 500
        (
            {"error": "invalid_request", "error_description": "something is misconfigured"},
            500,
            "invalid_request something is misconfigured",
        ),
    ],
)
def test_handle_callback_request_invalid_callback_params(
    login_gov_callback_handler, query, expected_status, expected_message
):
    with pytest.raises(HTTPError) as exc_info:
        login_gov_callback_handler.handle_callback_request(query)

    assert exc_info.value.status_code == expected_status
    assert exc_info.value.message == expected_message


def test_handle_callback_request_code_none(login_gov_callback_handler):
    query = {"state": str(uuid.uuid4())}
    with pytest.raises(HTTPError) as exc_info:
        login_gov_callback_handler.handle_callback_request(query)

    assert exc_info.value.status_code == 422
    assert exc_info.value.message == "Missing code in request"


def test_handle_callback_request_state_none(login_gov_callback_handler):
    query = {"code": "1234"}
    with pytest.raises(HTTPError) as exc_info:
        login_gov_callback_handler.handle_callback_request(query)

    assert exc_info.value.status_code == 422
    assert exc_info.value.message == "Missing state in request"


def test_handle_callback_request_invalid_uuid_state(login_gov_callback_handler):
    query = {"code": "1234", "state": "not-a-uuid"}
    with pytest.raises(HTTPError) as exc_info:
        login_gov_callback_handler.handle_callback_request(query)

    assert exc_info.value.status_code == 422
    assert exc_info.value.message == "Invalid OAuth state value"


def test_handle_callback_request_login_gov_state_none(login_gov_callback_handler):
    # A valid UUID that doesn't correspond to any stored state
    query = {"code": "1234", "state": str(uuid.uuid4())}
    with pytest.raises(HTTPError) as exc_info:
        login_gov_callback_handler.handle_callback_request(query)

    assert exc_info.value.status_code == 404
    assert exc_info.value.message == "OAuth state not found"


##########################################
# handle_token
##########################################


def test_handle_token_succeeds(
    enable_factory_create,
    db_session,
    login_gov_callback_handler,
    mock_oauth_client,
    set_login_gov_config,
    private_rsa_key,
):
    external_user_id = str(uuid.uuid4())
    code = str(uuid.uuid4())
    id_token = create_id_token(
        user_id=external_user_id,
        email="Fake_User@Mail.com",
        private_key=private_rsa_key,
    )
    mock_oauth_client.add_token_response(
        code,
        OauthTokenResponse(
            id_token=id_token, access_token="fake_token", token_type="Bearer", expires_in=300
        ),
    )

    response = login_gov_callback_handler.handle_token(
        LoginGovDataContainer(code=code, nonce=DEFAULT_NONCE)
    )

    assert response.is_user_new is True
    assert response.token is not None

    # The external user should have been created with a lowercased email
    external_user = db_session.execute(
        select(SharedLinkExternalUser).where(
            SharedLinkExternalUser.external_user_id == external_user_id
        )
    ).scalar_one()
    assert external_user.email == "fake_user@mail.com"

    # A token session should have been created for the new user
    token_session = db_session.execute(
        select(SharedUserTokenSession).where(
            SharedUserTokenSession.shared_user_id == external_user.shared_user_id
        )
    ).scalar_one()
    assert token_session.is_valid is True


def test_handle_token_succeeds_existing_user(
    enable_factory_create,
    db_session,
    login_gov_callback_handler,
    mock_oauth_client,
    set_login_gov_config,
    private_rsa_key,
):
    external_user = SharedLinkExternalUserFactory.create(
        external_user_id="existing-user-xyz", email="old_email@mail.com"
    )
    external_user_id = external_user.external_user_id

    code = str(uuid.uuid4())
    id_token = create_id_token(
        user_id=external_user_id,
        email="new_email@mail.com",
        private_key=private_rsa_key,
    )
    mock_oauth_client.add_token_response(
        code,
        OauthTokenResponse(
            id_token=id_token, access_token="fake_token", token_type="Bearer", expires_in=300
        ),
    )

    response = login_gov_callback_handler.handle_token(
        LoginGovDataContainer(code=code, nonce=DEFAULT_NONCE)
    )

    assert response.is_user_new is False
    assert response.token is not None

    # The existing external user's email should have been updated
    db_session.refresh(external_user)
    assert external_user.email == "new_email@mail.com"


def test_handle_token_oauth_token_response_error(
    enable_factory_create,
    login_gov_callback_handler,
    mock_oauth_client,
    set_login_gov_config,
):
    # No token response is registered, so the mock client returns an error response
    code = str(uuid.uuid4())

    with pytest.raises(HTTPError) as exc_info:
        login_gov_callback_handler.handle_token(
            LoginGovDataContainer(code=code, nonce=DEFAULT_NONCE)
        )

    assert exc_info.value.status_code == 500
    assert exc_info.value.message == "default mock error description"

    # We should have exhausted all three attempts before giving up
    assert mock_oauth_client.retries[code] == -3


def test_handle_token_login_gov_validation_fails(
    enable_factory_create,
    login_gov_callback_handler,
    mock_oauth_client,
    set_login_gov_config,
    other_rsa_key_pair,
):
    # Sign the token with a key we don't validate against so validation fails
    code = str(uuid.uuid4())
    id_token = create_id_token(
        user_id=str(uuid.uuid4()),
        private_key=other_rsa_key_pair[0],
    )
    mock_oauth_client.add_token_response(
        code,
        OauthTokenResponse(
            id_token=id_token, access_token="fake_token", token_type="Bearer", expires_in=300
        ),
    )

    with pytest.raises(HTTPError) as exc_info:
        login_gov_callback_handler.handle_token(
            LoginGovDataContainer(code=code, nonce=DEFAULT_NONCE)
        )

    assert exc_info.value.status_code == 401
    assert exc_info.value.message == "Invalid Signature"
