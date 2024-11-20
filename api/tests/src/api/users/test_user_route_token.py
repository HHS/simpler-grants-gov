##################
# POST /user/token
##################


def test_post_user_route_token_200(client, api_auth_token):
    resp = client.post(
        "/v1/users/user/token", headers={"X-Auth": api_auth_token, "X-OAuth-login-gov": "test"}
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
    resp = client.post("v1/users/user/token", headers={"X-Auth": api_auth_token})
    assert resp.status_code == 400
    assert resp.get_json()["message"] == "Missing X-OAuth-login-gov header"
