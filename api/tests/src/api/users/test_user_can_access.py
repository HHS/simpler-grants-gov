from uuid import uuid4

from src.constants.lookup_constants import Privilege
from tests.lib.organization_test_utils import create_user_in_org
from tests.src.db.models.factories import AgencyUserFactory, AgencyUserRoleFactory, RoleFactory


def test_user_can_access_organization(
    client,
    db_session,
    enable_factory_create,
):
    user, org, token = create_user_in_org(db_session, privileges=[Privilege.VIEW_APPLICATION])
    request = {
        "resource_id": org.organization_id,
        "resource_type": "organization",
        "privileges": ["view_application"],
    }
    response = client.post(
        f"/v1/users/{user.user_id}/can_access",
        headers={"X-SGG-Token": token},
        json=request,
    )

    assert response.status_code == 200


def test_user_can_access_application(
    client,
    db_session,
    enable_factory_create,
):
    user, app, token = create_user_in_app(db_session, privileges=[Privilege.VIEW_APPLICATION])
    request = {
        "resource_id": app.application_id,
        "resource_type": "application",
        "privileges": ["view_application"],
    }
    response = client.post(
        f"/v1/users/{user.user_id}/can_access",
        headers={"X-SGG-Token": token},
        json=request,
    )

    assert response.status_code == 200


def test_user_can_access_agency(client, db_session, enable_factory_create, user, user_auth_token):
    agency_user = AgencyUserFactory.create(user=user)
    AgencyUserRoleFactory.create(
        agency_user=agency_user,
        role=RoleFactory.create(privileges=[Privilege.MANAGE_AGENCY_MEMBERS]),
    )
    request = {
        "resource_id": agency_user.agency_id,
        "resource_type": "agency",
        "privileges": ["manage_agency_members"],
    }
    response = client.post(
        f"/v1/users/{user.user_id}/can_access",
        headers={"X-SGG-Token": user_auth_token},
        json=request,
    )

    assert response.status_code == 200


def test_user_can_access_404(
    client,
    db_session,
    enable_factory_create,
):
    user, _, token = create_user_in_org(db_session, privileges=[Privilege.VIEW_APPLICATION])
    request = {
        "resource_id": uuid4(),
        "resource_type": "organization",
        "privileges": ["modify_application"],
    }
    response = client.post(
        f"/v1/users/{user.user_id}/can_access",
        headers={"X-SGG-Token": token},
        json=request,
    )

    assert response.status_code == 404


def test_user_can_access_403(
    client,
    db_session,
    enable_factory_create,
):
    user, org, token = create_user_in_org(db_session, privileges=[Privilege.VIEW_APPLICATION])
    request = {
        "resource_id": org.organization_id,
        "resource_type": "organization",
        "privileges": ["modify_application"],
    }
    response = client.post(
        f"/v1/users/{user.user_id}/can_access",
        headers={"X-SGG-Token": token},
        json=request,
    )

    assert response.status_code == 403
