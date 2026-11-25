from uuid import uuid4

import pytest

from src.constants.lookup_constants import Privilege
from src.constants.static_role_values import (
    APPLICATION_OWNER_ID,
    MODIFY_APPLICATIONS_ID,
    ORG_ADMIN_ID,
    ORG_COLLABORATOR_ID,
    ORG_MEMBER_ID,
    SUBMIT_APPLICATIONS_ID,
    VIEW_APPLICATIONS_ID,
)
from src.db.models.user_models import Role
from tests.lib.organization_test_utils import (
    create_application_roles,
    create_org_user_with_roles,
    create_user_in_org,
)
from tests.src.db.models.factories import ApplicationFactory, OrganizationFactory


class TestGetOrganizationUserRoles:
    """Test GET /v1/organizations/:organization_id/users/:user_id endpoint"""

    @pytest.fixture
    def admin(self, db_session, enable_factory_create, seed_form_registry):
        """An admin of a new organization, returned as (user, organization, token)"""
        return create_user_in_org(db_session=db_session, role=db_session.get(Role, ORG_ADMIN_ID))

    def get_roles(self, client, token, organization_id, user_id):
        return client.get(
            f"/v1/organizations/{organization_id}/users/{user_id}",
            headers={"X-SGG-Token": token},
        )

    def test_get_organization_user_roles(self, client, db_session, admin):
        """Should return the user's organization roles, application roles, and External label"""
        _, org, token = admin
        org_user = create_org_user_with_roles(
            db_session, org, [ORG_COLLABORATOR_ID, MODIFY_APPLICATIONS_ID]
        )
        org_user.is_external = True
        application = ApplicationFactory.create(organization=org)
        create_application_roles(
            db_session, application, org_user.user, [VIEW_APPLICATIONS_ID, SUBMIT_APPLICATIONS_ID]
        )
        db_session.commit()

        resp = self.get_roles(client, token, org.organization_id, org_user.user_id)
        data = resp.get_json()["data"]

        assert resp.status_code == 200
        assert {role["role_id"] for role in data["roles"]} == {
            str(ORG_COLLABORATOR_ID),
            str(MODIFY_APPLICATIONS_ID),
        }
        assert len(data["individual_application_roles"]) == 1
        assert data["individual_application_roles"][0]["application_id"] == str(
            application.application_id
        )
        assert {role["role_id"] for role in data["individual_application_roles"][0]["roles"]} == {
            str(VIEW_APPLICATIONS_ID),
            str(SUBMIT_APPLICATIONS_ID),
        }
        assert data["is_external"] is True

    def test_get_organization_user_roles_matches_put_response(self, client, db_session, admin):
        """Should return the same data the PUT returns when nothing changed"""
        _, org, token = admin
        org_user = create_org_user_with_roles(db_session, org, [ORG_COLLABORATOR_ID])
        application = ApplicationFactory.create(organization=org)
        create_application_roles(db_session, application, org_user.user, [VIEW_APPLICATIONS_ID])

        put_resp = client.put(
            f"/v1/organizations/{org.organization_id}/users/{org_user.user_id}",
            headers={"X-SGG-Token": token},
            json={
                "role_ids": [str(ORG_COLLABORATOR_ID)],
                "individual_application_roles": [
                    {
                        "application_id": str(application.application_id),
                        "role_ids": [str(VIEW_APPLICATIONS_ID)],
                    }
                ],
            },
        )
        get_resp = self.get_roles(client, token, org.organization_id, org_user.user_id)

        assert put_resp.status_code == 200
        assert get_resp.status_code == 200
        assert get_resp.get_json()["data"] == put_resp.get_json()["data"]

    def test_get_organization_user_roles_only_granular_roles_in_organization(
        self, client, db_session, admin
    ):
        """Should only return granular roles on the organization's applications"""
        _, org, token = admin
        org_user = create_org_user_with_roles(db_session, org, [ORG_COLLABORATOR_ID])
        owned_application = ApplicationFactory.create(organization=org)
        other_org_application = ApplicationFactory.create(organization=OrganizationFactory.create())
        create_application_roles(
            db_session,
            owned_application,
            org_user.user,
            [APPLICATION_OWNER_ID, VIEW_APPLICATIONS_ID],
        )
        create_application_roles(
            db_session, other_org_application, org_user.user, [VIEW_APPLICATIONS_ID]
        )

        resp = self.get_roles(client, token, org.organization_id, org_user.user_id)
        individual_application_roles = resp.get_json()["data"]["individual_application_roles"]

        assert resp.status_code == 200
        assert len(individual_application_roles) == 1
        assert individual_application_roles[0]["application_id"] == str(
            owned_application.application_id
        )
        assert [role["role_id"] for role in individual_application_roles[0]["roles"]] == [
            str(VIEW_APPLICATIONS_ID)
        ]

    def test_get_organization_user_roles_without_application_roles(self, client, db_session, admin):
        """Should return an empty application role list for a user without any"""
        _, org, token = admin
        org_user = create_org_user_with_roles(db_session, org, [ORG_MEMBER_ID])

        resp = self.get_roles(client, token, org.organization_id, org_user.user_id)
        data = resp.get_json()["data"]

        assert resp.status_code == 200
        assert [role["role_id"] for role in data["roles"]] == [str(ORG_MEMBER_ID)]
        assert data["individual_application_roles"] == []
        assert data["is_external"] is False

    def test_get_organization_user_roles_404_organization(self, client, admin):
        """Should return 404 when the organization does not exist"""
        request_user, _, token = admin

        resp = self.get_roles(client, token, uuid4(), request_user.user_id)

        assert resp.status_code == 404

    def test_get_organization_user_roles_404_target_user(self, client, db_session, admin):
        """Should return 404 when the target user is not a member of the organization"""
        _, org, token = admin
        other_org_user = create_org_user_with_roles(
            db_session, OrganizationFactory.create(), [ORG_MEMBER_ID]
        )

        resp = self.get_roles(client, token, org.organization_id, other_org_user.user_id)

        assert resp.status_code == 404

    @pytest.mark.parametrize("privileges", [[Privilege.VIEW_ORG_MEMBERSHIP], []])
    def test_get_organization_user_roles_403_without_manage_privilege(
        self, client, db_session, enable_factory_create, privileges
    ):
        """Should return 403 when the actor doesn't hold MANAGE_ORG_MEMBERS"""
        _, org, token = create_user_in_org(db_session=db_session, privileges=privileges)
        org_user = create_org_user_with_roles(db_session, org, [ORG_MEMBER_ID])

        resp = self.get_roles(client, token, org.organization_id, org_user.user_id)

        assert resp.status_code == 403
