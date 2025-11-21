import uuid
from datetime import UTC, datetime, timedelta

import pytest

from src.constants.lookup_constants import LegacyUserStatus, Privilege
from tests.lib.legacy_user_test_utils import create_legacy_user_with_status
from tests.lib.organization_test_utils import create_user_in_org, create_user_not_in_org
from tests.src.db.models.factories import (
    IgnoredLegacyOrganizationUserFactory,
    OrganizationFactory,
    OrganizationInvitationFactory,
    SamGovEntityFactory,
)


class TestListLegacyUsers:
    """Test POST /v1/organizations/:organization_id/legacy-users endpoint"""

    def test_list_legacy_users_200_success_no_filters(
        self, client, db_session, enable_factory_create
    ):
        """Test successful legacy user listing without filters returns all statuses"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
            with_sam_gov_entity=True,
        )
        uei = organization.sam_gov_entity.uei

        # Create legacy users with different statuses
        create_legacy_user_with_status(
            uei,
            "available@example.com",
            first_name="Available",
            last_name="User",
            status=LegacyUserStatus.AVAILABLE,
        )
        create_legacy_user_with_status(
            uei,
            "member@example.com",
            first_name="Member",
            last_name="User",
            status=LegacyUserStatus.MEMBER,
            organization=organization,
        )
        create_legacy_user_with_status(
            uei,
            "pending@example.com",
            first_name="Pending",
            last_name="User",
            status=LegacyUserStatus.PENDING_INVITATION,
            organization=organization,
            inviter=user,
        )

        db_session.commit()

        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/legacy-users",
            headers={"X-SGG-Token": token},
            json={"pagination": {"page_offset": 1, "page_size": 10}},
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["message"] == "Success"
        assert len(data["data"]) == 3

        # Check all statuses are present
        statuses = {item["status"] for item in data["data"]}
        assert statuses == {
            LegacyUserStatus.AVAILABLE,
            LegacyUserStatus.MEMBER,
            LegacyUserStatus.PENDING_INVITATION,
        }

        # Check pagination info
        assert data["pagination_info"]["page_offset"] == 1
        assert data["pagination_info"]["total_records"] == 3

    def test_list_legacy_users_200_success_with_status_filter_single(
        self, client, db_session, enable_factory_create
    ):
        """Test successful legacy user listing with single status filter"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
            with_sam_gov_entity=True,
        )
        uei = organization.sam_gov_entity.uei

        # Create available and member users
        create_legacy_user_with_status(
            uei,
            "available@example.com",
            first_name="Available",
            last_name="User",
            status=LegacyUserStatus.AVAILABLE,
        )
        create_legacy_user_with_status(
            uei,
            "member@example.com",
            first_name="Member",
            last_name="User",
            status=LegacyUserStatus.MEMBER,
            organization=organization,
        )

        db_session.commit()

        # Filter for only available users
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/legacy-users",
            headers={"X-SGG-Token": token},
            json={
                "filters": {"status": {"one_of": [LegacyUserStatus.AVAILABLE]}},
                "pagination": {"page_offset": 1, "page_size": 10},
            },
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["message"] == "Success"
        assert len(data["data"]) == 1
        assert data["data"][0]["email"] == "available@example.com"
        assert data["data"][0]["status"] == LegacyUserStatus.AVAILABLE
        # Note: total_records is 2 (before filtering) since status filter is applied in Python
        assert data["pagination_info"]["total_records"] == 2

    def test_list_legacy_users_200_success_with_status_filter_multiple(
        self, client, db_session, enable_factory_create
    ):
        """Test successful legacy user listing with multiple status filters"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
            with_sam_gov_entity=True,
        )
        uei = organization.sam_gov_entity.uei

        # Create users with all three statuses
        create_legacy_user_with_status(
            uei, "available@example.com", status=LegacyUserStatus.AVAILABLE
        )
        create_legacy_user_with_status(
            uei, "member@example.com", status=LegacyUserStatus.MEMBER, organization=organization
        )
        create_legacy_user_with_status(
            uei,
            "pending@example.com",
            status=LegacyUserStatus.PENDING_INVITATION,
            organization=organization,
            inviter=user,
        )

        db_session.commit()

        # Filter for member and pending invitation (exclude available)
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/legacy-users",
            headers={"X-SGG-Token": token},
            json={
                "filters": {
                    "status": {
                        "one_of": [LegacyUserStatus.MEMBER, LegacyUserStatus.PENDING_INVITATION]
                    }
                },
                "pagination": {"page_offset": 1, "page_size": 10},
            },
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["message"] == "Success"
        assert len(data["data"]) == 2

        emails = {item["email"] for item in data["data"]}
        assert emails == {"member@example.com", "pending@example.com"}

        statuses = {item["status"] for item in data["data"]}
        assert statuses == {LegacyUserStatus.MEMBER, LegacyUserStatus.PENDING_INVITATION}

    def test_list_legacy_users_200_success_empty_list(
        self, client, db_session, enable_factory_create
    ):
        """Test successful response with no legacy users"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
        )

        # Ensure organization has UEI but no matching legacy users (auto-created)
        db_session.commit()

        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/legacy-users",
            headers={"X-SGG-Token": token},
            json={"pagination": {"page_offset": 1, "page_size": 10}},
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["message"] == "Success"
        assert data["data"] == []
        assert data["pagination_info"]["total_records"] == 0

    def test_list_legacy_users_200_uses_pagination_defaults(
        self, client, db_session, enable_factory_create
    ):
        """Test that default sort_order is applied when not provided"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
            with_sam_gov_entity=True,
        )
        uei = organization.sam_gov_entity.uei

        # Create users with different emails to test sorting
        create_legacy_user_with_status(uei, "zebra@example.com")
        create_legacy_user_with_status(uei, "apple@example.com")
        create_legacy_user_with_status(uei, "banana@example.com")

        db_session.commit()

        # Call without sort_order - should use default (email ascending)
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/legacy-users",
            headers={"X-SGG-Token": token},
            json={"pagination": {"page_offset": 1, "page_size": 10}},  # No sort_order
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["message"] == "Success"
        assert len(data["data"]) == 3

        # Should be sorted by email ascending (default sort_order)
        assert data["pagination_info"]["sort_order"][0]["order_by"] == "email"
        assert data["pagination_info"]["sort_order"][0]["sort_direction"] == "ascending"

        # Verify actual sort order in results
        assert data["data"][0]["email"] == "apple@example.com"
        assert data["data"][1]["email"] == "banana@example.com"
        assert data["data"][2]["email"] == "zebra@example.com"

    def test_list_legacy_users_200_excludes_ignored_users(
        self, client, db_session, enable_factory_create
    ):
        """Test that ignored users are excluded from results"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
            with_sam_gov_entity=True,
        )
        uei = organization.sam_gov_entity.uei

        # Create legacy user
        create_legacy_user_with_status(
            uei, "ignored@example.com", first_name="Ignored", last_name="User"
        )

        # Ignore this user
        IgnoredLegacyOrganizationUserFactory.create(
            organization=organization,
            user=user,
            email="ignored@example.com",
        )

        db_session.commit()

        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/legacy-users",
            headers={"X-SGG-Token": token},
            json={"pagination": {"page_offset": 1, "page_size": 10}},
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["message"] == "Success"
        assert data["data"] == []

    def test_list_legacy_users_200_deduplicates_by_email(
        self, client, db_session, enable_factory_create
    ):
        """Test that duplicate emails return only the most recent record"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
            with_sam_gov_entity=True,
        )
        uei = organization.sam_gov_entity.uei

        # Create two user accounts with same email (case insensitive)
        create_legacy_user_with_status(
            uei,
            "duplicate@example.com",
            first_name="Old",
            last_name="User",
            created_date=datetime(2020, 1, 1, tzinfo=UTC),
        )
        create_legacy_user_with_status(
            uei,
            "DUPLICATE@example.com",  # Case insensitive match
            first_name="New",
            last_name="User",
            created_date=datetime(2024, 1, 1, tzinfo=UTC),
        )

        db_session.commit()

        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/legacy-users",
            headers={"X-SGG-Token": token},
            json={"pagination": {"page_offset": 1, "page_size": 10}},
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["message"] == "Success"
        assert len(data["data"]) == 1
        # Should return the most recent user
        assert data["data"][0]["first_name"] == "New"
        assert data["data"][0]["last_name"] == "User"

    def test_list_legacy_users_200_status_precedence_member_over_pending(
        self, client, db_session, enable_factory_create
    ):
        """Test that member status takes precedence over pending invitation status"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
            with_sam_gov_entity=True,
        )
        uei = organization.sam_gov_entity.uei

        # Create user as a member (will test that member status takes precedence)
        create_legacy_user_with_status(
            uei,
            "both@example.com",
            first_name="Both",
            last_name="User",
            status=LegacyUserStatus.MEMBER,
            organization=organization,
        )

        # Also create a pending invitation for the same user
        # (Member status should take precedence in the CASE statement)
        OrganizationInvitationFactory.create(
            organization=organization,
            inviter_user=user,
            invitee_email="both@example.com",
            expires_at=datetime.now(UTC) + timedelta(days=7),
            accepted_at=None,
            rejected_at=None,
        )

        db_session.commit()

        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/legacy-users",
            headers={"X-SGG-Token": token},
            json={"pagination": {"page_offset": 1, "page_size": 10}},
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["message"] == "Success"
        assert len(data["data"]) == 1
        # Member status should take precedence
        assert data["data"][0]["status"] == LegacyUserStatus.MEMBER

    def test_list_legacy_users_200_pagination_page_size(
        self, client, db_session, enable_factory_create
    ):
        """Test pagination with different page sizes"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
            with_sam_gov_entity=True,
        )
        uei = organization.sam_gov_entity.uei

        # Create 5 legacy users
        for i in range(5):
            create_legacy_user_with_status(uei, f"user{i}@example.com")

        db_session.commit()

        # Request page 1 with page size 2
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/legacy-users",
            headers={"X-SGG-Token": token},
            json={"pagination": {"page_offset": 1, "page_size": 2}},
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data["data"]) == 2
        assert data["pagination_info"]["page_size"] == 2
        assert data["pagination_info"]["total_records"] == 5
        assert data["pagination_info"]["total_pages"] == 3

    def test_list_legacy_users_200_pagination_page_offset(
        self, client, db_session, enable_factory_create
    ):
        """Test pagination with different page offsets"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
            with_sam_gov_entity=True,
        )
        uei = organization.sam_gov_entity.uei

        # Create 5 legacy users with predictable emails for sorting
        for i in range(5):
            create_legacy_user_with_status(uei, f"user{i}@example.com")

        db_session.commit()

        # Request page 2 with page size 2
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/legacy-users",
            headers={"X-SGG-Token": token},
            json={
                "pagination": {
                    "page_offset": 2,
                    "page_size": 2,
                    "order_by": "email",
                    "sort_direction": "ascending",
                }
            },
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data["data"]) == 2
        assert data["pagination_info"]["page_offset"] == 2
        # Page 2 should have user2 and user3
        emails = [item["email"] for item in data["data"]]
        assert "user2@example.com" in emails
        assert "user3@example.com" in emails

    def test_list_legacy_users_200_pagination_sorting(
        self, client, db_session, enable_factory_create
    ):
        """Test pagination with different sort orders"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
            with_sam_gov_entity=True,
        )
        uei = organization.sam_gov_entity.uei

        # Create users with specific names for sorting
        for name in ["Charlie", "Alice", "Bob"]:
            create_legacy_user_with_status(
                uei, f"{name.lower()}@example.com", first_name=name, last_name="User"
            )

        db_session.commit()

        # Sort by first_name ascending
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/legacy-users",
            headers={"X-SGG-Token": token},
            json={
                "pagination": {
                    "page_offset": 1,
                    "page_size": 25,
                    "sort_order": [{"order_by": "first_name", "sort_direction": "ascending"}],
                }
            },
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data["data"]) == 3
        # Check order
        assert data["data"][0]["first_name"] == "Alice"
        assert data["data"][1]["first_name"] == "Bob"
        assert data["data"][2]["first_name"] == "Charlie"

    def test_list_legacy_users_200_includes_all_required_fields(
        self, client, db_session, enable_factory_create
    ):
        """Test that response includes all required fields per specification"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
            with_sam_gov_entity=True,
        )
        uei = organization.sam_gov_entity.uei

        create_legacy_user_with_status(
            uei, "test@example.com", first_name="Test", last_name="User"
        )

        db_session.commit()

        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/legacy-users",
            headers={"X-SGG-Token": token},
            json={"pagination": {"page_offset": 1, "page_size": 10}},
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data["data"]) == 1

        user_data = data["data"][0]

        # Check all required fields are present
        required_fields = ["email", "first_name", "last_name", "status"]
        for field in required_fields:
            assert field in user_data, f"Missing required field: {field}"

        # Check field types and values
        assert isinstance(user_data["email"], str)
        assert isinstance(user_data["first_name"], str) or user_data["first_name"] is None
        assert isinstance(user_data["last_name"], str) or user_data["last_name"] is None
        assert user_data["status"] in [
            LegacyUserStatus.AVAILABLE,
            LegacyUserStatus.MEMBER,
            LegacyUserStatus.PENDING_INVITATION,
        ]

    def test_list_legacy_users_401_no_token(self, client, db_session, enable_factory_create):
        """Test that accessing endpoint without auth token returns 401"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
        )

        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/legacy-users",
            json={"pagination": {"page_offset": 1, "page_size": 10}},
        )

        assert resp.status_code == 401

    def test_list_legacy_users_403_insufficient_privileges(
        self, client, db_session, enable_factory_create
    ):
        """Test that user without MANAGE_ORG_MEMBERS privilege gets 403"""
        user, organization, token = create_user_in_org(
            privileges=[],  # No privileges
            db_session=db_session,
        )

        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/legacy-users",
            headers={"X-SGG-Token": token},
            json={"pagination": {"page_offset": 1, "page_size": 10}},
        )

        assert resp.status_code == 403

    def test_list_legacy_users_403_user_not_in_organization(
        self, client, db_session, enable_factory_create
    ):
        """Test that user not in organization gets 403"""
        user, token = create_user_not_in_org(db_session)

        # Create a different organization with SAM.gov entity
        other_organization = OrganizationFactory.create(sam_gov_entity=SamGovEntityFactory.create())
        db_session.commit()

        resp = client.post(
            f"/v1/organizations/{other_organization.organization_id}/legacy-users",
            headers={"X-SGG-Token": token},
            json={"pagination": {"page_offset": 1, "page_size": 10}},
        )

        assert resp.status_code == 403

    def test_list_legacy_users_404_organization_not_found(
        self, client, db_session, enable_factory_create
    ):
        """Test that non-existent organization returns 404"""
        user, token = create_user_not_in_org(db_session)
        fake_org_id = uuid.uuid4()

        resp = client.post(
            f"/v1/organizations/{fake_org_id}/legacy-users",
            headers={"X-SGG-Token": token},
            json={"pagination": {"page_offset": 1, "page_size": 10}},
        )

        assert resp.status_code == 404

    def test_list_legacy_users_400_organization_no_uei(
        self, client, db_session, enable_factory_create
    ):
        """Test that organization without UEI returns 400"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
        )

        # Ensure organization has no SAM.gov entity (no UEI)
        organization.sam_gov_entity = None
        db_session.commit()

        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/legacy-users",
            headers={"X-SGG-Token": token},
            json={"pagination": {"page_offset": 1, "page_size": 10}},
        )

        assert resp.status_code == 400
        data = resp.get_json()
        assert "UEI" in data["message"]

    def test_list_legacy_users_422_invalid_status_filter(
        self, client, db_session, enable_factory_create
    ):
        """Test that invalid status filter values return 422"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
            with_sam_gov_entity=True,
        )
        db_session.commit()

        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/legacy-users",
            headers={"X-SGG-Token": token},
            json={
                "filters": {"status": {"one_of": ["invalid_status"]}},
                "pagination": {"page_offset": 1, "page_size": 10},
            },
        )

        assert resp.status_code == 422

    def test_list_legacy_users_200_partial_pagination_uses_defaults(
        self, client, db_session, enable_factory_create
    ):
        """Test that omitting sort_order uses the default (email ascending)"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
            with_sam_gov_entity=True,
        )
        uei = organization.sam_gov_entity.uei

        # Create users to test default sorting
        create_legacy_user_with_status(uei, "zulu@example.com")
        create_legacy_user_with_status(uei, "alpha@example.com")

        db_session.commit()

        # Provide page_size and page_offset but omit sort_order
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/legacy-users",
            headers={"X-SGG-Token": token},
            json={"pagination": {"page_size": 10, "page_offset": 1}},  # No sort_order
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data["data"]) == 2
        # Should use default sort_order (email ascending)
        assert data["pagination_info"]["sort_order"][0]["order_by"] == "email"
        assert data["pagination_info"]["sort_order"][0]["sort_direction"] == "ascending"
        # Verify sort order
        assert data["data"][0]["email"] == "alpha@example.com"
        assert data["data"][1]["email"] == "zulu@example.com"

    @pytest.mark.parametrize(
        "privilege_set,expected_status",
        [
            ([Privilege.MANAGE_ORG_MEMBERS], 200),  # Correct privilege
            ([Privilege.VIEW_ORG_MEMBERSHIP], 403),  # Wrong privilege
            ([], 403),  # No privileges
        ],
    )
    def test_list_legacy_users_privilege_requirements(
        self, privilege_set, expected_status, client, db_session, enable_factory_create
    ):
        """Test that only users with MANAGE_ORG_MEMBERS privilege can access endpoint"""
        user, organization, token = create_user_in_org(
            privileges=privilege_set,
            db_session=db_session,
        )

        organization.sam_gov_entity = SamGovEntityFactory.create()
        db_session.commit()

        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/legacy-users",
            headers={"X-SGG-Token": token},
            json={"pagination": {"page_offset": 1, "page_size": 10}},
        )

        assert resp.status_code == expected_status
