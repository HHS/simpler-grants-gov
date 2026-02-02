import uuid

from src.auth.api_jwt_auth import create_jwt_for_user
from tests.src.db.models.factories import LinkExternalUserFactory, UserProfileFactory

################
# GET user tests
################


def test_get_user_200(enable_factory_create, client, db_session, api_auth_token):
    external_user = LinkExternalUserFactory.create()
    token, _ = create_jwt_for_user(external_user.user, db_session)
    db_session.commit()

    resp = client.get(f"/v1/users/{external_user.user_id}", headers={"X-SGG-Token": token})

    assert resp.status_code == 200
    assert resp.get_json()["data"]["user_id"] == str(external_user.user_id)


def test_get_user_401(enable_factory_create, client, db_session, api_auth_token):
    external_user = LinkExternalUserFactory.create()
    token, _ = create_jwt_for_user(external_user.user, db_session)
    db_session.commit()

    random_uuid = str(uuid.uuid4())
    resp = client.get(f"/v1/users/{random_uuid}", headers={"X-SGG-Token": token})
    assert resp.status_code == 401


def test_get_user_with_profile_200(enable_factory_create, client, db_session, api_auth_token):
    external_user = LinkExternalUserFactory.create()
    UserProfileFactory.create(user=external_user.user)
    token, _ = create_jwt_for_user(external_user.user, db_session)
    db_session.commit()

    resp = client.get(f"/v1/users/{external_user.user_id}", headers={"X-SGG-Token": token})
    assert resp.status_code == 200
    assert resp.get_json()["data"]["user_id"] == str(external_user.user_id)
