"""
Regression coverage for the endpoints the frontend calls from its auth-gated
routes (/workspace, /settings, /notifications, /developers/api-dashboard and the
application/organization flows).

The frontend maps the response body's ``status_code`` of 401 to an
``UnauthorizedError`` (and 403 to ``ForbiddenError``), so every one of these
endpoints must return a JSON 401 when the user token is missing, invalid, or
expired. Request bodies mirror what the frontend fetchers send so that request
validation passes and authentication is what gets exercised.
"""

import uuid
from datetime import datetime

import pytest

from src.auth.api_jwt_auth import create_jwt_for_user
from tests.src.db.models.factories import UserFactory

USER_ID = uuid.uuid4()
ORG_ID = uuid.uuid4()
OTHER_USER_ID = uuid.uuid4()
APPLICATION_ID = uuid.uuid4()
APP_FORM_ID = uuid.uuid4()
API_KEY_ID = uuid.uuid4()
INVITATION_ID = uuid.uuid4()
OPPORTUNITY_ID = uuid.uuid4()
ROLE_ID = uuid.uuid4()


def _pagination(order_by: str, sort_direction: str = "descending") -> dict:
    return {
        "pagination": {
            "page_offset": 1,
            "page_size": 25,
            "sort_order": [{"order_by": order_by, "sort_direction": sort_direction}],
        }
    }


FRONTEND_AUTH_ROUTES = [
    # Settings
    ("get", f"/v1/users/{USER_ID}", None),
    ("put", f"/v1/users/{USER_ID}/profile", {"first_name": "First", "last_name": "Last"}),
    # Workspace
    ("post", f"/v1/users/{USER_ID}/privileges", None),
    (
        "post",
        f"/v1/users/{USER_ID}/can_access",
        {
            "resource_type": "organization",
            "resource_id": str(ORG_ID),
            "privileges": ["manage_org_members"],
        },
    ),
    ("get", f"/v1/users/{USER_ID}/organizations", None),
    ("post", f"/v1/users/{USER_ID}/invitations/list", None),
    (
        "post",
        f"/v1/users/{USER_ID}/invitations/{INVITATION_ID}/organizations",
        {"status": "accepted"},
    ),
    ("post", f"/v1/users/{USER_ID}/applications", _pagination("created_at")),
    # Saved opportunities
    (
        "post",
        f"/v1/users/{USER_ID}/saved-opportunities/list",
        {**_pagination("created_at"), "filters": {"organization_ids": {"one_of": None}}},
    ),
    ("post", f"/v1/users/{USER_ID}/saved-opportunities", {"opportunity_id": str(OPPORTUNITY_ID)}),
    ("delete", f"/v1/users/{USER_ID}/saved-opportunities/{OPPORTUNITY_ID}", None),
    # API dashboard
    ("post", f"/v1/users/{USER_ID}/api-keys/list", _pagination("created_at")),
    ("post", f"/v1/users/{USER_ID}/api-keys", {"key_name": "My key"}),
    ("put", f"/v1/users/{USER_ID}/api-keys/{API_KEY_ID}", {"key_name": "Renamed key"}),
    ("delete", f"/v1/users/{USER_ID}/api-keys/{API_KEY_ID}", None),
    # Notifications
    ("get", f"/v1/users/{USER_ID}/saved-opportunities/notifications", None),
    (
        "post",
        f"/v1/users/{USER_ID}/saved-opportunities/notifications",
        {"organization_id": None, "email_enabled": True},
    ),
    ("get", f"/v1/users/{USER_ID}/all-opportunities/notifications", None),
    ("post", f"/v1/users/{USER_ID}/all-opportunities/notifications", {"is_enabled": True}),
    # Organizations
    ("get", f"/v1/organizations/{ORG_ID}", None),
    ("post", f"/v1/organizations/{ORG_ID}/users", _pagination("email", "ascending")),
    ("post", f"/v1/organizations/{ORG_ID}/roles/list", None),
    (
        "post",
        f"/v1/organizations/{ORG_ID}/invitations",
        {"invitee_email": "invitee@example.com", "role_ids": [str(ROLE_ID)]},
    ),
    (
        "post",
        f"/v1/organizations/{ORG_ID}/invitations/list",
        {"filters": {"status": {"one_of": ["pending"]}}},
    ),
    ("put", f"/v1/organizations/{ORG_ID}/users/{OTHER_USER_ID}", {"role_ids": [str(ROLE_ID)]}),
    ("delete", f"/v1/organizations/{ORG_ID}/users/{OTHER_USER_ID}", None),
    (
        "post",
        f"/v1/organizations/{ORG_ID}/legacy-users",
        {
            **_pagination("email", "ascending"),
            "filters": {"status": {"one_of": ["available", "member", "pending_invitation"]}},
        },
    ),
    (
        "post",
        f"/v1/organizations/{ORG_ID}/saved-opportunities",
        {"opportunity_id": str(OPPORTUNITY_ID)},
    ),
    ("delete", f"/v1/organizations/{ORG_ID}/saved-opportunities/{OPPORTUNITY_ID}", None),
    # Applications
    ("get", f"/alpha/applications/{APPLICATION_ID}", None),
    ("put", f"/alpha/applications/{APPLICATION_ID}", {"application_name": "New name"}),
    ("post", f"/alpha/applications/{APPLICATION_ID}/audit_history", _pagination("created_at")),
    ("get", f"/alpha/applications/{APPLICATION_ID}/application_form/{APP_FORM_ID}", None),
    (
        "put",
        f"/alpha/applications/{APPLICATION_ID}/forms/{APP_FORM_ID}",
        {"application_response": {}},
    ),
    (
        "put",
        f"/alpha/applications/{APPLICATION_ID}/forms/{APP_FORM_ID}/inclusion",
        {"is_included_in_submission": True},
    ),
    ("post", f"/alpha/applications/{APPLICATION_ID}/submit", None),
    ("post", f"/alpha/applications/{APPLICATION_ID}/submissions", _pagination("created_at")),
    (
        "post",
        f"/v1/applications/{APPLICATION_ID}/attachments",
        {"pending_file_id": str(uuid.uuid4())},
    ),
]


@pytest.fixture
def expired_user_auth_token(enable_factory_create, db_session):
    user = UserFactory.create()
    token, token_session = create_jwt_for_user(user, db_session)
    token_session.expires_at = datetime.fromisoformat("1980-01-01 12:00:00+00:00")
    db_session.commit()
    return token


def _assert_unauthorized(resp) -> None:
    assert resp.status_code == 401
    assert resp.headers["Content-Type"] == "application/json"
    assert resp.get_json()["status_code"] == 401


@pytest.mark.parametrize("method,url,body", FRONTEND_AUTH_ROUTES)
def test_frontend_auth_route_401_missing_token(client, method, url, body):
    resp = getattr(client, method)(url, json=body)

    _assert_unauthorized(resp)


@pytest.mark.parametrize("method,url,body", FRONTEND_AUTH_ROUTES)
def test_frontend_auth_route_401_invalid_token(client, method, url, body):
    resp = getattr(client, method)(url, json=body, headers={"X-SGG-Token": "not-a-valid-jwt"})

    _assert_unauthorized(resp)


@pytest.mark.parametrize("method,url,body", FRONTEND_AUTH_ROUTES)
def test_frontend_auth_route_401_expired_token(client, expired_user_auth_token, method, url, body):
    resp = getattr(client, method)(url, json=body, headers={"X-SGG-Token": expired_user_auth_token})

    _assert_unauthorized(resp)
