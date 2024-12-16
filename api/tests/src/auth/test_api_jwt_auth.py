from calendar import timegm
from datetime import datetime

import jwt
import pytest
from freezegun import freeze_time

import src.app as app_entry
import src.logging
from src.auth.api_jwt_auth import (
    ApiJwtConfig,
    api_jwt_auth,
    create_jwt_for_user,
    parse_jwt_for_user,
)
from src.db.models.user_models import UserTokenSession
from tests.src.db.models.factories import UserFactory


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

    @mini_app.get("/dummy_auth_endpoint")
    @mini_app.auth_required(api_jwt_auth)
    def dummy_endpoint():
        # For the tests that actually get past auth
        # make sure the current user is set to the user session
        assert api_jwt_auth.current_user is not None
        assert isinstance(api_jwt_auth.current_user, UserTokenSession)

        return {"message": "ok"}

    # To avoid re-initializing logging everytime we
    # setup the app, we disabled it above and do it here
    # in case you want it while running your tests
    with src.logging.init(__package__):
        yield mini_app


@freeze_time("2024-11-14 12:00:00", tz_offset=0)
def test_create_jwt_for_user(enable_factory_create, db_session, jwt_config):
    user = UserFactory.create()
    token, token_session = create_jwt_for_user(user, db_session, jwt_config)
    decoded_token = jwt.decode(
        token, algorithms=[jwt_config.algorithm], options={"verify_signature": False}
    )

    # Verify the issued at timestamp is at the expected (now) timestamp
    # note we have to convert it to a unix timestamp
    assert decoded_token["iat"] == timegm(
        datetime.fromisoformat("2024-11-14 12:00:00+00:00").utctimetuple()
    )
    assert decoded_token["user_id"] == str(user.user_id)
    assert decoded_token["iss"] == jwt_config.issuer
    assert decoded_token["aud"] == jwt_config.audience

    # Verify that the sub_id returned can be used to fetch a UserTokenSession object
    token_session = (
        db_session.query(UserTokenSession)
        .filter(UserTokenSession.token_id == decoded_token["sub"])
        .one_or_none()
    )

    assert token_session.user_id == user.user_id
    assert token_session.is_valid is True
    # Verify expires_at is set to 30 minutes after now by default
    assert token_session.expires_at == datetime.fromisoformat("2024-11-14 12:30:00+00:00")

    # Basic testing that the JWT we create for a user can in turn be fetched and processed later
    user_session = parse_jwt_for_user(token, db_session, jwt_config)
    assert user_session.user_id == user.user_id


def test_api_jwt_auth_happy_path(mini_app, enable_factory_create, db_session):
    user = UserFactory.create()
    token, _ = create_jwt_for_user(user, db_session)
    db_session.commit()  # need to commit here to push the session to the DB

    resp = mini_app.test_client().get("/dummy_auth_endpoint", headers={"X-SGG-Token": token})

    assert resp.status_code == 200
    assert resp.get_json()["message"] == "ok"


def test_api_jwt_auth_expired_token(mini_app, enable_factory_create, db_session):
    user = UserFactory.create()
    token, session = create_jwt_for_user(user, db_session)
    session.expires_at = datetime.fromisoformat("1980-01-01 12:00:00+00:00")
    db_session.commit()

    resp = mini_app.test_client().get("/dummy_auth_endpoint", headers={"X-SGG-Token": token})

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Token expired"


def test_api_jwt_auth_invalid_token(mini_app, enable_factory_create, db_session):
    user = UserFactory.create()
    token, session = create_jwt_for_user(user, db_session)
    session.is_valid = False
    db_session.commit()

    resp = mini_app.test_client().get("/dummy_auth_endpoint", headers={"X-SGG-Token": token})

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Token is no longer valid"


def test_api_jwt_auth_token_missing_in_db(mini_app, enable_factory_create, db_session):
    user = UserFactory.create()
    token, session = create_jwt_for_user(user, db_session)
    db_session.expunge(session)  # Just drop it, never sending to the DB

    resp = mini_app.test_client().get("/dummy_auth_endpoint", headers={"X-SGG-Token": token})

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Token session does not exist"


def test_api_jwt_auth_token_not_jwt(mini_app, enable_factory_create, db_session):
    # Just call with a random set of characters
    resp = mini_app.test_client().get("/dummy_auth_endpoint", headers={"X-SGG-Token": "abc123"})
    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Unable to process token"


def test_api_jwt_auth_token_created_with_different_key(
    mini_app, enable_factory_create, db_session, jwt_config
):
    # Note - jwt_config uses a key generated in the conftest within this directory
    # while the config the app picks up grabs a key from our override.env file
    user = UserFactory.create()
    token, _ = create_jwt_for_user(user, db_session, jwt_config)
    db_session.commit()

    resp = mini_app.test_client().get("/dummy_auth_endpoint", headers={"X-SGG-Token": token})

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Unable to process token"


def test_api_jwt_auth_token_iat_future(mini_app, enable_factory_create, db_session):
    # Set time to the 14th so the iat value will be then
    with freeze_time("2024-11-14 12:00:00", tz_offset=0):
        user = UserFactory.create()
        token, _ = create_jwt_for_user(user, db_session)
        db_session.commit()

    # Set time to the 12th when calling the API so the iat will be in the future now
    with freeze_time("2024-11-12 12:00:00", tz_offset=0):
        resp = mini_app.test_client().get("/dummy_auth_endpoint", headers={"X-SGG-Token": token})

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Token not yet valid"


def test_api_jwt_auth_token_unknown_issuer(mini_app, enable_factory_create, db_session):
    config = ApiJwtConfig(API_JWT_ISSUER="some-guy")
    user = UserFactory.create()
    token, _ = create_jwt_for_user(user, db_session, config)
    db_session.commit()

    resp = mini_app.test_client().get("/dummy_auth_endpoint", headers={"X-SGG-Token": token})
    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Unknown Issuer"


def test_api_jwt_auth_token_unknown_audience(mini_app, enable_factory_create, db_session):
    config = ApiJwtConfig(API_JWT_AUDIENCE="someone-else")
    user = UserFactory.create()
    token, _ = create_jwt_for_user(user, db_session, config)
    db_session.commit()

    resp = mini_app.test_client().get("/dummy_auth_endpoint", headers={"X-SGG-Token": token})
    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Unknown Audience"


def test_api_jwt_auth_no_token(mini_app, enable_factory_create, db_session):
    resp = mini_app.test_client().get("/dummy_auth_endpoint", headers={})
    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Unable to process token"
