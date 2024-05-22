import pytest

from tests.src.api.opportunities_v1.conftest import get_search_request


@pytest.mark.parametrize(
    "method,url,body",
    [
        ("POST", "/v1/opportunities/search", get_search_request()),
        ("GET", "/v1/opportunities/1", None),
    ],
)
def test_opportunity_unauthorized_401(client, api_auth_token, method, url, body):
    # open is just the generic method that post/get/etc. call under the hood
    response = client.open(url, method=method, json=body, headers={"X-Auth": "incorrect token"})

    assert response.status_code == 401
    assert (
        response.get_json()["message"]
        == "The server could not verify that you are authorized to access the URL requested"
    )
