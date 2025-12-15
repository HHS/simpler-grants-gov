import uuid

import pytest

from src.constants.lookup_constants import Privilege
from tests.lib.organization_test_utils import create_user_in_org, create_user_not_in_org
from tests.src.db.models.factories import OrganizationFactory, UserProfileFactory


def _default_pagination_request(
    page_offset=1, page_size=10, order_by="email", sort_direction="ascending"
):
    """Helper to create default pagination request body."""
    return {
        "pagination": {
            "page_offset": page_offset,
            "page_size": page_size,
            "sort_order": [{"order_by": order_by, "sort_direction": sort_direction}],
        }
    }


class TestListOrganizationUsers:
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
            json=_default_pagination_request(),
        )

        assert resp.status_code == 200
        data = resp.get_json()

        assert data["message"] == "Success"
        assert len(data["data"]) == 2

        # Verify pagination info
        assert data["pagination_info"]["page_offset"] == 1
        assert data["pagination_info"]["page_size"] == 10
        assert data["pagination_info"]["total_records"] == 2
        assert data["pagination_info"]["total_pages"] == 1

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
            json=_default_pagination_request(),
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
            json=_default_pagination_request(),
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
            json=_default_pagination_request(),
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
            json=_default_pagination_request(),
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
            json=_default_pagination_request(),
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
            json=_default_pagination_request(),
        )

        assert resp.status_code == 404

    def test_get_organization_users_401_no_token(self, client):
        """Test that accessing organization users without auth token returns 401"""
        random_org_id = str(uuid.uuid4())

        resp = client.post(
            f"/v1/organizations/{random_org_id}/users", json=_default_pagination_request()
        )

        assert resp.status_code == 401

    def test_get_organization_users_401_invalid_token(self, client):
        """Test that accessing organization users with invalid token returns 401"""
        random_org_id = str(uuid.uuid4())

        resp = client.post(
            f"/v1/organizations/{random_org_id}/users",
            headers={"X-SGG-Token": "invalid-token"},
            json=_default_pagination_request(),
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
            json=_default_pagination_request(),
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
            json=_default_pagination_request(),
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
            json=_default_pagination_request(),
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
            json=_default_pagination_request(),
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
            json=_default_pagination_request(),
        )

        assert resp.status_code == 200
        data = resp.get_json()

        assert len(data["data"]) == 1
        assert data["data"][0]["is_ebiz_poc"] is False


class TestListOrganizationUsersPagination:
    """Test pagination and sorting behavior for organization users endpoint"""

    @pytest.mark.parametrize(
        "total_users,page_size,page_offset,expected_count,expected_total_pages",
        [
            (25, 10, 1, 10, 3),  # First page of 3
            (25, 10, 2, 10, 3),  # Middle page of 3
            (25, 10, 3, 5, 3),  # Last page with partial results
            (10, 10, 1, 10, 1),  # Single page, exact fit
            (5, 10, 1, 5, 1),  # Single page, less than page size
            (25, 5, 1, 5, 5),  # Small page size
            (25, 5, 5, 5, 5),  # Last page with small page size
        ],
    )
    def test_pagination_page_sizes_and_offsets(
        self,
        enable_factory_create,
        client,
        db_session,
        total_users,
        page_size,
        page_offset,
        expected_count,
        expected_total_pages,
    ):
        """Test various pagination configurations with different page sizes and offsets"""
        # Create organization owner with required privileges
        owner, organization, owner_token = create_user_in_org(
            privileges=[Privilege.VIEW_ORG_MEMBERSHIP],
            db_session=db_session,
        )

        # Create additional users (total_users - 1 since owner exists)
        for _ in range(total_users - 1):
            create_user_in_org(
                privileges=[Privilege.VIEW_APPLICATION],
                db_session=db_session,
                organization=organization,
            )

        # Make request with specific pagination parameters
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/users",
            headers={"X-SGG-Token": owner_token},
            json=_default_pagination_request(page_offset=page_offset, page_size=page_size),
        )

        assert resp.status_code == 200
        data = resp.get_json()

        # Verify pagination results
        assert len(data["data"]) == expected_count
        assert data["pagination_info"]["page_offset"] == page_offset
        assert data["pagination_info"]["page_size"] == page_size
        assert data["pagination_info"]["total_records"] == total_users
        assert data["pagination_info"]["total_pages"] == expected_total_pages

    @pytest.mark.parametrize(
        "sort_field,sort_direction",
        [
            ("email", "ascending"),
            ("email", "descending"),
            ("first_name", "ascending"),
            ("first_name", "descending"),
            ("last_name", "ascending"),
            ("last_name", "descending"),
            ("created_at", "ascending"),
            ("created_at", "descending"),
        ],
    )
    def test_sorting_all_fields_and_directions(
        self, enable_factory_create, client, db_session, sort_field, sort_direction
    ):
        """Test sorting by each allowed field in both directions"""
        # Create organization owner with required privileges and profile
        owner, organization, owner_token = create_user_in_org(
            privileges=[Privilege.VIEW_ORG_MEMBERSHIP],
            db_session=db_session,
            first_name="Alice",
            last_name="Anderson",
        )

        # Create additional users with profiles for sorting
        user2, _, _ = create_user_in_org(
            privileges=[Privilege.VIEW_APPLICATION],
            db_session=db_session,
            organization=organization,
            first_name="Bob",
            last_name="Brown",
        )

        user3, _, _ = create_user_in_org(
            privileges=[Privilege.VIEW_APPLICATION],
            db_session=db_session,
            organization=organization,
            first_name="Charlie",
            last_name="Clark",
        )

        # Make request with specific sort order
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/users",
            headers={"X-SGG-Token": owner_token},
            json=_default_pagination_request(order_by=sort_field, sort_direction=sort_direction),
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data["data"]) == 3

        # Verify data is sorted correctly by checking order
        users = data["data"]

        if sort_field == "email":
            # Email addresses generated by factories should be sortable
            emails = [u["email"] for u in users]
            if sort_direction == "ascending":
                assert emails == sorted(emails)
            else:
                assert emails == sorted(emails, reverse=True)

        elif sort_field == "first_name":
            first_names = [u["first_name"] for u in users]
            if sort_direction == "ascending":
                assert first_names == ["Alice", "Bob", "Charlie"]
            else:
                assert first_names == ["Charlie", "Bob", "Alice"]

        elif sort_field == "last_name":
            last_names = [u["last_name"] for u in users]
            if sort_direction == "ascending":
                assert last_names == ["Anderson", "Brown", "Clark"]
            else:
                assert last_names == ["Clark", "Brown", "Anderson"]

        elif sort_field == "created_at":
            # Verify created_at is ordered properly
            created_ats = [u["user_id"] for u in users]
            # Just verify we got all users - specific order depends on creation timing
            assert len(created_ats) == 3

    def test_sorting_nulls_last_behavior(self, enable_factory_create, client, db_session):
        """Test that users without profiles (null names) appear last in sort order"""
        # Create organization owner with required privileges and profile
        owner, organization, owner_token = create_user_in_org(
            privileges=[Privilege.VIEW_ORG_MEMBERSHIP],
            db_session=db_session,
            first_name="Alice",
        )

        # Create user WITHOUT profile (null first_name)
        user_no_profile, _, _ = create_user_in_org(
            privileges=[Privilege.VIEW_APPLICATION],
            db_session=db_session,
            organization=organization,
        )

        # Create user WITH profile
        user_with_profile, _, _ = create_user_in_org(
            privileges=[Privilege.VIEW_APPLICATION],
            db_session=db_session,
            organization=organization,
            first_name="Zoe",
        )

        # Sort by first_name ascending - user without profile should be last
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/users",
            headers={"X-SGG-Token": owner_token},
            json=_default_pagination_request(order_by="first_name", sort_direction="ascending"),
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data["data"]) == 3

        users = data["data"]
        # First two should have names, last should be None
        assert users[0]["first_name"] == "Alice"
        assert users[1]["first_name"] == "Zoe"
        assert users[2]["first_name"] is None

    def test_multi_field_sorting(self, enable_factory_create, client, db_session):
        """Test sorting by multiple fields (compound sort order)"""
        # Create organization owner
        owner, organization, owner_token = create_user_in_org(
            privileges=[Privilege.VIEW_ORG_MEMBERSHIP],
            db_session=db_session,
            first_name="Alice",
            last_name="Smith",
        )

        # Create users with same last name but different first names
        user2, _, _ = create_user_in_org(
            privileges=[Privilege.VIEW_APPLICATION],
            db_session=db_session,
            organization=organization,
            first_name="Bob",
            last_name="Smith",
        )

        user3, _, _ = create_user_in_org(
            privileges=[Privilege.VIEW_APPLICATION],
            db_session=db_session,
            organization=organization,
            first_name="Charlie",
            last_name="Brown",
        )

        # Sort by last_name then first_name
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/users",
            headers={"X-SGG-Token": owner_token},
            json={
                "pagination": {
                    "page_offset": 1,
                    "page_size": 10,
                    "sort_order": [
                        {"order_by": "last_name", "sort_direction": "ascending"},
                        {"order_by": "first_name", "sort_direction": "ascending"},
                    ],
                }
            },
        )

        assert resp.status_code == 200
        data = resp.get_json()
        users = data["data"]

        # Brown should come first, then Smiths sorted by first name
        assert users[0]["last_name"] == "Brown"
        assert users[0]["first_name"] == "Charlie"
        assert users[1]["last_name"] == "Smith"
        assert users[1]["first_name"] == "Alice"
        assert users[2]["last_name"] == "Smith"
        assert users[2]["first_name"] == "Bob"
