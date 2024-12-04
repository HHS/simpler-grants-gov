import urllib

import src.auth.login_gov_jwt_auth as login_gov_jwt_auth
from src.api.route_utils import raise_flask_error

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
    login_gov_config = login_gov_jwt_auth.get_config()
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


def test_user_login_flow_error_in_login_302(client, monkeypatch):
    """Test that the redirect happens to the final endpoint directly if an error occurs"""

    # Force the api to error by overriding a function call
    def override(*args, **kwargs):
        raise Exception("I am an error")

    monkeypatch.setattr("flask.url_for", override)

    resp = client.get("/v1/users/login", follow_redirects=True)

    # The final endpoint returns a 200
    # and dumps the params it was called with
    assert resp.status_code == 200
    resp_json = resp.get_json()

    assert resp_json["message"] == "error"
    assert resp_json["error_description"] == "internal error"

    # History contains each redirect, we redirected just once
    assert len(resp.history) == 1
    redirect = resp.history[0]

    assert redirect.status_code == 302
    redirect_url = urllib.parse.urlparse(redirect.headers["Location"])
    assert redirect_url.path == "/v1/users/login/result"


def test_user_login_flow_error_in_http_error_302(client, monkeypatch):
    """Test that the redirect happens to the final endpoint directly if an error occurs

    Only difference from above test is that the error message gets passed through
    for an HTTPError that we rose
    """

    # Force the api to error by overriding a function call
    def override(*args, **kwargs):
        raise_flask_error(422, "I am an error")

    monkeypatch.setattr("flask.url_for", override)

    resp = client.get("/v1/users/login", follow_redirects=True)

    # The final endpoint returns a 200
    # and dumps the params it was called with
    assert resp.status_code == 200
    resp_json = resp.get_json()

    assert resp_json["message"] == "error"
    assert resp_json["error_description"] == "I am an error"

    # History contains each redirect, we redirected just once
    assert len(resp.history) == 1
    redirect = resp.history[0]

    assert redirect.status_code == 302
    redirect_url = urllib.parse.urlparse(redirect.headers["Location"])
    assert redirect_url.path == "/v1/users/login/result"


def test_user_login_flow_error_in_http_error_internal_302(client, monkeypatch):
    """Test that the redirect happens to the final endpoint directly if an error occurs

    Even if it is raised by raise_flask_error, if it is a 5xx error, we want to not display the message
    """

    # Force the api to error by overriding a function call
    def override(*args, **kwargs):
        raise_flask_error(503, "I am an internal error")

    monkeypatch.setattr("flask.url_for", override)

    resp = client.get("/v1/users/login", follow_redirects=True)

    # The final endpoint returns a 200
    # and dumps the params it was called with
    assert resp.status_code == 200
    resp_json = resp.get_json()

    assert resp_json["message"] == "error"
    assert resp_json["error_description"] == "internal error"

    # History contains each redirect, we redirected just once
    assert len(resp.history) == 1
    redirect = resp.history[0]

    assert redirect.status_code == 302
    redirect_url = urllib.parse.urlparse(redirect.headers["Location"])
    assert redirect_url.path == "/v1/users/login/result"
