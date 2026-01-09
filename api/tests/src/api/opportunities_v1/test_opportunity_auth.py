import pytest

from tests.src.api.opportunities_v1.conftest import get_search_request
from tests.src.db.models.factories import OpportunityFactory, UserApiKeyFactory


@pytest.mark.parametrize(
    "method,url,body",
    [
        ("POST", "/v1/opportunities/search", get_search_request()),
        ("GET", "/v1/opportunities/1", None),
    ],
)
def test_opportunity_unauthorized_401_env_key(client, api_auth_token, method, url, body):
    """Test opportunity endpoints with invalid environment API key (X-Auth header)"""
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
        ("POST", "/v1/opportunities/search", get_search_request()),
        ("GET", "/v1/opportunities/1", None),
    ],
)
def test_opportunity_unauthorized_401_api_user_key(client, method, url, body):
    """Test opportunity endpoints with invalid API user key (X-API-Key header)"""
    response = client.open(url, method=method, json=body, headers={"X-API-Key": "invalid-api-key"})

    assert response.status_code == 401
    assert response.get_json()["message"] == "Invalid API key"


@pytest.mark.parametrize(
    "method,url,body",
    [
        ("POST", "/v1/opportunities/search", get_search_request()),
        ("GET", "/v1/opportunities/1", None),
    ],
)
def test_opportunity_unauthorized_401_no_auth(client, method, url, body):
    """Test opportunity endpoints with no authentication headers"""
    response = client.open(url, method=method, json=body, headers={})

    assert response.status_code == 401


# Note: Opportunity search endpoint test is omitted due to OpenSearch infrastructure
# requirements in the test environment. Authentication for search endpoint is tested
# via the parametrized unauthorized tests above.


def test_opportunity_get_legacy_success_with_api_user_key(
    client, enable_factory_create, db_session, user_api_key, user_api_key_id
):
    """Test legacy opportunity get endpoint with valid API user key"""
    # Create an opportunity to get
    opportunity = OpportunityFactory.create()

    response = client.get(
        f"/v1/opportunities/{opportunity.legacy_opportunity_id}",
        headers={"X-API-Key": user_api_key_id},
    )

    assert response.status_code == 200
    assert response.get_json()["message"] == "Success"
    assert response.get_json()["data"]["opportunity_id"] == str(opportunity.opportunity_id)

    # Verify the API key's last_used was updated
    db_session.refresh(user_api_key)
    assert user_api_key.last_used is not None


def test_opportunity_get_success_with_api_user_key(
    client, enable_factory_create, db_session, user_api_key, user_api_key_id
):
    """Test opportunity get endpoint with valid API user key"""
    # Create an opportunity to get
    opportunity = OpportunityFactory.create()

    response = client.get(
        f"/v1/opportunities/{opportunity.opportunity_id}", headers={"X-API-Key": user_api_key_id}
    )

    assert response.status_code == 200
    assert response.get_json()["message"] == "Success"
    assert response.get_json()["data"]["opportunity_id"] == str(opportunity.opportunity_id)

    # Verify the API key's last_used was updated
    db_session.refresh(user_api_key)
    assert user_api_key.last_used is not None


def test_opportunity_search_with_inactive_api_user_key(client, enable_factory_create, db_session):
    """Test opportunity search endpoint with inactive API user key"""
    inactive_api_key = UserApiKeyFactory.create(is_active=False)
    db_session.commit()

    response = client.post(
        "/v1/opportunities/search",
        json=get_search_request(),
        headers={"X-API-Key": inactive_api_key.key_id},
    )

    assert response.status_code == 401
    assert response.get_json()["message"] == "API key is inactive"


def test_opportunity_get_with_inactive_api_user_key(client, enable_factory_create, db_session):
    """Test opportunity get endpoint with inactive API user key"""
    inactive_api_key = UserApiKeyFactory.create(is_active=False)
    # Create an opportunity to get
    opportunity = OpportunityFactory.create()
    db_session.commit()

    response = client.get(
        f"/v1/opportunities/{opportunity.opportunity_id}",
        headers={"X-API-Key": inactive_api_key.key_id},
    )

    assert response.status_code == 401
    assert response.get_json()["message"] == "API key is inactive"


def test_opportunity_auth_precedence_api_user_key_first(
    client, enable_factory_create, db_session, api_auth_token, user_api_key, user_api_key_id
):
    """Test that API user key takes precedence over environment API key when both are provided"""
    # Create an opportunity to get
    opportunity = OpportunityFactory.create()
    db_session.commit()

    # Send both headers - API user key should take precedence
    response = client.get(
        f"/v1/opportunities/{opportunity.opportunity_id}",
        headers={"X-API-Key": user_api_key_id, "X-Auth": api_auth_token},
    )

    assert response.status_code == 200
    assert response.get_json()["message"] == "Success"

    # Verify the API user key's last_used was updated (indicating it was used)
    db_session.refresh(user_api_key)
    assert user_api_key.last_used is not None
