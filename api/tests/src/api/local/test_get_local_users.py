from src.auth.api_jwt_auth import create_jwt_for_user
from tests.src.db.models.factories import LinkExternalUserFactory, UserApiKeyFactory, UserFactory


def test_get_local_users_200(client, db_session, enable_factory_create):

    user_with_nothing = UserFactory.create()
    user_with_only_email = LinkExternalUserFactory.create().user
    user_with_profile = UserFactory.create(with_profile=True)

    user_with_api_key = UserApiKeyFactory.create().user
    user_with_jwt_key = UserFactory.create()
    create_jwt_for_user(user_with_jwt_key, db_session)

    user_with_everything = UserFactory.create(with_profile=True)
    UserApiKeyFactory.create(user=user_with_everything)
    LinkExternalUserFactory.create(user=user_with_everything)
    create_jwt_for_user(user_with_everything, db_session)

    # Push the JWTs created into the DB
    db_session.commit()

    resp = client.get("/local/local-users")
    assert resp.status_code == 200
    assert resp.json["message"] == "Success"

    # There may be other users from other tests, just verify
    # the ones we created above exist
    users = resp.json["data"]
    assert len(users) >= 6

    user_map = {u["user_id"]: u for u in users}

    user_with_nothing_resp = user_map.get(str(user_with_nothing.user_id))
    assert user_with_nothing_resp is not None
    assert user_with_nothing_resp["first_name"] is None
    assert user_with_nothing_resp["last_name"] is None
    assert user_with_nothing_resp["oauth_id"] is None
    assert user_with_nothing_resp["user_jwt"] is None
    assert user_with_nothing_resp["user_api_key"] is None

    user_with_only_email_resp = user_map.get(str(user_with_only_email.user_id))
    assert user_with_only_email_resp is not None
    assert user_with_only_email_resp["first_name"] is None
    assert user_with_only_email_resp["last_name"] is None
    assert (
        user_with_only_email_resp["oauth_id"]
        == user_with_only_email.linked_login_gov_external_user.external_user_id
    )
    assert user_with_only_email_resp["user_jwt"] is None
    assert user_with_only_email_resp["user_api_key"] is None

    user_with_profile_resp = user_map.get(str(user_with_profile.user_id))
    assert user_with_profile_resp is not None
    assert user_with_profile_resp["first_name"] == user_with_profile.first_name
    assert user_with_profile_resp["last_name"] == user_with_profile.last_name
    assert user_with_profile_resp["oauth_id"] is None
    assert user_with_profile_resp["user_jwt"] is None
    assert user_with_profile_resp["user_api_key"] is None

    user_with_api_key_resp = user_map.get(str(user_with_api_key.user_id))
    assert user_with_api_key_resp is not None
    assert user_with_api_key_resp["first_name"] is None
    assert user_with_api_key_resp["last_name"] is None
    assert user_with_api_key_resp["oauth_id"] is None
    assert user_with_api_key_resp["user_jwt"] is None
    assert user_with_api_key_resp["user_api_key"] == user_with_api_key.api_keys[0].key_id

    user_with_jwt_key_resp = user_map.get(str(user_with_jwt_key.user_id))
    assert user_with_jwt_key_resp is not None
    assert user_with_jwt_key_resp["first_name"] is None
    assert user_with_jwt_key_resp["last_name"] is None
    assert user_with_jwt_key_resp["oauth_id"] is None
    assert user_with_jwt_key_resp["user_jwt"] is not None
    assert user_with_jwt_key_resp["user_api_key"] is None

    user_with_everything_resp = user_map.get(str(user_with_everything.user_id))
    assert user_with_everything_resp is not None
    assert user_with_everything_resp["first_name"] == user_with_everything.first_name
    assert user_with_everything_resp["last_name"] == user_with_everything.last_name
    assert (
        user_with_everything_resp["oauth_id"]
        == user_with_everything.linked_login_gov_external_user.external_user_id
    )
    assert user_with_everything_resp["user_jwt"] is not None
    assert user_with_everything_resp["user_api_key"] == user_with_everything.api_keys[0].key_id


def test_get_local_users_non_local_500(client, monkeypatch, caplog):
    monkeypatch.setenv("ENVIRONMENT", "not-local")

    resp = client.get("/local/local-users")
    assert resp.status_code == 500

    assert "Environment not-local is not local" in caplog.text
