import urllib
from datetime import datetime

from grants_shared.api.route_utils import raise_flask_error
from grants_shared.auth import login_gov_jwt_auth
from grants_shared.auth.api_jwt_auth import JwtAuth

from src.auth.api_jwt_auth import create_jwt_for_user
from tests.src.db.models.factories import LinkExternalUserFactory


def validate_redirects_occurred(resp):
    login_gov_config = login_gov_jwt_auth.get_config()
    # History contains each redirect, we redirected 3 times
    assert len(resp.history) == 3

    first_redirect, second_redirect, third_redirect = resp.history

    # Redirect to the oauth-logout
    first_redirect_url = urllib.parse.urlparse(first_redirect.headers["Location"])
    assert first_redirect_url.path == "/test-endpoint/oauth-logout"

    first_redirect_params = urllib.parse.parse_qs(first_redirect_url.query)
    assert first_redirect_params["client_id"][0] == login_gov_config.client_id
    assert first_redirect_params["state"][0] is not None
    assert (
        first_redirect_params["post_logout_redirect_uri"][0]
        == "http://localhost/v1/users/logout/callback"
    )

    # Redirect back to our callback endpoint
    assert second_redirect.status_code == 302
    second_redirect_url = urllib.parse.urlparse(second_redirect.headers["Location"])
    assert second_redirect_url.path == "/v1/users/logout/callback"

    second_redirect_params = urllib.parse.parse_qs(second_redirect_url.query)
    assert second_redirect_params["state"][0] == first_redirect_params["state"][0]

    # Redirect to the final destination page
    assert third_redirect.status_code == 302
    third_redirect_url = urllib.parse.urlparse(third_redirect.headers["Location"])
    assert third_redirect_url.path == "/test-endpoint/oauth-logout-result"

    third_redirect_params = urllib.parse.parse_qs(third_redirect_url.query)
    assert third_redirect_params["message"][0] == "success"


def test_user_logout_without_token_302(client, db_session):
    resp = client.get("v1/users/logout", follow_redirects=True)

    assert resp.status_code == 200
    resp_json = resp.get_json()
    assert resp_json["message"] == "success"

    validate_redirects_occurred(resp)


def test_user_logout_with_token_302(client, db_session, enable_factory_create):
    external_user = LinkExternalUserFactory.create()
    token, user_token_session = create_jwt_for_user(external_user.user, db_session)
    db_session.commit()

    resp = client.get("v1/users/logout", follow_redirects=True, headers={"X-SGG-Token": token})

    assert resp.status_code == 200
    resp_json = resp.get_json()
    assert resp_json["message"] == "success"

    db_session.refresh(user_token_session)
    assert user_token_session.is_valid is False

    validate_redirects_occurred(resp)


def test_user_logout_with_invalid_token_302(client, db_session, enable_factory_create):
    external_user = LinkExternalUserFactory.create()
    token, user_token_session = create_jwt_for_user(external_user.user, db_session)
    user_token_session.expires_at = datetime(2020, 1, 1, 12, 0, 0)
    db_session.commit()

    resp = client.get("v1/users/logout", follow_redirects=True, headers={"X-SGG-Token": token})

    assert resp.status_code == 200
    resp_json = resp.get_json()
    assert resp_json["message"] == "success"

    db_session.refresh(user_token_session)
    # Still marked as True because the validation failed due to the expiration time
    assert user_token_session.is_valid is True

    validate_redirects_occurred(resp)


def test_user_logout_with_internal_issue_4xx(
    client, db_session, enable_factory_create, monkeypatch
):

    def err_func(*args):
        raise_flask_error(422, "the eventual error message")

    monkeypatch.setattr(JwtAuth, "parse_jwt_for_user", err_func)

    external_user = LinkExternalUserFactory.create()
    token, _ = create_jwt_for_user(external_user.user, db_session)
    db_session.commit()

    resp = client.get("v1/users/logout", follow_redirects=True, headers={"X-SGG-Token": token})

    assert resp.status_code == 200
    resp_json = resp.get_json()
    assert resp_json["message"] == "error"
    assert resp_json["error_description"] == "the eventual error message"


def test_user_logout_with_internal_issue_500(
    client, db_session, enable_factory_create, monkeypatch
):

    def err_func(*args):
        raise_flask_error(500, "an error message we won't see")

    monkeypatch.setattr(JwtAuth, "parse_jwt_for_user", err_func)

    external_user = LinkExternalUserFactory.create()
    token, _ = create_jwt_for_user(external_user.user, db_session)
    db_session.commit()

    resp = client.get("v1/users/logout", follow_redirects=True, headers={"X-SGG-Token": token})

    assert resp.status_code == 200
    resp_json = resp.get_json()
    assert resp_json["message"] == "error"
    assert resp_json["error_description"] == "internal error"
