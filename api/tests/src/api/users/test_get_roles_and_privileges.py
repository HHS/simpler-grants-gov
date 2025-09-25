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
