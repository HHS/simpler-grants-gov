

#####################################
# POST user token tests
#####################################

def test_post_user_route_token_200(client, api_auth_token):
    resp= client.post(f"/v1/users/user/token", headers={"X-Auth": api_auth_token, "X-OAuth-login-gov": "test_token" })
    assert resp.status_code == 200
    response_data = resp.get_json()["data"]


def test_post_user_route_token_400(client, api_auth_token):
    resp= client.post(f"v1/users/user/token", headers={"X-Auth": api_auth_token})
    assert resp.status_code == 400
    assert resp.get_json()["message"] == "Missing X-OAuth-login-gov header"