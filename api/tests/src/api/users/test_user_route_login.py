


def test_user_login(client):
    resp = client.get("/v1/users/login", follow_redirects=True)
    print(resp)
