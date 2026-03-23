from uuid import uuid4

from src.constants.lookup_constants import Privilege
from src.db.models.user_models import UserSavedOpportunityNotification
from tests.lib.organization_test_utils import create_user_in_org
from tests.src.db.models.factories import UserSavedOpportunityNotificationFactory


def test_set_notification_self_create(client, db_session, user_auth_token, user):
    """
    Test creating a new notification setting for a user's own saved opportunities
    when no existing record (organization_id = NULL) is present.
    """
    response = client.post(
        f"/v1/users/{user.user_id}/saved-opportunities/notifications",
        headers={"X-SGG-Token": user_auth_token},
        json={"organization_id": None, "email_enabled": False},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    res = (
        db_session.query(UserSavedOpportunityNotification)
        .filter(UserSavedOpportunityNotification.user_id == user.user_id)
        .first()
    )

    assert res
    assert res.email_enabled is False
    assert res.organization_id is None


def test_set_notification_self_update(client, db_session, user_auth_token, user):
    """
    Test updating an existing notification setting for a user's own saved opportunities
    (organization_id = NULL).
    """
    # Existing self record
    self_setting = UserSavedOpportunityNotificationFactory.create(
        user=user, organization_id=None, email_enabled=True
    )
    assert self_setting.updated_at == self_setting.created_at

    response = client.post(
        f"/v1/users/{user.user_id}/saved-opportunities/notifications",
        headers={"X-SGG-Token": user_auth_token},
        json={"organization_id": None, "email_enabled": False},
    )

    db_session.refresh(self_setting)

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Self record updated
    assert self_setting.email_enabled is False
    assert self_setting.updated_at > self_setting.created_at


def test_set_notification_org_create(client, db_session, enable_factory_create):
    """
    Test creating a new notification setting for an organization when the user has
    the required permissions and no existing record is present.
    """
    user, org, token = create_user_in_org(
        db_session, privileges=[Privilege.VIEW_ORG_SAVED_OPPORTUNITIES]
    )
    org_id = org.organization_id
    response = client.post(
        f"/v1/users/{user.user_id}/saved-opportunities/notifications",
        headers={"X-SGG-Token": token},
        json={"organization_id": str(org_id), "email_enabled": True},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    res = (
        db_session.query(UserSavedOpportunityNotification)
        .filter(UserSavedOpportunityNotification.user_id == user.user_id)
        .filter(UserSavedOpportunityNotification.organization_id == org_id)
        .first()
    )

    assert res
    assert res.user_id == user.user_id
    assert res.organization_id == org_id
    assert res.email_enabled is True


def test_set_notification_org_update(client, db_session, enable_factory_create):
    """
    Test updating an existing notification setting for an organization when the user
    has the required permissions.
    """
    # Create user and orgs
    user, org, token = create_user_in_org(
        db_session, privileges=[Privilege.VIEW_ORG_SAVED_OPPORTUNITIES]
    )
    _, other_org, _ = create_user_in_org(
        db_session, privileges=[Privilege.VIEW_ORG_SAVED_OPPORTUNITIES]
    )

    # Existing records
    self_setting = UserSavedOpportunityNotificationFactory.create(user=user, email_enabled=True)
    target_org_setting = UserSavedOpportunityNotificationFactory.create(
        user=user, organization=org, email_enabled=True
    )
    other_org_setting = UserSavedOpportunityNotificationFactory.create(
        user=user, organization=other_org, email_enabled=True
    )

    assert target_org_setting.updated_at == target_org_setting.created_at

    response = client.post(
        f"/v1/users/{user.user_id}/saved-opportunities/notifications",
        headers={"X-SGG-Token": token},
        json={"organization_id": str(org.organization_id), "email_enabled": False},
    )

    db_session.refresh(self_setting)
    db_session.refresh(target_org_setting)
    db_session.refresh(other_org_setting)

    assert response.status_code == 200
    assert response.json["message"] == "Success"

    # Only target org updated
    assert target_org_setting.email_enabled is False
    assert target_org_setting.updated_at > target_org_setting.created_at

    # Self and other org unchanged
    assert self_setting.email_enabled is True
    assert other_org_setting.email_enabled is True


def test_set_notification_unauthorized_user(client, db_session, user_auth_token, user):
    """
    Test that a user cannot modify notification settings for another user
    and receives a 403 Forbidden response.
    """
    other_user_id = uuid4()

    response = client.post(
        f"/v1/users/{other_user_id}/saved-opportunities/notifications",
        headers={"X-SGG-Token": user_auth_token},
        json={"organization_id": None, "email_enabled": True},
    )

    assert response.status_code == 403
    assert response.json["message"] == "Forbidden"

    res = (
        db_session.query(UserSavedOpportunityNotification)
        .filter(UserSavedOpportunityNotification.user_id == other_user_id)
        .first()
    )
    assert not res


def test_set_notification_org_no_permission(client, db_session, enable_factory_create):
    """
    Test that a user cannot create or update notification settings for an organization
    they do not have permission to access, resulting in a 403 Forbidden response.
    """
    user, org, token = create_user_in_org(db_session, privileges=[Privilege.VIEW_ORG_MEMBERSHIP])
    org_id = org.organization_id

    response = client.post(
        f"/v1/users/{user.user_id}/saved-opportunities/notifications",
        headers={"X-SGG-Token": token},
        json={"organization_id": str(org_id), "email_enabled": True},
    )

    assert response.status_code == 403
    assert response.json["message"] == "Forbidden"

    res = (
        db_session.query(UserSavedOpportunityNotification)
        .filter(UserSavedOpportunityNotification.user_id == user.user_id)
        .filter(UserSavedOpportunityNotification.organization_id == org_id)
        .first()
    )
    assert not res


def test_saved_opportunity_notification_org_not_found(client, db_session, user_auth_token, user):
    """
    Test If the organization_id does not exist, the endpoint should return 404.
    """
    non_existent_org_id = uuid4()
    response = client.post(
        f"/v1/users/{user.user_id}/saved-opportunities/notifications",
        headers={"X-SGG-Token": user_auth_token},
        json={"organization_id": str(non_existent_org_id), "email_enabled": True},
    )

    assert response.status_code == 404
    assert "Organization(s) not found" in response.json["message"]

    # Verify that no entry was created in the DB
    res = (
        db_session.query(UserSavedOpportunityNotification)
        .filter(
            UserSavedOpportunityNotification.user_id == user.user_id,
            UserSavedOpportunityNotification.organization_id == non_existent_org_id,
        )
        .first()
    )
    assert res is None


def test_saved_opportunity_notification_missing_fields(client, db_session, user_auth_token, user):
    """
    Test that missing required fields return a validation error.
    """
    response = client.post(
        f"/v1/users/{user.user_id}/saved-opportunities/notifications",
        headers={"X-SGG-Token": user_auth_token},
        json={},  # missing both fields
    )

    assert response.status_code == 422
    assert response.json["message"] == "Validation error"

    # Assert both fields are present in errors
    errors = {(err["field"], err["type"]) for err in response.json["errors"]}

    assert ("organization_id", "required") in errors
    assert ("email_enabled", "required") in errors
