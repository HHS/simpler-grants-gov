from uuid import uuid4

from src.constants.lookup_constants import Privilege
from tests.src.db.models.factories import (
    AgencyUserFactory,
    AgencyUserRoleFactory,
    ApplicationUserFactory,
    ApplicationUserRoleFactory,
    InternalUserRoleFactory,
    OrganizationUserFactory,
    OrganizationUserRoleFactory,
    RoleFactory,
)


def test_get_roles_and_privileges(enable_factory_create, client, user, db_session, user_auth_token):
    user_apps = ApplicationUserFactory.create_batch(2, user=user)
    for user_app in user_apps:
        ApplicationUserRoleFactory.create(application_user=user_app)
    user_orgs = OrganizationUserFactory.create_batch(2, user=user)
    OrganizationUserRoleFactory.create(
        organization_user=user_orgs[0],
        role=RoleFactory.create(privileges=[Privilege.MANAGE_ORG_MEMBERS]),
    )
    OrganizationUserRoleFactory.create(
        organization_user=user_orgs[1],
    )
    AgencyUserRoleFactory.create(
        agency_user=AgencyUserFactory.create(user=user),
    )
    InternalUserRoleFactory.create(user=user)
    resp = client.post(
        f"/v1/users/{user.user_id}/privileges", headers={"X-SGG-Token": user_auth_token}
    )
    data = resp.get_json()["data"]

    assert resp.status_code == 200
    assert data["user_id"] == str(user.user_id)

    assert len(data["organizations"]) == 2
    assert len(data["application_users"]) == 2
    assert len(data["user_agencies"]) == 1
    assert len(data["internal_user_roles"]) == 1


def test_get_roles_and_privileges_none(
    enable_factory_create, client, user, db_session, user_auth_token
):
    resp = client.post(
        f"/v1/users/{user.user_id}/privileges", headers={"X-SGG-Token": user_auth_token}
    )
    data = resp.get_json()["data"]

    assert resp.status_code == 200
    assert data["user_id"] == str(user.user_id)

    assert not data["organizations"]
    assert not data["application_users"]
    assert not data["user_agencies"]
    assert not data["internal_user_roles"]


def test_get_roles_and_privileges_unauthorized(
    enable_factory_create, client, user, db_session, user_auth_token
):
    response = client.post(
        f"/v1/users/{uuid4()}/privileges",
        headers={"X-SGG-Token": user_auth_token},
    )

    assert response.status_code == 403
    assert response.json["message"] == "Forbidden"
