import uuid
from calendar import timegm
from datetime import datetime

import jwt
import pytest
from apiflask import APIBlueprint, APIFlask, APIKeyHeaderAuth
from freezegun import freeze_time

import grants_shared.logs
from grants_shared.api.response import restructure_error_response
from grants_shared.api.route_utils import raise_flask_error
from grants_shared.api.schemas.response_schema import ErrorResponseSchema
from grants_shared.auth import api_jwt_auth
from grants_shared.auth.api_jwt_auth import ApiJwtConfig, JwtAuth, refresh_token_expiration
from grants_shared.auth.auth_errors import JwtValidationError
from tests.grants_shared.db.models.factories import SharedLinkExternalUserFactory, SharedUserFactory
from tests.grants_shared.db_test_models.db_test_models import SharedUserTokenSession
from tests.grants_shared.test_utils.auth_handler import AuthHandler


@pytest.fixture
def jwt_config(private_rsa_key, public_rsa_key):
    return ApiJwtConfig(
        API_JWT_PRIVATE_KEY=private_rsa_key,
        API_JWT_PUBLIC_KEY=public_rsa_key,
    )


@pytest.fixture
def simple_app(monkeypatch):
    """Create a minimal Flask app for testing JWT auth in HTTP context"""
    app = APIFlask(__name__, title="test_jwt_app")

    app.config["HTTP_ERROR_SCHEMA"] = ErrorResponseSchema
    app.config["VALIDATION_ERROR_SCHEMA"] = ErrorResponseSchema

    @app.error_processor
    def error_processor(error):
        return restructure_error_response(error)

    with grants_shared.logs.init(__package__):
        yield app


@pytest.fixture
def simple_client(simple_app, db_session, jwt_config, monkeypatch):
    """Register test blueprint and return test client"""
    # Create auth object following the production pattern
    test_jwt_auth = APIKeyHeaderAuth(
        "ApiKey", param_name="X-SGG-Token", security_scheme_name="ApiJwtAuth"
    )

    @test_jwt_auth.verify_token
    def decode_token(token: str):
        """Verify token and return token session (following production pattern)"""
        try:
            token_session = JwtAuth(AuthHandler(db_session), jwt_config).parse_jwt_for_user(token)
            return token_session
        except JwtValidationError as e:
            raise_flask_error(401, e.message)

    # Create a test blueprint
    test_blueprint = APIBlueprint("test_jwt", __name__, tag="test")

    @test_blueprint.get("/test_jwt_endpoint")
    @test_blueprint.auth_required(test_jwt_auth)
    def test_jwt_endpoint():
        token_session = test_jwt_auth.current_user
        return {
            "message": "Success",
            "data": {
                "user_id": str(token_session.shared_user_id),
                "token_id": str(token_session.token_id),
            },
        }

    simple_app.register_blueprint(test_blueprint)
    return simple_app.test_client()


@freeze_time("2024-11-14 12:00:00", tz_offset=0)
def test_create_jwt_for_user(enable_factory_create, db_session, jwt_config):
    """Unit test for JWT creation - validates token structure and database session"""
    user = SharedUserFactory.create()
    linked_external_user = SharedLinkExternalUserFactory.create(shared_user=user)
    token, token_session = JwtAuth(AuthHandler(db_session), jwt_config).create_jwt_for_user(
        user, None
    )
    decoded_token = jwt.decode(
        token, algorithms=[jwt_config.algorithm], options={"verify_signature": False}
    )

    # Verify the issued at timestamp is at the expected (now) timestamp
    # note we have to convert it to a unix timestamp
    assert decoded_token["iat"] == timegm(
        datetime.fromisoformat("2024-11-14 12:00:00+00:00").utctimetuple()
    )
    assert decoded_token["user_id"] == str(user.shared_user_id)
    assert decoded_token["email"] is None
    assert decoded_token["iss"] == jwt_config.issuer
    assert decoded_token["aud"] == jwt_config.audience

    token_with_email, token_session = JwtAuth(
        AuthHandler(db_session), jwt_config
    ).create_jwt_for_user(user, linked_external_user.email)
    decoded_token_with_email = jwt.decode(
        token_with_email, algorithms=[jwt_config.algorithm], options={"verify_signature": False}
    )
    assert decoded_token_with_email["email"] == linked_external_user.email

    # Verify that the sub_id returned can be used to fetch a UserTokenSession object
    token_session = (
        db_session.query(SharedUserTokenSession)
        .filter(SharedUserTokenSession.token_id == decoded_token["sub"])
        .one_or_none()
    )

    assert token_session.shared_user_id == user.shared_user_id
    assert token_session.is_valid is True
    # Verify expires_at is set to 30 minutes after now by default
    assert token_session.expires_at == datetime.fromisoformat("2024-11-14 12:30:00+00:00")

    # Basic testing that the JWT we create for a user can in turn be fetched and processed later
    user_session = JwtAuth(AuthHandler(db_session), jwt_config).parse_jwt_for_user(token)
    assert user_session.shared_user_id == user.shared_user_id


def test_parse_jwt_for_user_succeeds(simple_client, enable_factory_create, db_session, jwt_config):
    """Test JWT auth succeeds with valid token in HTTP context"""
    user = SharedUserFactory.create()
    token, _ = JwtAuth(AuthHandler(db_session), jwt_config).create_jwt_for_user(user, None)

    resp = simple_client.get("/test_jwt_endpoint", headers={"X-SGG-Token": token})

    assert resp.status_code == 200
    resp_json = resp.get_json()
    assert resp_json["message"] == "Success"
    assert resp_json["data"]["user_id"] == str(user.shared_user_id)


@freeze_time("2024-11-14 12:00:00", tz_offset=0)
def test_parse_jwt_for_user_fails_when_token_not_yet_valid(
    simple_client, enable_factory_create, db_session, jwt_config
):
    """Test JWT auth fails when token has future iat timestamp"""
    user = SharedUserFactory.create()

    future_time = datetime.fromisoformat("2024-11-14 13:00:00+00:00")
    payload = {
        "sub": str(user.shared_user_id),
        "iat": future_time,
        "aud": jwt_config.audience,
        "iss": jwt_config.issuer,
        "user_id": str(user.shared_user_id),
    }
    token = jwt.encode(payload, jwt_config.private_key, algorithm="RS256")

    resp = simple_client.get("/test_jwt_endpoint", headers={"X-SGG-Token": token})

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Token not yet valid"


def test_parse_jwt_for_user_fails_when_token_has_unknown_issuer(
    simple_client, enable_factory_create, db_session, jwt_config
):
    """Test JWT auth fails with unknown issuer in HTTP context"""
    user = SharedUserFactory.create()

    current_time = datetime.fromisoformat("2024-11-14 12:00:00+00:00")
    payload = {
        "sub": str(user.shared_user_id),
        "iat": current_time,
        "aud": jwt_config.audience,
        "iss": "unknown-issuer",
        "user_id": str(user.shared_user_id),
    }
    token = jwt.encode(payload, jwt_config.private_key, algorithm="RS256")

    resp = simple_client.get("/test_jwt_endpoint", headers={"X-SGG-Token": token})

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Unknown Issuer"


def test_parse_jwt_for_user_fails_when_token_has_unknown_audience(
    simple_client, enable_factory_create, db_session, jwt_config
):
    """Test JWT auth fails with unknown audience in HTTP context"""
    user = SharedUserFactory.create()

    current_time = datetime.fromisoformat("2024-11-14 12:00:00+00:00")
    payload = {
        "sub": str(user.shared_user_id),
        "iat": current_time,
        "aud": "unknown-audience",
        "iss": jwt_config.issuer,
        "user_id": str(user.shared_user_id),
    }
    token = jwt.encode(payload, jwt_config.private_key, algorithm="RS256")

    resp = simple_client.get("/test_jwt_endpoint", headers={"X-SGG-Token": token})

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Unknown Audience"


def test_parse_jwt_for_user_fails_when_unable_to_process_token(
    simple_client, enable_factory_create, db_session, jwt_config, other_rsa_key_pair
):
    """Test JWT auth fails when token is signed with different key"""
    user = SharedUserFactory.create()

    current_time = datetime.fromisoformat("2024-11-14 12:00:00+00:00")
    payload = {
        "sub": str(user.shared_user_id),
        "iat": current_time,
        "aud": jwt_config.audience,
        "iss": jwt_config.issuer,
        "user_id": str(user.shared_user_id),
    }
    other_private_key = other_rsa_key_pair[0]
    token = jwt.encode(payload, other_private_key, algorithm="RS256")

    resp = simple_client.get("/test_jwt_endpoint", headers={"X-SGG-Token": token})

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Unable to process token"


def test_parse_jwt_for_user_fails_when_token_missing_sub_field(
    simple_client, enable_factory_create, db_session, jwt_config
):
    """Test JWT auth fails when token is missing sub field"""
    user = SharedUserFactory.create()

    current_time = datetime.fromisoformat("2024-11-14 12:00:00+00:00")
    payload = {
        "iat": current_time,
        "aud": jwt_config.audience,
        "iss": jwt_config.issuer,
        "user_id": str(user.shared_user_id),
    }
    token = jwt.encode(payload, jwt_config.private_key, algorithm="RS256")

    resp = simple_client.get("/test_jwt_endpoint", headers={"X-SGG-Token": token})

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Token missing sub field"


def test_parse_jwt_for_user_fails_when_token_session_is_none(
    simple_client, enable_factory_create, db_session, jwt_config
):
    """Test JWT auth fails when token session doesn't exist in DB"""
    current_time = datetime.fromisoformat("2024-11-14 12:00:00+00:00")
    non_existent_token_id = str(uuid.uuid4())
    payload = {
        "sub": non_existent_token_id,
        "iat": current_time,
        "aud": jwt_config.audience,
        "iss": jwt_config.issuer,
        "user_id": str(uuid.uuid4()),
    }
    token = jwt.encode(payload, jwt_config.private_key, algorithm="RS256")

    resp = simple_client.get("/test_jwt_endpoint", headers={"X-SGG-Token": token})

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Token session does not exist"


def test_parse_jwt_for_user_fails_when_token_is_expired(
    simple_client, enable_factory_create, db_session, jwt_config
):
    """Test JWT auth fails with expired token in HTTP context"""
    user = SharedUserFactory.create()
    token, token_session = JwtAuth(AuthHandler(db_session), jwt_config).create_jwt_for_user(
        user, None
    )
    token_session.expires_at = datetime.fromisoformat("1980-01-01 12:00:00+00:00")

    resp = simple_client.get("/test_jwt_endpoint", headers={"X-SGG-Token": token})

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Token expired"


def test_parse_jwt_for_user_fails_when_token_is_no_longer_valid(
    simple_client, enable_factory_create, db_session, jwt_config
):
    """Test JWT auth fails with invalidated token in HTTP context"""
    user = SharedUserFactory.create()
    token, token_session = JwtAuth(AuthHandler(db_session), jwt_config).create_jwt_for_user(
        user, None
    )
    token_session.is_valid = False

    resp = simple_client.get("/test_jwt_endpoint", headers={"X-SGG-Token": token})

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Token is no longer valid"


@freeze_time("2024-11-14 12:00:00", tz_offset=0)
def test_refresh_token_expiration_succeeds(enable_factory_create, db_session, jwt_config):
    user = SharedUserFactory.create()
    token, token_session = JwtAuth(AuthHandler(db_session), jwt_config).create_jwt_for_user(
        user, None
    )

    original_expiration = token_session.expires_at
    assert original_expiration == datetime.fromisoformat("2024-11-14 12:30:00+00:00")

    with freeze_time("2024-11-14 12:15:00", tz_offset=0):
        refreshed_session = refresh_token_expiration(token_session, jwt_config)

        assert refreshed_session.expires_at == datetime.fromisoformat("2024-11-14 12:45:00+00:00")
        assert refreshed_session.expires_at != original_expiration


@freeze_time("2024-11-14 12:00:00", tz_offset=0)
def test_refresh_token_expiration_handles_config_of_none(
    enable_factory_create, db_session, jwt_config, monkeypatch
):
    monkeypatch.setattr(api_jwt_auth, "_config", jwt_config)

    user = SharedUserFactory.create()
    token, token_session = JwtAuth(AuthHandler(db_session), jwt_config).create_jwt_for_user(
        user, None
    )

    original_expiration = token_session.expires_at

    with freeze_time("2024-11-14 12:15:00", tz_offset=0):
        refreshed_session = refresh_token_expiration(token_session, config=None)

        assert refreshed_session.expires_at == datetime.fromisoformat("2024-11-14 12:45:00+00:00")
        assert refreshed_session.expires_at != original_expiration
