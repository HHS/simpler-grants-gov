import pytest

from tests.src.db.models.factories import UserApiKeyFactory


def get_agency_search_request(
    page_offset: int = 1,
    page_size: int = 25,
    sort_order: list[dict] | None = None,
    query: str | None = None,
    has_active_opportunity_one_of: list[bool] | None = None,
    opportunity_statuses_one_of: list[str] | None = None,
    is_test_agency_one_of: list[bool] | None = None,
):
    """Helper function to create agency search request payload"""
    if sort_order is None:
        sort_order = [{"order_by": "agency_code", "sort_direction": "ascending"}]

    req = {
        "pagination": {
            "page_offset": page_offset,
            "page_size": page_size,
            "sort_order": sort_order,
        }
    }

    filters = {}

    if has_active_opportunity_one_of is not None:
        filters["has_active_opportunity"] = {"one_of": has_active_opportunity_one_of}

    if opportunity_statuses_one_of is not None:
        filters["opportunity_statuses"] = {"one_of": opportunity_statuses_one_of}

    if is_test_agency_one_of is not None:
        filters["is_test_agency"] = {"one_of": is_test_agency_one_of}

    if len(filters) > 0:
        req["filters"] = filters

    if query is not None:
        req["query"] = query

    return req


@pytest.mark.parametrize(
    "method,url,body",
    [
        ("POST", "/v1/agencies/search", get_agency_search_request()),
    ],
)
def test_agency_search_unauthorized_401_env_key(client, api_auth_token, method, url, body):
    """Test agency search endpoint with invalid environment API key (X-Auth header)"""
    # open is just the generic method that post/get/etc. call under the hood
    response = client.open(url, method=method, json=body, headers={"X-Auth": "incorrect token"})

    assert response.status_code == 401
    assert (
        response.get_json()["message"]
        == "The server could not verify that you are authorized to access the URL requested"
    )


@pytest.mark.parametrize(
    "method,url,body",
    [
        ("POST", "/v1/agencies/search", get_agency_search_request()),
    ],
)
def test_agency_search_unauthorized_401_api_user_key(client, method, url, body):
    """Test agency search endpoint with invalid API user key (X-API-Key header)"""
    response = client.open(url, method=method, json=body, headers={"X-API-Key": "invalid-api-key"})

    assert response.status_code == 401
    assert response.get_json()["message"] == "Invalid API key"


@pytest.mark.parametrize(
    "method,url,body",
    [
        ("POST", "/v1/agencies/search", get_agency_search_request()),
    ],
)
def test_agency_search_unauthorized_401_no_auth(client, method, url, body):
    """Test agency search endpoint with no authentication headers"""
    response = client.open(url, method=method, json=body, headers={})

    assert response.status_code == 401


# Note: Agency search endpoint test is omitted due to OpenSearch infrastructure
# requirements in the test environment. Authentication for search endpoint is tested
# via the parametrized unauthorized tests above.


def test_agency_search_with_inactive_api_user_key(client, enable_factory_create, db_session):
    """Test agency search endpoint with inactive API user key"""
    inactive_api_key = UserApiKeyFactory.create(is_active=False)
    db_session.commit()

    response = client.post(
        "/v1/agencies/search",
        json=get_agency_search_request(),
        headers={"X-API-Key": inactive_api_key.key_id},
    )

    assert response.status_code == 401
    assert response.get_json()["message"] == "API key is inactive"
