from uuid import uuid4

from src.constants.lookup_constants import Privilege
from src.constants.static_role_values import ORG_ADMIN, ORG_MEMBER
from tests.lib.organization_test_utils import create_user_in_org, create_user_not_in_org
from tests.src.db.models.factories import OrganizationFactory


def test_list_organization_roles(client, db_session, enable_factory_create):
    """Test getting organization with required Privilege"""
    user, organization, token = create_user_in_org(
        privileges=[Privilege.VIEW_ORG_MEMBERSHIP],
        db_session=db_session,
    )
    # Make request
    resp = client.post(
        f"/v1/organizations/{organization.organization_id}/roles/list",
        headers={"X-SGG-Token": token},
    )
    data = resp.get_json()["data"]
    assert resp.status_code == 200
    assert len(data) >= 2
    # assert core_roles are listed
    assert {str(ORG_ADMIN.role_id), str(ORG_MEMBER.role_id)}.issubset(
        {role["role_id"] for role in data}
    )


def test_list_organization_roles_403_privilege(client, db_session, enable_factory_create):
    """Test getting organization roles without required Privilege"""
    user, organization, token = create_user_in_org(
        privileges=[Privilege.MANAGE_ORG_MEMBERS],
        db_session=db_session,
    )

    # Make request
    resp = client.post(
        f"/v1/organizations/{organization.organization_id}/roles/list",
        headers={"X-SGG-Token": token},
    )
    assert resp.status_code == 403


def test_list_organization_roles_403_organization(client, db_session, enable_factory_create):
    """Test getting organization roles without correct Privilege for the organization"""
    user, organization, token = create_user_in_org(
        privileges=[Privilege.VIEW_ORG_MEMBERSHIP],
        db_session=db_session,
    )
    other_organization = OrganizationFactory.create()

    # Make request
    resp = client.post(
        f"/v1/organizations/{other_organization.organization_id}/roles/list",
        headers={"X-SGG-Token": token},
    )
    assert resp.status_code == 403


def test_list_organization_roles_404_organization(client, db_session, enable_factory_create):
    """Test getting organization roles for a non-existent organization"""
    user, token = create_user_not_in_org(db_session)

    # Make request
    resp = client.post(
        f"/v1/organizations/{uuid4()}/roles/list",
        headers={"X-SGG-Token": token},
    )
    assert resp.status_code == 404


def test_list_organization_roles_401_no_token(client):
    """Test that accessing organization roles without auth token returns 401"""
    # Make request
    resp = client.post(f"/v1/organizations/{uuid4()}/roles/list")

    assert resp.status_code == 401
