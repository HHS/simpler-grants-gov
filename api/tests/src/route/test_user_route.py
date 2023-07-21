import uuid

import faker
import pytest

from tests.src.util.parametrize_utils import powerset

fake = faker.Faker()


def get_base_request():
    return {
        "first_name": fake.first_name(),
        "middle_name": fake.first_name(),
        "last_name": fake.last_name(),
        "date_of_birth": "2022-01-01",
        "phone_number": "123-456-7890",
        "is_active": True,
        "roles": [{"type": "ADMIN"}, {"type": "USER"}],
    }


@pytest.fixture
def base_request():
    return get_base_request()


@pytest.fixture
def created_user(client, api_auth_token, base_request):
    response = client.post("/v1/users", json=base_request, headers={"X-Auth": api_auth_token})
    return response.get_json()["data"]


test_create_and_get_user_data = [
    pytest.param([], id="empty roles"),
    pytest.param([{"type": "ADMIN"}, {"type": "USER"}], id="all roles"),
]


@pytest.mark.parametrize("roles", test_create_and_get_user_data)
def test_create_and_get_user(client, base_request, api_auth_token, roles):
    # Create a user
    request = {
        **base_request,
        "roles": roles,
    }
    post_response = client.post("/v1/users", json=request, headers={"X-Auth": api_auth_token})
    post_response_data = post_response.get_json()["data"]
    expected_response = {
        **request,
        "id": post_response_data["id"],
        "created_at": post_response_data["created_at"],
        "updated_at": post_response_data["updated_at"],
    }

    assert post_response.status_code == 201
    assert post_response_data == expected_response
    assert post_response_data["created_at"] is not None
    assert post_response_data["updated_at"] is not None

    # Get the user
    user_id = post_response.get_json()["data"]["id"]
    get_response = client.get(f"/v1/users/{user_id}", headers={"X-Auth": api_auth_token})

    assert get_response.status_code == 200

    get_response_data = get_response.get_json()["data"]
    assert get_response_data == expected_response


test_create_user_bad_request_data = [
    pytest.param(
        {},
        {
            "first_name": ["Missing data for required field."],
            "last_name": ["Missing data for required field."],
            "phone_number": ["Missing data for required field."],
            "date_of_birth": ["Missing data for required field."],
            "is_active": ["Missing data for required field."],
            "roles": ["Missing data for required field."],
        },
        id="missing all required fields",
    ),
    pytest.param(
        {
            "first_name": 1,
            "middle_name": 2,
            "last_name": 3,
            "date_of_birth": 4,
            "phone_number": 5,
            "is_active": 6,
            "roles": 7,
        },
        {
            "first_name": ["Not a valid string."],
            "middle_name": ["Not a valid string."],
            "last_name": ["Not a valid string."],
            "phone_number": ["Not a valid string."],
            "date_of_birth": ["Not a valid date."],
            "is_active": ["Not a valid boolean."],
            "roles": ["Not a valid list."],
        },
        id="invalid types",
    ),
    pytest.param(
        get_base_request() | {"roles": [{"type": "Mime"}, {"type": "Clown"}]},
        {
            "roles": {
                "0": {"type": ["Must be one of: USER, ADMIN."]},
                "1": {"type": ["Must be one of: USER, ADMIN."]},
            }
        },
        id="invalid role type",
    ),
]


@pytest.mark.parametrize("request_data,expected_response_data", test_create_user_bad_request_data)
def test_create_user_bad_request(client, api_auth_token, request_data, expected_response_data):
    response = client.post("/v1/users", json=request_data, headers={"X-Auth": api_auth_token})
    assert response.status_code == 422

    response_data = response.get_json()["detail"]["json"]
    assert response_data == expected_response_data


def test_patch_user(client, api_auth_token, created_user):
    user_id = created_user["id"]
    patch_request = {"first_name": fake.first_name()}
    patch_response = client.patch(
        f"/v1/users/{user_id}", json=patch_request, headers={"X-Auth": api_auth_token}
    )
    patch_response_data = patch_response.get_json()["data"]
    expected_response_data = {
        **created_user,
        **patch_request,
        "updated_at": patch_response_data["updated_at"],
    }

    assert patch_response.status_code == 200
    assert patch_response_data == expected_response_data

    get_response = client.get(f"/v1/users/{user_id}", headers={"X-Auth": api_auth_token})
    get_response_data = get_response.get_json()["data"]

    assert get_response_data == expected_response_data


@pytest.mark.parametrize("initial_roles", powerset([{"type": "ADMIN"}, {"type": "USER"}]))
@pytest.mark.parametrize("updated_roles", powerset([{"type": "ADMIN"}, {"type": "USER"}]))
def test_patch_user_roles(client, base_request, api_auth_token, initial_roles, updated_roles):
    post_request = {
        **base_request,
        "roles": initial_roles,
    }
    created_user = client.post(
        "/v1/users", json=post_request, headers={"X-Auth": api_auth_token}
    ).get_json()["data"]
    user_id = created_user["id"]

    patch_request = {"roles": updated_roles}
    patch_response = client.patch(
        f"/v1/users/{user_id}", json=patch_request, headers={"X-Auth": api_auth_token}
    )
    patch_response_data = patch_response.get_json()["data"]
    expected_response_data = {
        **created_user,
        **patch_request,
        "updated_at": patch_response_data["updated_at"],
    }

    assert patch_response.status_code == 200
    assert patch_response_data == expected_response_data

    get_response = client.get(f"/v1/users/{user_id}", headers={"X-Auth": api_auth_token})
    get_response_data = get_response.get_json()["data"]

    assert get_response_data == expected_response_data


test_unauthorized_data = [
    pytest.param("post", "/v1/users", get_base_request(), id="post"),
    pytest.param("get", f"/v1/users/{uuid.uuid4()}", None, id="get"),
    pytest.param("patch", f"/v1/users/{uuid.uuid4()}", {}, id="patch"),
]


@pytest.mark.parametrize("method,url,body", test_unauthorized_data)
def test_unauthorized(client, method, url, body, api_auth_token):
    expected_message = (
        "The server could not verify that you are authorized to access the URL requested"
    )
    response = getattr(client, method)(url, json=body, headers={"X-Auth": "incorrect token"})

    assert response.status_code == 401
    assert response.get_json()["message"] == expected_message


test_not_found_data = [
    pytest.param("get", None, id="get"),
    pytest.param("patch", {}, id="patch"),
]


@pytest.mark.parametrize("method,body", test_not_found_data)
def test_not_found(client, api_auth_token, method, body):
    user_id = uuid.uuid4()
    url = f"/v1/users/{user_id}"
    response = getattr(client, method)(url, json=body, headers={"X-Auth": api_auth_token})

    assert response.status_code == 404
    assert response.get_json()["message"] == f"Could not find user with ID {user_id}"
