from src.auth.api_jwt_auth import create_jwt_for_user
from src.constants.lookup_constants import Privilege
from tests.lib.organization_test_utils import create_user_in_org
from tests.src.db.models.factories import (
    OrganizationFactory,
    OrganizationUserFactory,
    OrganizationUserRoleFactory,
    RoleFactory,
    UserFactory,
    UserSavedOpportunityNotificationFactory,
)


def test_get_notifications_defaults_no_rows(
    client, user, user_auth_token, enable_factory_create, db_session
):
    """With no notification rows, self defaults to True and organizations is empty."""
    response = client.get(
        f"/v1/users/{user.user_id}/saved-opportunities/notifications",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    data = response.json["data"]
    assert data["self"]["email_enabled"] is True
    assert data["organizations"] == []


def test_get_notifications_self_row_email_disabled(
    client, user, user_auth_token, enable_factory_create, db_session
):
    """When a self notification row exists with email_enabled=False, it is returned."""
    UserSavedOpportunityNotificationFactory.create(
        user=user, organization=None, email_enabled=False
    )

    response = client.get(
        f"/v1/users/{user.user_id}/saved-opportunities/notifications",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    data = response.json["data"]
    assert data["self"]["email_enabled"] is False
    assert data["organizations"] == []


def test_get_notifications_self_row_email_enabled(
    client, user, user_auth_token, enable_factory_create, db_session
):
    """When a self notification row exists with email_enabled=True, it is returned."""
    UserSavedOpportunityNotificationFactory.create(user=user, organization=None, email_enabled=True)

    response = client.get(
        f"/v1/users/{user.user_id}/saved-opportunities/notifications",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 200
    data = response.json["data"]
    assert data["self"]["email_enabled"] is True


def test_get_notifications_org_with_privilege_default_false(
    client, enable_factory_create, db_session
):
    """Org with VIEW_ORG_SAVED_OPPORTUNITIES privilege shows up with default email_enabled=False."""
    user, org, token = create_user_in_org(
        db_session, privileges=[Privilege.VIEW_ORG_SAVED_OPPORTUNITIES]
    )

    response = client.get(
        f"/v1/users/{user.user_id}/saved-opportunities/notifications",
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    data = response.json["data"]
    assert data["self"]["email_enabled"] is True
    assert len(data["organizations"]) == 1
    assert data["organizations"][0]["organization_id"] == str(org.organization_id)
    assert data["organizations"][0]["email_enabled"] is False


def test_get_notifications_org_with_explicit_row(client, enable_factory_create, db_session):
    """Explicit notification row for org overrides default."""
    user, org, token = create_user_in_org(
        db_session, privileges=[Privilege.VIEW_ORG_SAVED_OPPORTUNITIES]
    )
    UserSavedOpportunityNotificationFactory.create(user=user, organization=org, email_enabled=True)

    response = client.get(
        f"/v1/users/{user.user_id}/saved-opportunities/notifications",
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    data = response.json["data"]
    assert len(data["organizations"]) == 1
    assert data["organizations"][0]["organization_id"] == str(org.organization_id)
    assert data["organizations"][0]["email_enabled"] is True


def test_get_notifications_org_without_privilege_not_returned(
    client, enable_factory_create, db_session
):
    """Org memberships without VIEW_ORG_SAVED_OPPORTUNITIES are excluded from the response."""
    # Create user in org with a role that has NO privileges
    role = RoleFactory.create(privileges=[], is_org_role=True)
    user, org, token = create_user_in_org(db_session, role=role)

    response = client.get(
        f"/v1/users/{user.user_id}/saved-opportunities/notifications",
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    data = response.json["data"]
    assert data["organizations"] == []


def test_get_notifications_multiple_orgs(client, enable_factory_create, db_session):
    """Multiple orgs with varying privileges and notification rows are handled correctly."""
    user, org1, token = create_user_in_org(
        db_session, privileges=[Privilege.VIEW_ORG_SAVED_OPPORTUNITIES]
    )

    # Second org with privilege, no notification row
    org2 = OrganizationFactory.create()
    org_user2 = OrganizationUserFactory.create(user=user, organization=org2)
    role2 = RoleFactory.create(
        privileges=[Privilege.VIEW_ORG_SAVED_OPPORTUNITIES], is_org_role=True
    )
    OrganizationUserRoleFactory.create(organization_user=org_user2, role=role2)

    # Third org without privilege
    org3 = OrganizationFactory.create()
    OrganizationUserFactory.create(user=user, organization=org3)

    # Explicit notification row for org1 (email_enabled=True)
    UserSavedOpportunityNotificationFactory.create(user=user, organization=org1, email_enabled=True)

    response = client.get(
        f"/v1/users/{user.user_id}/saved-opportunities/notifications",
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 200
    data = response.json["data"]

    org_ids = {o["organization_id"] for o in data["organizations"]}
    assert str(org1.organization_id) in org_ids
    assert str(org2.organization_id) in org_ids
    assert str(org3.organization_id) not in org_ids

    org1_data = next(
        o for o in data["organizations"] if o["organization_id"] == str(org1.organization_id)
    )
    org2_data = next(
        o for o in data["organizations"] if o["organization_id"] == str(org2.organization_id)
    )

    assert org1_data["email_enabled"] is True
    assert org2_data["email_enabled"] is False


def test_get_notifications_forbidden_different_user(client, enable_factory_create, db_session):
    """Returns 403 when authenticated user differs from the user_id in the URL."""
    user = UserFactory.create()
    token, _ = create_jwt_for_user(user, db_session)
    db_session.commit()

    other_user = UserFactory.create()

    response = client.get(
        f"/v1/users/{other_user.user_id}/saved-opportunities/notifications",
        headers={"X-SGG-Token": token},
    )

    assert response.status_code == 403
    assert response.json["message"] == "Forbidden"


def test_get_notifications_unauthenticated(client, enable_factory_create, db_session):
    """Returns 401 when no authentication token is provided."""
    user = UserFactory.create()

    response = client.get(
        f"/v1/users/{user.user_id}/saved-opportunities/notifications",
    )

    assert response.status_code == 401
