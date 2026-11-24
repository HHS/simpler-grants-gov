from uuid import uuid4

import pytest
from sqlalchemy import select

from src.auth.api_jwt_auth import create_jwt_for_user
from src.constants.lookup_constants import OrganizationAuditEvent
from src.constants.static_role_values import (
    APPLICATION_OWNER_ID,
    GRANULAR_APPLICATION_ROLE_IDS,
    MODIFY_APPLICATIONS_ID,
    ORG_ADMIN_ID,
    ORG_COLLABORATOR_ID,
    ORG_MEMBER_ID,
    SUBMIT_APPLICATIONS_ID,
    VIEW_APPLICATIONS_ID,
)
from src.db.models.user_models import ApplicationUser, OrganizationUserRole, Role
from tests.lib.organization_test_utils import create_user_in_org
from tests.src.db.models.factories import (
    ApplicationFactory,
    ApplicationUserFactory,
    ApplicationUserRoleFactory,
    OrganizationFactory,
    OrganizationUserFactory,
    OrganizationUserRoleFactory,
)


def to_str(ids):
    return [str(value) for value in ids]


def create_org_user_with_roles(db_session, organization, role_ids):
    org_user = OrganizationUserFactory.create(organization=organization)
    for role_id in role_ids:
        OrganizationUserRoleFactory.create(
            organization_user=org_user, role=db_session.get(Role, role_id)
        )
    return org_user


def create_application_roles(db_session, application, user, role_ids):
    app_user = ApplicationUserFactory.create(application=application, user=user)
    for role_id in role_ids:
        ApplicationUserRoleFactory.create(
            application_user=app_user, role=db_session.get(Role, role_id)
        )
    return app_user


def get_application_roles(db_session, user_id):
    app_users = db_session.scalars(
        select(ApplicationUser).where(ApplicationUser.user_id == user_id)
    ).all()
    return {
        app_user.application_id: {role.role_id for role in app_user.roles} for app_user in app_users
    }


class TestUpdateUserOrganizationRoles:
    """Test PUT /v1/organizations/:organization_id/users/:user_id endpoint"""

    @pytest.fixture
    def admin(self, db_session, enable_factory_create, seed_form_registry):
        """An admin of a new organization, returned as (user, organization, token)"""
        return create_user_in_org(db_session=db_session, role=db_session.get(Role, ORG_ADMIN_ID))

    def put_roles(self, client, token, organization, user_id, json):
        return client.put(
            f"/v1/organizations/{organization.organization_id}/users/{user_id}",
            headers={"X-SGG-Token": token},
            json=json,
        )

    def test_update_user_organization_roles(self, client, db_session, admin):
        """Should replace the base role and return the user's roles"""
        request_user, org, token = admin
        org_user = create_org_user_with_roles(db_session, org, [ORG_MEMBER_ID])

        resp = self.put_roles(
            client, token, org, org_user.user_id, {"role_ids": [str(ORG_ADMIN_ID)]}
        )
        data = resp.get_json()["data"]

        assert resp.status_code == 200
        assert [role["role_id"] for role in data["roles"]] == [str(ORG_ADMIN_ID)]
        assert data["individual_application_roles"] == []
        assert data["is_external"] is False

        # Verify audit history recorded
        assert len(org.organization_audits) == 1
        assert org.organization_audits[0].user.user_id == request_user.user_id
        assert org.organization_audits[0].target_user_id == org_user.user_id
        assert (
            org.organization_audits[0].organization_audit_event
            == OrganizationAuditEvent.USER_UPDATED
        )

    def test_update_user_overwrites_existing_roles(self, client, db_session, admin):
        """Should replace organization-wide Collaborator access with a new base role"""
        _, org, token = admin
        org_user = create_org_user_with_roles(
            db_session, org, [ORG_COLLABORATOR_ID, *GRANULAR_APPLICATION_ROLE_IDS]
        )

        resp = self.put_roles(
            client, token, org, org_user.user_id, {"role_ids": [str(ORG_MEMBER_ID)]}
        )

        assert resp.status_code == 200
        assert [role["role_id"] for role in resp.get_json()["data"]["roles"]] == [
            str(ORG_MEMBER_ID)
        ]
        db_session.refresh(org_user)
        assert {role.role_id for role in org_user.roles} == {ORG_MEMBER_ID}

    def test_update_user_organization_roles_collaborator_all_applications(
        self, client, db_session, admin
    ):
        """Should grant organization-wide access with granular roles in role_ids"""
        _, org, token = admin
        org_user = create_org_user_with_roles(db_session, org, [ORG_MEMBER_ID])
        role_ids = [ORG_COLLABORATOR_ID, *GRANULAR_APPLICATION_ROLE_IDS]

        resp = self.put_roles(client, token, org, org_user.user_id, {"role_ids": to_str(role_ids)})
        data = resp.get_json()["data"]

        assert resp.status_code == 200
        assert {role["role_id"] for role in data["roles"]} == set(to_str(role_ids))
        assert data["individual_application_roles"] == []
        db_session.refresh(org_user)
        assert {role.role_id for role in org_user.roles} == set(role_ids)

    def test_update_user_organization_roles_collaborator_selected_applications(
        self, client, db_session, admin
    ):
        """Should grant granular roles on the given applications"""
        _, org, token = admin
        org_user = create_org_user_with_roles(db_session, org, [ORG_COLLABORATOR_ID])
        application_a = ApplicationFactory.create(organization=org)
        application_b = ApplicationFactory.create(organization=org)

        resp = self.put_roles(
            client,
            token,
            org,
            org_user.user_id,
            {
                "role_ids": [str(ORG_COLLABORATOR_ID)],
                "individual_application_roles": [
                    {
                        "application_id": str(application_a.application_id),
                        "role_ids": to_str(GRANULAR_APPLICATION_ROLE_IDS),
                    },
                    {
                        "application_id": str(application_b.application_id),
                        "role_ids": [str(VIEW_APPLICATIONS_ID)],
                    },
                ],
            },
        )
        data = resp.get_json()["data"]

        assert resp.status_code == 200
        assert [role["role_id"] for role in data["roles"]] == [str(ORG_COLLABORATOR_ID)]
        assert {
            application_role["application_id"]: {
                role["role_id"] for role in application_role["roles"]
            }
            for application_role in data["individual_application_roles"]
        } == {
            str(application_a.application_id): set(to_str(GRANULAR_APPLICATION_ROLE_IDS)),
            str(application_b.application_id): {str(VIEW_APPLICATIONS_ID)},
        }
        assert get_application_roles(db_session, org_user.user_id) == {
            application_a.application_id: set(GRANULAR_APPLICATION_ROLE_IDS),
            application_b.application_id: {VIEW_APPLICATIONS_ID},
        }

    def test_update_user_organization_roles_replaces_application_roles(
        self, client, db_session, admin
    ):
        """Should fully replace the user's granular roles on the organization's applications"""
        _, org, token = admin
        org_user = create_org_user_with_roles(db_session, org, [ORG_COLLABORATOR_ID])
        removed_application = ApplicationFactory.create(organization=org)
        changed_application = ApplicationFactory.create(organization=org)
        create_application_roles(
            db_session, removed_application, org_user.user, [VIEW_APPLICATIONS_ID]
        )
        create_application_roles(
            db_session, changed_application, org_user.user, GRANULAR_APPLICATION_ROLE_IDS
        )

        resp = self.put_roles(
            client,
            token,
            org,
            org_user.user_id,
            {
                "role_ids": [str(ORG_COLLABORATOR_ID)],
                "individual_application_roles": [
                    {
                        "application_id": str(changed_application.application_id),
                        "role_ids": [str(SUBMIT_APPLICATIONS_ID)],
                    }
                ],
            },
        )

        assert resp.status_code == 200
        assert get_application_roles(db_session, org_user.user_id) == {
            changed_application.application_id: {SUBMIT_APPLICATIONS_ID}
        }

    def test_update_user_organization_roles_omitted_application_roles_clears_them(
        self, client, db_session, admin
    ):
        """Should clear per-application roles when moving to organization-wide access"""
        _, org, token = admin
        org_user = create_org_user_with_roles(db_session, org, [ORG_COLLABORATOR_ID])
        application = ApplicationFactory.create(organization=org)
        create_application_roles(
            db_session, application, org_user.user, GRANULAR_APPLICATION_ROLE_IDS
        )

        resp = self.put_roles(
            client,
            token,
            org,
            org_user.user_id,
            {"role_ids": to_str([ORG_COLLABORATOR_ID, *GRANULAR_APPLICATION_ROLE_IDS])},
        )

        assert resp.status_code == 200
        assert resp.get_json()["data"]["individual_application_roles"] == []
        assert get_application_roles(db_session, org_user.user_id) == {}

    def test_update_user_organization_roles_keeps_other_application_roles(
        self, client, db_session, admin
    ):
        """Should not change non-granular roles or applications in other organizations"""
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

        resp = self.put_roles(
            client, token, org, org_user.user_id, {"role_ids": [str(ORG_COLLABORATOR_ID)]}
        )

        assert resp.status_code == 200
        assert get_application_roles(db_session, org_user.user_id) == {
            owned_application.application_id: {APPLICATION_OWNER_ID},
            other_org_application.application_id: {VIEW_APPLICATIONS_ID},
        }

    @pytest.mark.parametrize("is_external", [True, False])
    def test_update_user_organization_roles_sets_is_external(
        self, client, db_session, admin, is_external
    ):
        """Should set the External label"""
        _, org, token = admin
        org_user = create_org_user_with_roles(db_session, org, [ORG_MEMBER_ID])
        org_user.is_external = not is_external
        db_session.commit()

        resp = self.put_roles(
            client,
            token,
            org,
            org_user.user_id,
            {"role_ids": [str(ORG_MEMBER_ID)], "is_external": is_external},
        )

        assert resp.status_code == 200
        assert resp.get_json()["data"]["is_external"] is is_external
        db_session.refresh(org_user)
        assert org_user.is_external is is_external

    @pytest.mark.parametrize("extra_json", [{}, {"is_external": None}])
    def test_update_user_organization_roles_keeps_is_external(
        self, client, db_session, admin, extra_json
    ):
        """Should leave the External label unchanged when it's null or omitted"""
        _, org, token = admin
        org_user = create_org_user_with_roles(db_session, org, [ORG_MEMBER_ID])
        org_user.is_external = True
        db_session.commit()

        resp = self.put_roles(
            client,
            token,
            org,
            org_user.user_id,
            {"role_ids": [str(ORG_MEMBER_ID)], **extra_json},
        )

        assert resp.status_code == 200
        assert resp.get_json()["data"]["is_external"] is True
        db_session.refresh(org_user)
        assert org_user.is_external is True

    def test_update_user_organization_roles_404_organization(
        self, client, db_session, user, enable_factory_create
    ):
        """Should return 404 when organization does not exist."""
        token, _ = create_jwt_for_user(user, db_session)
        db_session.commit()

        resp = client.put(
            f"/v1/organizations/{uuid4()}/users/{user.user_id}",
            headers={"X-SGG-Token": token},
            json={"role_ids": [str(ORG_ADMIN_ID)]},
        )
        assert resp.status_code == 404

    def test_update_user_organization_roles_404_target_user(self, client, admin):
        """Should return 404 if target user is not part of the organization."""
        _, org, token = admin

        resp = self.put_roles(client, token, org, uuid4(), {"role_ids": [str(ORG_ADMIN_ID)]})
        assert resp.status_code == 404

    def test_update_user_organization_roles_403_no_access(
        self, client, db_session, enable_factory_create
    ):
        """Should return 403 if acting user lacks privileges to manage members."""
        _, org, token = create_user_in_org(
            db_session=db_session, role=db_session.get(Role, ORG_MEMBER_ID)
        )
        org_user = create_org_user_with_roles(db_session, org, [ORG_MEMBER_ID])

        resp = self.put_roles(
            client, token, org, org_user.user_id, {"role_ids": [str(ORG_ADMIN_ID)]}
        )
        assert resp.status_code == 403

    def test_update_user_organization_roles_existing_roles(self, client, db_session, admin):
        """Should not update if it is the same exact set of roles as the existing roles."""
        _, org, token = admin
        org_user = create_org_user_with_roles(db_session, org, [ORG_MEMBER_ID])
        org_user_role = org_user.organization_user_roles[0]

        resp = self.put_roles(
            client, token, org, org_user.user_id, {"role_ids": [str(ORG_MEMBER_ID)]}
        )
        assert resp.status_code == 200
        assert len(resp.get_json()["data"]["roles"]) == 1

        db_user_role = (
            db_session.query(OrganizationUserRole)
            .filter(OrganizationUserRole.organization_user_id == org_user.organization_user_id)
            .one()
        )
        assert db_user_role.created_at == org_user_role.created_at

        # Verify audit history not recorded
        assert len(org.organization_audits) == 0

    def test_update_user_organization_roles_404_missing_role_ids(self, client, db_session, admin):
        """Should raise error if any of the role_ids can't be assigned in the organization."""
        _, org, token = admin
        org_user = create_org_user_with_roles(db_session, org, [ORG_MEMBER_ID])

        resp = self.put_roles(
            client,
            token,
            org,
            org_user.user_id,
            {"role_ids": [str(ORG_MEMBER_ID), str(uuid4())]},
        )

        assert resp.status_code == 404

    @pytest.mark.parametrize(
        "role_ids",
        [
            [VIEW_APPLICATIONS_ID],
            [ORG_ADMIN_ID, ORG_MEMBER_ID],
            [ORG_COLLABORATOR_ID, ORG_MEMBER_ID, *GRANULAR_APPLICATION_ROLE_IDS],
        ],
    )
    def test_update_user_organization_roles_422_base_roles(
        self, client, db_session, admin, role_ids
    ):
        """Should require exactly one base role"""
        _, org, token = admin
        org_user = create_org_user_with_roles(db_session, org, [ORG_MEMBER_ID])

        resp = self.put_roles(client, token, org, org_user.user_id, {"role_ids": to_str(role_ids)})

        assert resp.status_code == 422
        assert resp.get_json()["message"] == "Exactly one base role must be provided"

    @pytest.mark.parametrize(
        "json",
        [
            {},
            {"role_ids": []},
            {
                "role_ids": [str(ORG_COLLABORATOR_ID)],
                "individual_application_roles": [{"application_id": str(uuid4()), "role_ids": []}],
            },
        ],
    )
    def test_update_user_organization_roles_422_invalid_request(
        self, client, db_session, admin, json
    ):
        """Should reject a request with missing or empty role IDs"""
        _, org, token = admin
        org_user = create_org_user_with_roles(db_session, org, [ORG_MEMBER_ID])

        resp = self.put_roles(client, token, org, org_user.user_id, json)

        assert resp.status_code == 422

    def test_update_user_organization_roles_422_role_in_both_scopes(
        self, client, db_session, admin
    ):
        """Should reject a granular role granted organization-wide and per application"""
        _, org, token = admin
        org_user = create_org_user_with_roles(db_session, org, [ORG_COLLABORATOR_ID])
        application = ApplicationFactory.create(organization=org)

        resp = self.put_roles(
            client,
            token,
            org,
            org_user.user_id,
            {
                "role_ids": to_str([ORG_COLLABORATOR_ID, VIEW_APPLICATIONS_ID]),
                "individual_application_roles": [
                    {
                        "application_id": str(application.application_id),
                        "role_ids": to_str([VIEW_APPLICATIONS_ID, MODIFY_APPLICATIONS_ID]),
                    }
                ],
            },
        )

        assert resp.status_code == 422
        assert (
            resp.get_json()["message"]
            == "A granular role can't be granted both organization-wide and per application"
        )
        assert get_application_roles(db_session, org_user.user_id) == {}

    @pytest.mark.parametrize("role_id", [ORG_ADMIN_ID, APPLICATION_OWNER_ID])
    def test_update_user_organization_roles_422_non_granular_application_role(
        self, client, db_session, admin, role_id
    ):
        """Should only allow granular roles per application"""
        _, org, token = admin
        org_user = create_org_user_with_roles(db_session, org, [ORG_COLLABORATOR_ID])
        application = ApplicationFactory.create(organization=org)

        resp = self.put_roles(
            client,
            token,
            org,
            org_user.user_id,
            {
                "role_ids": [str(ORG_COLLABORATOR_ID)],
                "individual_application_roles": [
                    {"application_id": str(application.application_id), "role_ids": [str(role_id)]}
                ],
            },
        )

        assert resp.status_code == 422
        assert resp.get_json()["message"] == "Application roles must be granular application roles"

    def test_update_user_organization_roles_422_duplicate_application(
        self, client, db_session, admin
    ):
        """Should reject an application listed more than once"""
        _, org, token = admin
        org_user = create_org_user_with_roles(db_session, org, [ORG_COLLABORATOR_ID])
        application = ApplicationFactory.create(organization=org)
        application_role = {
            "application_id": str(application.application_id),
            "role_ids": [str(VIEW_APPLICATIONS_ID)],
        }

        resp = self.put_roles(
            client,
            token,
            org,
            org_user.user_id,
            {
                "role_ids": [str(ORG_COLLABORATOR_ID)],
                "individual_application_roles": [application_role, application_role],
            },
        )

        assert resp.status_code == 422

    @pytest.mark.parametrize("application_in_other_org", [True, False])
    def test_update_user_organization_roles_404_application_not_in_organization(
        self, client, db_session, admin, application_in_other_org
    ):
        """Should return 404 for an application outside the organization or an unknown one"""
        _, org, token = admin
        org_user = create_org_user_with_roles(db_session, org, [ORG_COLLABORATOR_ID])
        application_id = (
            ApplicationFactory.create(organization=OrganizationFactory.create()).application_id
            if application_in_other_org
            else uuid4()
        )

        resp = self.put_roles(
            client,
            token,
            org,
            org_user.user_id,
            {
                "role_ids": [str(ORG_COLLABORATOR_ID)],
                "individual_application_roles": [
                    {"application_id": str(application_id), "role_ids": [str(VIEW_APPLICATIONS_ID)]}
                ],
            },
        )

        assert resp.status_code == 404
        assert get_application_roles(db_session, org_user.user_id) == {}

    def test_update_user_organization_roles_403_demote_last_admin(self, client, db_session, admin):
        """Should block demoting the organization's last admin"""
        request_user, org, token = admin

        resp = self.put_roles(
            client,
            token,
            org,
            request_user.user_id,
            {"role_ids": to_str([ORG_COLLABORATOR_ID, *GRANULAR_APPLICATION_ROLE_IDS])},
        )

        assert resp.status_code == 403
        assert (
            resp.get_json()["message"] == "Cannot demote the last administrator of the organization"
        )
        db_session.refresh(request_user.organization_users[0])
        assert {role.role_id for role in request_user.organization_users[0].roles} == {ORG_ADMIN_ID}

    def test_update_user_organization_roles_demote_admin_when_not_last(
        self, client, db_session, admin
    ):
        """Should allow demoting an admin when the organization has another admin"""
        _, org, token = admin
        org_user = create_org_user_with_roles(db_session, org, [ORG_ADMIN_ID])

        resp = self.put_roles(
            client, token, org, org_user.user_id, {"role_ids": [str(ORG_MEMBER_ID)]}
        )

        assert resp.status_code == 200
        assert [role["role_id"] for role in resp.get_json()["data"]["roles"]] == [
            str(ORG_MEMBER_ID)
        ]
