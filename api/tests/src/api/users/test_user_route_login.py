import urllib

from src.auth.login_gov_jwt_auth import get_config

# To help illustrate what we are testing, here is a diagram
#
#   Our endpoints                    Fake/test endpoints
#   =============                    ===================
#
# ._________________.               .____________________.
# |                 | redirects to  |                    |
# |     /login      | ------------->|  /oauth-authorize  |
# |_________________|               |____________________|
#                                  /
#                redirects to     /
#          |----------------------
# .________V________.               .____________________.
# |                 | redirects to  |                    |
# | /login/callback | ------------->|   /login/result    |
# |_________________|               |____________________|
#
# TODO - this'll be more complex when I add the calls to the token endpoint


def test_user_login_flow_302(client):
    """Happy path for a user logging in"""
    # TODO - as we build out the callback logic, a lot more will be checked/tested here
    #        and more tests will be added for various error scenarios
    login_gov_config = get_config()
    resp = client.get("/v1/users/login", follow_redirects=True)

    # The final endpoint returns a 200
    # and dumps the params it was called with
    assert resp.status_code == 200
    resp_json = resp.get_json()
    # These are static at the moment, will test more when logic built out
    assert resp_json["is_user_new"] == "0"
    assert resp_json["message"] == "success"

    # History contains each redirect, we redirected 3 times
    assert len(resp.history) == 3

    first_redirect, second_redirect, third_redirect = resp.history

    # Redirect to oauth
    assert first_redirect.status_code == 302
    first_redirect_url = urllib.parse.urlparse(first_redirect.headers["Location"])
    assert first_redirect_url.path == "/test-endpoint/oauth-authorize"

    first_redirect_params = urllib.parse.parse_qs(first_redirect_url.query)
    assert first_redirect_params["client_id"][0] == login_gov_config.client_id
    assert first_redirect_params["nonce"][0] is not None
    assert first_redirect_params["state"][0] is not None
    assert first_redirect_params["redirect_uri"][0] == "http://localhost/v1/users/login/callback"
    assert first_redirect_params["acr_values"][0] == login_gov_config.acr_value
    assert first_redirect_params["scope"][0] == login_gov_config.scope
    assert first_redirect_params["prompt"][0] == "select_account"
    assert first_redirect_params["response_type"][0] == "code"

    # Redirect back to our callback endpoint
    assert second_redirect.status_code == 302
    second_redirect_url = urllib.parse.urlparse(second_redirect.headers["Location"])
    assert second_redirect_url.path == "/v1/users/login/callback"

    second_redirect_params = urllib.parse.parse_qs(second_redirect_url.query)
    assert second_redirect_params["code"][0] is not None
    assert second_redirect_params["state"][0] == first_redirect_params["state"][0]

    # Redirect to the final destination page
    assert third_redirect.status_code == 302
    third_redirect_url = urllib.parse.urlparse(third_redirect.headers["Location"])
    assert third_redirect_url.path == "/v1/users/login/result"

    third_redirect_params = urllib.parse.parse_qs(third_redirect_url.query)
    assert third_redirect_params["message"][0] == "success"
    assert third_redirect_params["is_user_new"][0] == "0"


def test_thing(app):
    pass
