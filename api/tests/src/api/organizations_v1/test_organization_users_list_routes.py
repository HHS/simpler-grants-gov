import uuid

import pytest

from src.constants.lookup_constants import Privilege
from tests.lib.organization_test_utils import create_user_in_org, create_user_not_in_org
from tests.src.db.models.factories import OrganizationFactory, UserProfileFactory


class TestOrganizationUsers:
    """Test POST /v1/organizations/:organization_id/users endpoint"""

    def test_get_organization_users_200_with_multiple_members(
        self, enable_factory_create, client, db_session
    ):
        """Test getting organization users with multiple members"""
        # Create organization owner with required privileges
        owner, organization, owner_token = create_user_in_org(
            privileges=[Privilege.VIEW_ORG_MEMBERSHIP],
            db_session=db_session,
        )

        # Create additional member with different role
        member, _, _ = create_user_in_org(
            privileges=[Privilege.VIEW_APPLICATION],
            db_session=db_session,
            organization=organization,
        )

        # Make request
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/users",
            headers={"X-SGG-Token": owner_token},
        )

        assert resp.status_code == 200
        data = resp.get_json()

        assert data["message"] == "Success"
        assert len(data["data"]) == 2

        # Verify correct users are returned
        returned_user_ids = {user["user_id"] for user in data["data"]}
        expected_user_ids = {str(owner.user_id), str(member.user_id)}
        assert returned_user_ids == expected_user_ids

        # Verify user data structure and content
        for user_data in data["data"]:
            assert "user_id" in user_data
            assert "email" in user_data
            assert "roles" in user_data
            assert isinstance(user_data["roles"], list)

            # Verify role structure
            for role in user_data["roles"]:
                assert "role_id" in role
                assert "role_name" in role
                assert "privileges" in role
                assert isinstance(role["privileges"], list)

    def test_get_organization_users_200_single_member(
        self, enable_factory_create, client, db_session
    ):
        """Test getting organization users with single member"""
        # Create user in organization with required privileges
        user, organization, token = create_user_in_org(
            privileges=[Privilege.VIEW_ORG_MEMBERSHIP],
            db_session=db_session,
        )

        # Create profile
        user_profile = UserProfileFactory.create(user=user)

        # Make request
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/users",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 200
        data = resp.get_json()

        assert data["message"] == "Success"
        assert len(data["data"]) == 1
        assert data["data"][0]["user_id"] == str(user.user_id)
        assert data["data"][0]["first_name"] == user_profile.first_name
        assert data["data"][0]["last_name"] == user_profile.last_name

    def test_get_organization_users_403_user_not_member_of_target_organization(
        self, enable_factory_create, client, db_session
    ):
        """Test that user from different organization cannot access another organization's users"""
        # Create user with privileges in their own organization
        user, user_org, token = create_user_in_org(
            privileges=[Privilege.VIEW_ORG_MEMBERSHIP],
            db_session=db_session,
        )

        # Create different organization with its own member
        other_organization = OrganizationFactory.create()
        _, _, _ = create_user_in_org(
            privileges=[Privilege.VIEW_ORG_MEMBERSHIP],
            db_session=db_session,
            organization=other_organization,
        )

        # User from first organization tries to access second organization's users
        resp = client.post(
            f"/v1/organizations/{other_organization.organization_id}/users",
            headers={"X-SGG-Token": token},
        )

        # This should return 403 because user is not a member of other_organization
        assert resp.status_code == 403

    def test_get_organization_users_403_no_privilege(
        self, enable_factory_create, client, db_session
    ):
        """Test that user without VIEW_ORG_MEMBERSHIP privilege gets 403"""
        # Create user in organization with wrong privilege (not VIEW_ORG_MEMBERSHIP)
        user, organization, token = create_user_in_org(
            privileges=[Privilege.VIEW_APPLICATION],
            db_session=db_session,
        )

        # Make request
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/users",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 403

    def test_get_organization_users_403_different_organization(
        self, enable_factory_create, client, db_session
    ):
        """Test that user from different organization gets 403"""
        # Create user in one organization with proper privileges
        user, user_organization, token = create_user_in_org(
            privileges=[Privilege.VIEW_ORG_MEMBERSHIP],
            db_session=db_session,
        )

        # Create a different organization that user is NOT a member of
        other_organization = OrganizationFactory.create()

        # Try to access other_organization
        resp = client.post(
            f"/v1/organizations/{other_organization.organization_id}/users",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 403

    def test_get_organization_users_403_not_organization_member(
        self, enable_factory_create, client, db_session
    ):
        """Test that non-member trying to access gets 403"""
        # Create user that is NOT a member of any organization
        user, token = create_user_not_in_org(db_session)

        # Create organization (user is NOT a member)
        organization = OrganizationFactory.create()

        # Make request
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/users",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 403

    def test_get_organization_users_404_organization_not_found(
        self, enable_factory_create, client, db_session
    ):
        """Test that non-existent organization returns 404"""
        # Create user (doesn't need to be in any organization for this test)
        user, token = create_user_not_in_org(db_session)

        # Try to access non-existent organization
        non_existent_id = str(uuid.uuid4())
        resp = client.post(
            f"/v1/organizations/{non_existent_id}/users",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 404

    def test_get_organization_users_401_no_token(self, client):
        """Test that accessing organization users without auth token returns 401"""
        random_org_id = str(uuid.uuid4())

        resp = client.post(f"/v1/organizations/{random_org_id}/users")

        assert resp.status_code == 401

    def test_get_organization_users_401_invalid_token(self, client):
        """Test that accessing organization users with invalid token returns 401"""
        random_org_id = str(uuid.uuid4())

        resp = client.post(
            f"/v1/organizations/{random_org_id}/users",
            headers={"X-SGG-Token": "invalid-token"},
        )

        assert resp.status_code == 401

    def test_get_organization_users_with_multiple_roles(
        self, enable_factory_create, client, db_session
    ):
        """Test users with multiple roles in same organization"""
        # Create organization owner with required privileges
        owner, organization, owner_token = create_user_in_org(
            privileges=[Privilege.VIEW_ORG_MEMBERSHIP, Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
        )

        # Make request
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/users",
            headers={"X-SGG-Token": owner_token},
        )

        assert resp.status_code == 200
        data = resp.get_json()

        assert data["message"] == "Success"
        assert len(data["data"]) == 1

        user_data = data["data"][0]
        assert len(user_data["roles"]) == 1  # User has one role with multiple privileges

        role = user_data["roles"][0]
        privileges = role["privileges"]
        assert "view_org_membership" in privileges
        assert "manage_org_members" in privileges

    def test_get_organization_users_with_email(self, enable_factory_create, client, db_session):
        """Test that user email is properly returned"""
        # Create user in organization with required privileges
        user, organization, token = create_user_in_org(
            privileges=[Privilege.VIEW_ORG_MEMBERSHIP],
            db_session=db_session,
        )

        # Make request
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/users",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 200
        data = resp.get_json()

        assert data["message"] == "Success"
        assert len(data["data"]) == 1

        user_data = data["data"][0]
        assert user_data["email"] == user.email  # Validate actual email value

    @pytest.mark.parametrize(
        "privilege_set,expected_status",
        [
            ([Privilege.VIEW_ORG_MEMBERSHIP], 200),
            ([Privilege.MANAGE_ORG_MEMBERS], 403),
            ([Privilege.VIEW_APPLICATION], 403),
            ([Privilege.VIEW_ORG_MEMBERSHIP, Privilege.MANAGE_ORG_MEMBERS], 200),
            ([], 403),
        ],
    )
    def test_get_organization_users_privilege_requirements(
        self, enable_factory_create, client, db_session, privilege_set, expected_status
    ):
        """Test various privilege combinations to ensure only VIEW_ORG_MEMBERSHIP grants access"""
        # Create user in organization with specified privileges
        user, organization, token = create_user_in_org(
            privileges=privilege_set,
            db_session=db_session,
        )

        # Make request
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/users",
            headers={"X-SGG-Token": token},
        )
        assert resp.status_code == expected_status

        if expected_status == 200:
            data = resp.get_json()
            assert data["message"] == "Success"
            assert len(data["data"]) >= 1
