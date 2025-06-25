from calendar import timegm
from datetime import datetime

import jwt
import pytest
from freezegun import freeze_time

import src.app as app_entry
import src.logging
from src.auth.api_jwt_auth import ApiJwtConfig
from src.auth.auth_errors import JwtValidationError
from src.auth.internal_jwt_auth import (
    create_jwt_for_internal_token,
    internal_jwt_auth,
    parse_jwt_for_internal_token,
)
from src.db.models.competition_models import ShortLivedInternalToken


@pytest.fixture
def jwt_config(private_rsa_key, public_rsa_key):
    return ApiJwtConfig(
        API_JWT_PRIVATE_KEY=private_rsa_key,
        API_JWT_PUBLIC_KEY=public_rsa_key,
    )


@pytest.fixture(scope="module")
def mini_app(monkeypatch_module):
    def stub(app):
        pass

    """Create a separate app that we can modify separate from the base one used by other tests"""
    # We want all the configurational setup for the app, but
    # don't want blueprints to keep setup simpler
    monkeypatch_module.setattr(app_entry, "register_blueprints", stub)
    monkeypatch_module.setattr(app_entry, "setup_logging", stub)
    mini_app = app_entry.create_app()

    @mini_app.get("/dummy_internal_auth_endpoint")
    @mini_app.auth_required(internal_jwt_auth)
    def dummy_internal_endpoint():
        # For the tests that actually get past auth
        # make sure the current user is set to the short-lived token
        assert internal_jwt_auth.current_user is not None
        assert isinstance(internal_jwt_auth.current_user, ShortLivedInternalToken)

        token = internal_jwt_auth.current_user
        return {
            "message": "ok",
            "token_id": str(token.short_lived_internal_token_id),
            "expires_at": token.expires_at.isoformat(),
        }

    # To avoid re-initializing logging everytime we
    # setup the app, we disabled it above and do it here
    # in case you want it while running your tests
    with src.logging.init(__package__):
        yield mini_app


@freeze_time("2024-11-14 12:00:00", tz_offset=0)
def test_create_jwt_for_internal_token(enable_factory_create, db_session, jwt_config):
    """Test creating a JWT token for internal use with short-lived token"""
    expires_at = datetime.fromisoformat("2024-11-14 13:00:00+00:00")  # 1 hour from now

    token, short_lived_token = create_jwt_for_internal_token(
        expires_at=expires_at,
        db_session=db_session,
        config=jwt_config,
    )

    # Verify the JWT token structure
    decoded_token = jwt.decode(
        token, algorithms=[jwt_config.algorithm], options={"verify_signature": False}
    )

    # Verify the issued at timestamp is at the expected (now) timestamp
    assert decoded_token["iat"] == timegm(
        datetime.fromisoformat("2024-11-14 12:00:00+00:00").utctimetuple()
    )
    assert decoded_token["iss"] == jwt_config.issuer
    assert decoded_token["aud"] == jwt_config.audience
    assert "sub" in decoded_token  # Verify the token ID is present

    # Verify the database record
    assert short_lived_token.expires_at == expires_at
    assert short_lived_token.is_valid is True

    # Verify that the sub_id returned can be used to fetch a ShortLivedInternalToken object
    token_from_db = (
        db_session.query(ShortLivedInternalToken)
        .filter(ShortLivedInternalToken.short_lived_internal_token_id == decoded_token["sub"])
        .one_or_none()
    )

    assert token_from_db is not None
    assert token_from_db.expires_at == expires_at
    assert token_from_db.is_valid is True


@freeze_time("2024-11-14 12:00:00", tz_offset=0)
def test_parse_jwt_for_internal_token_happy_path(enable_factory_create, db_session, jwt_config):
    """Test parsing a valid JWT token and retrieving the short-lived token"""
    expires_at = datetime.fromisoformat("2024-11-14 13:00:00+00:00")  # 1 hour from now

    token, _ = create_jwt_for_internal_token(
        expires_at=expires_at,
        db_session=db_session,
        config=jwt_config,
    )
    db_session.commit()  # Commit to ensure the token is in the DB

    # Parse the token
    short_lived_token = parse_jwt_for_internal_token(token, db_session, jwt_config)

    # Verify the returned object
    assert short_lived_token.expires_at == expires_at
    assert short_lived_token.is_valid is True


def test_parse_jwt_for_internal_token_expired(enable_factory_create, db_session, jwt_config):
    """Test parsing an expired JWT token"""
    expires_at = datetime.fromisoformat("1980-01-01 12:00:00+00:00")  # Already expired

    token, short_lived_token = create_jwt_for_internal_token(
        expires_at=expires_at,
        db_session=db_session,
        config=jwt_config,
    )
    db_session.commit()

    # Parsing should fail due to expiration
    with pytest.raises(JwtValidationError, match="Token expired"):
        parse_jwt_for_internal_token(token, db_session, jwt_config)


@freeze_time("2024-11-14 12:00:00", tz_offset=0)
def test_parse_jwt_for_internal_token_invalid(enable_factory_create, db_session, jwt_config):
    """Test parsing a JWT token that has been marked as invalid"""
    expires_at = datetime.fromisoformat("2025-01-01 12:00:00+00:00")  # Future date

    token, short_lived_token = create_jwt_for_internal_token(
        expires_at=expires_at,
        db_session=db_session,
        config=jwt_config,
    )

    # Mark the token as invalid
    short_lived_token.is_valid = False
    db_session.commit()

    # Parsing should fail due to invalid flag
    with pytest.raises(JwtValidationError, match="Token is no longer valid"):
        parse_jwt_for_internal_token(token, db_session, jwt_config)


@freeze_time("2024-11-14 12:00:00", tz_offset=0)
def test_parse_jwt_for_internal_token_not_in_db(enable_factory_create, db_session, jwt_config):
    """Test parsing a JWT token that doesn't exist in the database"""
    expires_at = datetime.fromisoformat("2025-01-01 12:00:00+00:00")  # Future date

    token, short_lived_token = create_jwt_for_internal_token(
        expires_at=expires_at,
        db_session=db_session,
        config=jwt_config,
    )

    # Don't commit to DB, so the token won't exist when we try to parse it
    db_session.expunge(short_lived_token)

    # Parsing should fail because token doesn't exist in DB
    with pytest.raises(JwtValidationError, match="Token session does not exist"):
        parse_jwt_for_internal_token(token, db_session, jwt_config)


def test_parse_jwt_for_internal_token_malformed_jwt(db_session, jwt_config):
    """Test parsing a malformed JWT token"""
    malformed_token = "not.a.valid.jwt.token"

    with pytest.raises(JwtValidationError, match="Unable to process token"):
        parse_jwt_for_internal_token(malformed_token, db_session, jwt_config)


def test_parse_jwt_for_internal_token_missing_sub(enable_factory_create, db_session, jwt_config):
    """Test parsing a JWT token without a 'sub' field"""
    # Create a JWT without the required 'sub' field
    payload = {
        "iat": datetime.fromisoformat("2024-11-14 12:00:00+00:00"),
        "aud": jwt_config.audience,
        "iss": jwt_config.issuer,
        # Missing 'sub' field
    }

    token = jwt.encode(payload, jwt_config.private_key, algorithm="RS256")

    with pytest.raises(JwtValidationError, match="Token missing sub field"):
        parse_jwt_for_internal_token(token, db_session, jwt_config)


@freeze_time("2024-11-14 12:00:00", tz_offset=0)
def test_parse_jwt_for_internal_token_wrong_issuer(enable_factory_create, db_session, jwt_config):
    """Test parsing a JWT token with wrong issuer"""
    # Create config with wrong issuer
    wrong_config = ApiJwtConfig(
        API_JWT_PRIVATE_KEY=jwt_config.private_key,
        API_JWT_PUBLIC_KEY=jwt_config.public_key,
        API_JWT_ISSUER="wrong-issuer",
    )

    expires_at = datetime.fromisoformat("2025-01-01 12:00:00+00:00")
    token, _ = create_jwt_for_internal_token(
        expires_at=expires_at,
        db_session=db_session,
        config=wrong_config,
    )
    db_session.commit()

    # Parsing with correct config should fail due to wrong issuer
    with pytest.raises(JwtValidationError, match="Unknown Issuer"):
        parse_jwt_for_internal_token(token, db_session, jwt_config)


@freeze_time("2024-11-14 12:00:00", tz_offset=0)
def test_parse_jwt_for_internal_token_wrong_audience(enable_factory_create, db_session, jwt_config):
    """Test parsing a JWT token with wrong audience"""
    # Create config with wrong audience
    wrong_config = ApiJwtConfig(
        API_JWT_PRIVATE_KEY=jwt_config.private_key,
        API_JWT_PUBLIC_KEY=jwt_config.public_key,
        API_JWT_AUDIENCE="wrong-audience",
    )

    expires_at = datetime.fromisoformat("2025-01-01 12:00:00+00:00")
    token, _ = create_jwt_for_internal_token(
        expires_at=expires_at,
        db_session=db_session,
        config=wrong_config,
    )
    db_session.commit()

    # Parsing with correct config should fail due to wrong audience
    with pytest.raises(JwtValidationError, match="Unknown Audience"):
        parse_jwt_for_internal_token(token, db_session, jwt_config)


# Integration tests for the auth working end-to-end with a mini Flask app


@freeze_time("2024-11-14 12:00:00", tz_offset=0)
def test_internal_jwt_auth_happy_path(mini_app, enable_factory_create, db_session):
    """Test internal JWT auth works end-to-end in a Flask app"""
    expires_at = datetime.fromisoformat("2024-11-14 13:00:00+00:00")  # 1 hour from now

    # Use default config that the app loads from environment
    token, short_lived_token = create_jwt_for_internal_token(
        expires_at=expires_at,
        db_session=db_session,
    )
    db_session.commit()  # need to commit here to push the token to the DB

    resp = mini_app.test_client().get(
        "/dummy_internal_auth_endpoint", headers={"X-SGG-Internal-Token": token}
    )

    assert resp.status_code == 200
    response_data = resp.get_json()
    assert response_data["message"] == "ok"
    assert response_data["token_id"] == str(short_lived_token.short_lived_internal_token_id)
    assert response_data["expires_at"] == expires_at.isoformat()


@freeze_time("2024-11-14 12:00:00", tz_offset=0)
def test_internal_jwt_auth_expired_token(mini_app, enable_factory_create, db_session):
    """Test internal JWT auth fails with expired token"""
    expires_at = datetime.fromisoformat("1980-01-01 12:00:00+00:00")  # Already expired

    token, _ = create_jwt_for_internal_token(
        expires_at=expires_at,
        db_session=db_session,
    )
    db_session.commit()

    resp = mini_app.test_client().get(
        "/dummy_internal_auth_endpoint", headers={"X-SGG-Internal-Token": token}
    )

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Token expired"


@freeze_time("2024-11-14 12:00:00", tz_offset=0)
def test_internal_jwt_auth_invalid_token(mini_app, enable_factory_create, db_session):
    """Test internal JWT auth fails with invalid token"""
    expires_at = datetime.fromisoformat("2025-01-01 12:00:00+00:00")  # Future date

    token, short_lived_token = create_jwt_for_internal_token(
        expires_at=expires_at,
        db_session=db_session,
    )
    short_lived_token.is_valid = False
    db_session.commit()

    resp = mini_app.test_client().get(
        "/dummy_internal_auth_endpoint", headers={"X-SGG-Internal-Token": token}
    )

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Token is no longer valid"


def test_internal_jwt_auth_no_token(mini_app):
    """Test internal JWT auth fails without token"""
    resp = mini_app.test_client().get("/dummy_internal_auth_endpoint", headers={})
    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Unable to process token"


def test_internal_jwt_auth_malformed_token(mini_app):
    """Test internal JWT auth fails with malformed token"""
    resp = mini_app.test_client().get(
        "/dummy_internal_auth_endpoint", headers={"X-SGG-Internal-Token": "not.a.valid.jwt"}
    )
    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Unable to process token"
