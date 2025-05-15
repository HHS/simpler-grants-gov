import pytest

import src.app as app_entry
import src.logging
from src.auth.api_jwt_auth import create_jwt_for_user
from src.auth.multi_auth import AuthType, jwt_or_key_multi_auth
from tests.src.db.models.factories import UserFactory


@pytest.fixture(scope="module")
def mini_app(monkeypatch_module):
    """Create a separate app that we can modify separate from the base one used by other tests"""

    def stub(app):
        pass

    # We want all the configurational setup for the app, but
    # don't want blueprints to keep setup simpler
    monkeypatch_module.setattr(app_entry, "register_blueprints", stub)
    monkeypatch_module.setattr(app_entry, "setup_logging", stub)
    mini_app = app_entry.create_app()

    @mini_app.get("/dummy_auth_endpoint")
    @mini_app.auth_required(jwt_or_key_multi_auth)
    def dummy_endpoint():
        user = jwt_or_key_multi_auth.get_user()

        return {
            "message": "ok",
            "auth_type": user.auth_type,
            "user_id": getattr(user.user, "user_id", None),
            "username": getattr(user.user, "username", None),
        }

    # To avoid re-initializing logging everytime we
    # setup the app, we disabled it above and do it here
    # in case you want it while running your tests
    with src.logging.init(__package__):
        yield mini_app


def test_multi_auth_happy_path(mini_app, enable_factory_create, db_session, api_auth_token):
    user = UserFactory.create()
    token, _ = create_jwt_for_user(user, db_session)
    db_session.commit()  # need to commit here to push the session to the DB

    resp = mini_app.test_client().get("/dummy_auth_endpoint", headers={"X-SGG-Token": token})
    assert resp.status_code == 200
    assert resp.json["auth_type"] == AuthType.USER_JWT_AUTH
    assert resp.json["user_id"] == str(user.user_id)
    assert resp.json["username"] is None

    resp = mini_app.test_client().get("/dummy_auth_endpoint", headers={"X-Auth": api_auth_token})
    assert resp.status_code == 200
    assert resp.json["auth_type"] == AuthType.API_KEY_AUTH
    assert resp.json["user_id"] is None
    assert resp.json["username"] == "auth_token_0"

    # If we provide both tokens, the user auth is used
    # because it's the "primary" auth and takes precedence
    resp = mini_app.test_client().get(
        "/dummy_auth_endpoint", headers={"X-SGG-Token": token, "X-Auth": api_auth_token}
    )
    assert resp.status_code == 200
    assert resp.json["auth_type"] == AuthType.USER_JWT_AUTH
    assert resp.json["user_id"] == str(user.user_id)
    assert resp.json["username"] is None


def test_multi_auth_no_auth_provided(mini_app):
    # This will still go into the first auth (jwt auth) and fail
    # for not having a token
    resp = mini_app.test_client().get("/dummy_auth_endpoint", headers={})
    assert resp.status_code == 401
    assert resp.json["message"] == "Unable to process token"


def test_multi_auth_invalid_jwt(mini_app):
    resp = mini_app.test_client().get(
        "/dummy_auth_endpoint", headers={"X-SGG-Token": "not-a-token"}
    )
    assert resp.status_code == 401
    assert resp.json["message"] == "Unable to process token"


def test_multi_auth_invalid_key(mini_app):
    resp = mini_app.test_client().get("/dummy_auth_endpoint", headers={"X-Auth": "not-a-token"})
    assert resp.status_code == 401
    assert (
        resp.json["message"]
        == "The server could not verify that you are authorized to access the URL requested"
    )
