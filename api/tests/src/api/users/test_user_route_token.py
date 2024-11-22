from src.auth.api_jwt_auth import create_jwt_for_user
from tests.src.db.models.factories import UserFactory

##################
# POST /token
##################


def test_post_user_route_token_200(client, api_auth_token):
    resp = client.post(
        "/v1/users/token", headers={"X-Auth": api_auth_token, "X-OAuth-login-gov": "test"}
    )
    response_data = resp.get_json()["data"]
    expected_response_data = {
        "token": "the token goes here!",
        "user": {
            "user_id": "abc-...",
            "email": "example@gmail.com",
            "external_user_type": "login_gov",
        },
        "is_user_new": True,
    }
    assert resp.status_code == 200
    assert response_data == expected_response_data


def test_post_user_route_token_400(client, api_auth_token):
    resp = client.post("v1/users/token", headers={"X-Auth": api_auth_token})
    assert resp.status_code == 400
    assert resp.get_json()["message"] == "Missing X-OAuth-login-gov header"


def test_post_user_route_token_logout_200(
    enable_factory_create, client, db_session, api_auth_token
):
    user = UserFactory.create()
    token, _ = create_jwt_for_user(user, db_session)
    db_session.commit()

    resp = client.post("v1/users/token/logout", headers={"X-SGG-Token": token})

    assert resp.status_code == 200


def test_post_user_route_token_logout_invalid(
    enable_factory_create, client, db_session, api_auth_token
):
    user = UserFactory.create()

    token, session = create_jwt_for_user(user, db_session)
    session.is_valid = False
    db_session.commit()

    resp = client.post("v1/users/token/logout", headers={"X-SGG-Token": token})

    assert resp.status_code == 401
    assert resp.get_json()["message"] == "Token is no longer valid"
