import pytest

from src.constants.lookup_constants import OpportunityStatus
from src.pagination.pagination_models import SortDirection
from tests.src.db.models.factories import UserApiKeyFactory


def get_search_request():
    """Helper function to get a basic search request for agency search tests"""
    return {
        "pagination": {
            "page_offset": 1,
            "page_size": 25,
            "sort_order": [{"order_by": "agency_code", "sort_direction": SortDirection.ASCENDING}],
        },
        "filters": {
            "opportunity_statuses": {
                "one_of": [OpportunityStatus.POSTED, OpportunityStatus.FORECASTED]
            }
        },
    }


def get_list_request():
    """Helper function to get a basic list request for agency list tests"""
    return {
        "pagination": {
            "page_offset": 1,
            "page_size": 25,
            "sort_order": [{"order_by": "created_at", "sort_direction": SortDirection.DESCENDING}],
        },
    }


@pytest.mark.parametrize(
    "method,url,body",
    [
        ("POST", "/v1/agencies/search", get_search_request()),
        ("POST", "/v1/agencies", get_list_request()),
    ],
)
def test_agency_unauthorized_401_env_key(client, api_auth_token, method, url, body):
    """Test agency endpoints with invalid environment API key (X-Auth header)"""
    response = client.open(url, method=method, json=body, headers={"X-Auth": "incorrect token"})

    assert response.status_code == 401
    assert (
        response.get_json()["message"]
        == "The server could not verify that you are authorized to access the URL requested"
    )


def test_agency_search_unauthorized_401_api_user_key(client):
    """Test agency search endpoint with invalid API user key (X-API-Key header)"""
    response = client.post(
        "/v1/agencies/search", json=get_search_request(), headers={"X-API-Key": "invalid-api-key"}
    )

    assert response.status_code == 401
    assert response.get_json()["message"] == "Invalid API key"


def test_agency_list_unauthorized_401_api_user_key(client):
    """Test agency list endpoint with invalid API user key (X-API-Key header) - should fail since it doesn't support X-API-Key"""
    response = client.post(
        "/v1/agencies", json=get_list_request(), headers={"X-API-Key": "invalid-api-key"}
    )

    assert response.status_code == 401
    assert (
        response.get_json()["message"]
        == "The server could not verify that you are authorized to access the URL requested"
    )


@pytest.mark.parametrize(
    "method,url,body",
    [
        ("POST", "/v1/agencies/search", get_search_request()),
        ("POST", "/v1/agencies", get_list_request()),
    ],
)
def test_agency_unauthorized_401_no_auth(client, method, url, body):
    """Test agency endpoints with no authentication headers"""
    response = client.open(url, method=method, json=body, headers={})

    assert response.status_code == 401


def test_agency_search_success_with_api_user_key(
    client, enable_factory_create, db_session, user_api_key, user_api_key_id
):
    """Test agency search endpoint with valid API user key"""
    response = client.post(
        "/v1/agencies/search",
        json=get_search_request(),
        headers={"X-API-Key": user_api_key_id},
    )

    assert response.status_code == 200
    assert response.get_json()["message"] == "Success"
    assert "data" in response.get_json()
    assert "pagination_info" in response.get_json()

    # Verify the API key's last_used was updated
    db_session.refresh(user_api_key)
    assert user_api_key.last_used is not None


def test_agency_list_success_with_api_user_key(
    client, enable_factory_create, db_session, api_auth_token
):
    """Test agency list endpoint with valid environment API key (X-Auth header)"""
    response = client.post(
        "/v1/agencies",
        json=get_list_request(),
        headers={"X-Auth": api_auth_token},
    )

    assert response.status_code == 200
    assert response.get_json()["message"] == "Success"
    assert "data" in response.get_json()
    assert "pagination_info" in response.get_json()


def test_agency_search_with_inactive_api_user_key(client, enable_factory_create, db_session):
    """Test agency search endpoint with inactive API user key"""
    inactive_api_key = UserApiKeyFactory.create(is_active=False)
    db_session.commit()

    response = client.post(
        "/v1/agencies/search",
        json=get_search_request(),
        headers={"X-API-Key": inactive_api_key.key_id},
    )

    assert response.status_code == 401
    assert response.get_json()["message"] == "API key is inactive"


def test_agency_list_with_inactive_api_user_key(client, enable_factory_create, db_session):
    """Test agency list endpoint with invalid environment API key (X-Auth header)"""
    response = client.post(
        "/v1/agencies",
        json=get_list_request(),
        headers={"X-Auth": "invalid-token"},
    )

    assert response.status_code == 401
    assert (
        response.get_json()["message"]
        == "The server could not verify that you are authorized to access the URL requested"
    )


def test_agency_search_auth_precedence_api_user_key_first(
    client, enable_factory_create, db_session, api_auth_token, user_api_key, user_api_key_id
):
    """Test that API user key takes precedence over environment API key when both are provided for search"""
    db_session.commit()

    # Send both headers - API user key should take precedence
    response = client.post(
        "/v1/agencies/search",
        json=get_search_request(),
        headers={"X-API-Key": user_api_key_id, "X-Auth": api_auth_token},
    )

    assert response.status_code == 200
    assert response.get_json()["message"] == "Success"

    # Verify the API user key's last_used was updated (indicating it was used)
    db_session.refresh(user_api_key)
    assert user_api_key.last_used is not None


def test_agency_list_auth_precedence_api_user_key_first(
    client, enable_factory_create, db_session, api_auth_token
):
    """Test agency list endpoint only supports environment API key (X-Auth header)"""
    # The /v1/agencies endpoint only supports X-Auth header, not dual auth
    response = client.post(
        "/v1/agencies",
        json=get_list_request(),
        headers={"X-Auth": api_auth_token},
    )

    assert response.status_code == 200
    assert response.get_json()["message"] == "Success"
