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
            assert "is_ebiz_poc" in user_data
            assert user_data["is_ebiz_poc"] is False

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
        assert data["data"][0]["is_ebiz_poc"] is False

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
        assert user_data["is_ebiz_poc"] is False

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
        assert user_data["is_ebiz_poc"] is False

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
            # Verify is_ebiz_poc field is present
            assert "is_ebiz_poc" in data["data"][0]
            assert data["data"][0]["is_ebiz_poc"] is False

    def test_get_organization_users_200_with_ebiz_poc(
        self, enable_factory_create, client, db_session
    ):
        """Test that user matching SAM.gov Ebiz PoC email has is_ebiz_poc=True"""
        from tests.src.db.models.factories import OrganizationFactory, SamGovEntityFactory

        # Create SAM.gov entity with Ebiz PoC email
        sam_entity = SamGovEntityFactory.create(
            ebiz_poc_email="ebiz@example.com",
            ebiz_poc_first_name="John",
            ebiz_poc_last_name="Doe",
        )

        # Create organization linked to SAM.gov entity
        organization = OrganizationFactory.create(sam_gov_entity=sam_entity)

        # Create user with matching email
        ebiz_user, _, ebiz_token = create_user_in_org(
            privileges=[Privilege.VIEW_ORG_MEMBERSHIP],
            db_session=db_session,
            organization=organization,
            email="ebiz@example.com",  # Matches SAM.gov entity
        )

        # Create another user without matching email
        regular_user, _, _ = create_user_in_org(
            privileges=[Privilege.VIEW_APPLICATION],
            db_session=db_session,
            organization=organization,
            email="other@example.com",
        )

        # Make request
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/users",
            headers={"X-SGG-Token": ebiz_token},
        )

        assert resp.status_code == 200
        data = resp.get_json()

        assert len(data["data"]) == 2

        # Find users in response
        ebiz_user_data = next(u for u in data["data"] if u["user_id"] == str(ebiz_user.user_id))
        regular_user_data = next(
            u for u in data["data"] if u["user_id"] == str(regular_user.user_id)
        )

        # Verify Ebiz PoC user has flag set
        assert ebiz_user_data["is_ebiz_poc"] is True
        assert ebiz_user_data["email"] == "ebiz@example.com"

        # Verify regular user does not have flag set
        assert regular_user_data["is_ebiz_poc"] is False
        assert regular_user_data["email"] == "other@example.com"

    def test_get_organization_users_200_no_sam_entity(
        self, enable_factory_create, client, db_session
    ):
        """Test that users in org without SAM.gov entity have is_ebiz_poc=False"""
        # Create organization WITHOUT SAM.gov entity
        user, organization, token = create_user_in_org(
            privileges=[Privilege.VIEW_ORG_MEMBERSHIP],
            db_session=db_session,
            without_sam_gov_entity=True,
        )

        # Explicitly ensure no SAM entity
        assert organization.sam_gov_entity is None

        # Make request
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/users",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 200
        data = resp.get_json()

        assert len(data["data"]) == 1
        assert data["data"][0]["is_ebiz_poc"] is False
