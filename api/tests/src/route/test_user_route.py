import dataclasses
import uuid

import faker
import pytest

from src.db.models.user_models import RoleType, User
from tests.src.db.models.factories import RoleFactory, UserFactory
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


def get_search_request(
    phone_number: str | None = None,
    is_active: bool | None = None,
    role_type: str | None = None,
    page_offset: int = 1,
    page_size: int = 5,
    order_by: str = "id",
    sort_direction: str = "descending",
):
    req = {
        "paging": {"page_offset": page_offset, "page_size": page_size},
        "sorting": {"order_by": order_by, "sort_direction": sort_direction},
    }

    if phone_number is not None:
        req["phone_number"] = phone_number

    if is_active is not None:
        req["is_active"] = is_active

    if role_type is not None:
        req["role_type"] = role_type

    return req


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


@pytest.fixture
def setup_search_user_test(db_session, enable_factory_create):
    # Delete all users before the search test to avoid finding records from other tests
    db_session.query(User).delete()

    # Create a variety of users that we can search against

    # No roles
    UserFactory.create(phone_number="111-111-1111", is_active=True, roles=[])
    UserFactory.create(phone_number="111-111-1111", is_active=False, roles=[])

    # Just a user
    user = UserFactory.create(phone_number="222-222-2222", is_active=True, roles=[])
    RoleFactory.create(user=user, type=RoleType.USER)

    # Just an admin
    user = UserFactory.create(phone_number="222-222-2222", is_active=False, roles=[])
    RoleFactory.create(user=user, type=RoleType.ADMIN)

    # User and admin
    user = UserFactory.create(phone_number="333-333-3333", is_active=True, roles=[])
    RoleFactory.create(user=user, type=RoleType.USER)
    RoleFactory.create(user=user, type=RoleType.ADMIN)


@dataclasses.dataclass
class SearchExpectedValues:
    total_pages: int
    total_records: int

    response_record_count: int


@pytest.mark.parametrize(
    "search_request,expected_values",
    [
        # No filters, varying page sizes
        (
            get_search_request(),
            SearchExpectedValues(total_pages=1, total_records=5, response_record_count=5),
        ),
        (
            get_search_request(page_offset=2, page_size=1),
            SearchExpectedValues(total_pages=5, total_records=5, response_record_count=1),
        ),
        (
            get_search_request(page_offset=3, page_size=2),
            SearchExpectedValues(total_pages=3, total_records=5, response_record_count=1),
        ),
        (
            get_search_request(page_offset=200),
            SearchExpectedValues(total_pages=1, total_records=5, response_record_count=0),
        ),
        # No filters, varying sorts
        (
            get_search_request(sort_direction="ascending", order_by="id"),
            SearchExpectedValues(total_pages=1, total_records=5, response_record_count=5),
        ),
        (
            get_search_request(sort_direction="ascending", order_by="created_at"),
            SearchExpectedValues(total_pages=1, total_records=5, response_record_count=5),
        ),
        (
            get_search_request(sort_direction="descending", order_by="updated_at"),
            SearchExpectedValues(total_pages=1, total_records=5, response_record_count=5),
        ),
        # Varying filters
        (
            get_search_request(phone_number="111-111-1111"),
            SearchExpectedValues(total_pages=1, total_records=2, response_record_count=2),
        ),
        (
            get_search_request(phone_number="111-111-1111", is_active=True),
            SearchExpectedValues(total_pages=1, total_records=1, response_record_count=1),
        ),
        (
            get_search_request(phone_number="111-111-1111", role_type="USER"),
            SearchExpectedValues(total_pages=0, total_records=0, response_record_count=0),
        ),
        (
            get_search_request(phone_number="222-222-2222", role_type="USER"),
            SearchExpectedValues(total_pages=1, total_records=1, response_record_count=1),
        ),
        (
            get_search_request(role_type="USER"),
            SearchExpectedValues(total_pages=1, total_records=2, response_record_count=2),
        ),
        (
            get_search_request(role_type="ADMIN"),
            SearchExpectedValues(total_pages=1, total_records=2, response_record_count=2),
        ),
        (
            get_search_request(phone_number="444-444-4444"),
            SearchExpectedValues(total_pages=0, total_records=0, response_record_count=0),
        ),
    ],
)
def test_search_user(
    client, api_auth_token, db_session, setup_search_user_test, search_request, expected_values
):
    # This test relies on the users created in setup_search_user_test
    # See that fixture for specific values we're querying against
    resp = client.post("/v1/users/search", json=search_request, headers={"X-Auth": api_auth_token})

    search_response = resp.get_json()
    assert resp.status_code == 200

    pagination_info = search_response["pagination_info"]
    assert pagination_info["page_offset"] == search_request["paging"]["page_offset"]
    assert pagination_info["page_size"] == search_request["paging"]["page_size"]
    assert pagination_info["order_by"] == search_request["sorting"]["order_by"]
    assert pagination_info["sort_direction"] == search_request["sorting"]["sort_direction"]

    assert pagination_info["total_pages"] == expected_values.total_pages
    assert pagination_info["total_records"] == expected_values.total_records

    searched_users = search_response["data"]
    assert len(searched_users) == expected_values.response_record_count

    # Verify data is sorted as expected
    reverse = pagination_info["sort_direction"] == "descending"
    resorted_users = sorted(
        searched_users, key=lambda u: u[pagination_info["order_by"]], reverse=reverse
    )
    assert resorted_users == searched_users


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
