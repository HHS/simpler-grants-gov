import uuid
from datetime import UTC, datetime, timedelta

import pytest

from src.constants.lookup_constants import LegacyUserStatus, Privilege
from tests.lib.organization_test_utils import create_user_in_org, create_user_not_in_org
from tests.src.db.models.factories import (
    IgnoredLegacyOrganizationUserFactory,
    LinkExternalUserFactory,
    OrganizationFactory,
    OrganizationInvitationFactory,
    OrganizationUserFactory,
    SamGovEntityFactory,
    StagingTuserProfileFactory,
    StagingVuserAccountFactory,
    UserFactory,
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
        )

        # Ensure organization has a UEI (factory generates unique UEIs)
        sam_gov_entity = SamGovEntityFactory.create()
        organization.sam_gov_entity = sam_gov_entity
        uei = sam_gov_entity.uei

        # Create legacy users with different statuses
        # Available user
        vuseraccount_available = StagingVuserAccountFactory.create(
            email="available@example.com",
            full_name="Available User",
            is_active="Y",
            is_deleted_legacy="N",
        )
        StagingTuserProfileFactory.create(
            user_account_id=vuseraccount_available.user_account_id,
            profile_duns=uei,
            profile_type_id=4,
            is_deleted_legacy="N",
        )

        # Member user (in organization)
        vuseraccount_member = StagingVuserAccountFactory.create(
            email="member@example.com",
            full_name="Member User",
            is_active="Y",
            is_deleted_legacy="N",
        )
        StagingTuserProfileFactory.create(
            user_account_id=vuseraccount_member.user_account_id,
            profile_duns=uei,
            profile_type_id=4,
            is_deleted_legacy="N",
        )
        # Link this user to the organization
        member_user = UserFactory.create()
        LinkExternalUserFactory.create(
            user=member_user,
            email=vuseraccount_member.email,
        )
        OrganizationUserFactory.create(
            user=member_user,
            organization=organization,
        )

        # Pending invitation user
        vuseraccount_pending = StagingVuserAccountFactory.create(
            email="pending@example.com",
            full_name="Pending User",
            is_active="Y",
            is_deleted_legacy="N",
        )
        StagingTuserProfileFactory.create(
            user_account_id=vuseraccount_pending.user_account_id,
            profile_duns=uei,
            profile_type_id=4,
            is_deleted_legacy="N",
        )
        # Create pending invitation
        OrganizationInvitationFactory.create(
            organization=organization,
            inviter_user=user,
            invitee_email=vuseraccount_pending.email,
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
        )

        sam_gov_entity = SamGovEntityFactory.create()
        organization.sam_gov_entity = sam_gov_entity
        uei = sam_gov_entity.uei

        # Create available user
        vuseraccount = StagingVuserAccountFactory.create(
            email="available@example.com",
            full_name="Available User",
            is_active="Y",
            is_deleted_legacy="N",
        )
        StagingTuserProfileFactory.create(
            user_account_id=vuseraccount.user_account_id,
            profile_duns=uei,
            profile_type_id=4,
            is_deleted_legacy="N",
        )

        # Create member user
        vuseraccount_member = StagingVuserAccountFactory.create(
            email="member@example.com",
            full_name="Member User",
            is_active="Y",
            is_deleted_legacy="N",
        )
        StagingTuserProfileFactory.create(
            user_account_id=vuseraccount_member.user_account_id,
            profile_duns=uei,
            profile_type_id=4,
            is_deleted_legacy="N",
        )
        member_user = UserFactory.create()
        LinkExternalUserFactory.create(
            user=member_user,
            email=vuseraccount_member.email,
        )
        OrganizationUserFactory.create(
            user=member_user,
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
        assert data["pagination_info"]["total_records"] == 1

    def test_list_legacy_users_200_success_with_status_filter_multiple(
        self, client, db_session, enable_factory_create
    ):
        """Test successful legacy user listing with multiple status filters"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
        )

        sam_gov_entity = SamGovEntityFactory.create()
        organization.sam_gov_entity = sam_gov_entity
        uei = sam_gov_entity.uei

        # Create users with all three statuses
        # Available
        vuseraccount1 = StagingVuserAccountFactory.create(
            email="available@example.com",
            is_active="Y",
            is_deleted_legacy="N",
        )
        StagingTuserProfileFactory.create(
            user_account_id=vuseraccount1.user_account_id,
            profile_duns=uei,
            profile_type_id=4,
            is_deleted_legacy="N",
        )

        # Member
        vuseraccount2 = StagingVuserAccountFactory.create(
            email="member@example.com",
            is_active="Y",
            is_deleted_legacy="N",
        )
        StagingTuserProfileFactory.create(
            user_account_id=vuseraccount2.user_account_id,
            profile_duns=uei,
            profile_type_id=4,
            is_deleted_legacy="N",
        )
        member_user = UserFactory.create()
        LinkExternalUserFactory.create(user=member_user, email=vuseraccount2.email)
        OrganizationUserFactory.create(user=member_user, organization=organization)

        # Pending invitation
        vuseraccount3 = StagingVuserAccountFactory.create(
            email="pending@example.com",
            is_active="Y",
            is_deleted_legacy="N",
        )
        StagingTuserProfileFactory.create(
            user_account_id=vuseraccount3.user_account_id,
            profile_duns=uei,
            profile_type_id=4,
            is_deleted_legacy="N",
        )
        OrganizationInvitationFactory.create(
            organization=organization,
            inviter_user=user,
            invitee_email=vuseraccount3.email,
            expires_at=datetime.now(UTC) + timedelta(days=7),
            accepted_at=None,
            rejected_at=None,
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

        # Ensure organization has UEI but no matching legacy users
        sam_gov_entity = SamGovEntityFactory.create()
        organization.sam_gov_entity = sam_gov_entity
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
        """Test that pagination defaults are applied when not provided"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
        )

        sam_gov_entity = SamGovEntityFactory.create()
        organization.sam_gov_entity = sam_gov_entity
        uei = sam_gov_entity.uei

        # Create 15 legacy users
        for i in range(15):
            vuseraccount = StagingVuserAccountFactory.create(
                email=f"user{i}@example.com",
                is_active="Y",
                is_deleted_legacy="N",
            )
            StagingTuserProfileFactory.create(
                user_account_id=vuseraccount.user_account_id,
                profile_duns=uei,
                profile_type_id=4,
                is_deleted_legacy="N",
            )

        db_session.commit()

        # Call with empty pagination object - should use all defaults
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/legacy-users",
            headers={"X-SGG-Token": token},
            json={"pagination": {}},  # Empty pagination uses defaults
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["message"] == "Success"

        # Should return first 10 (default page_size)
        assert len(data["data"]) == 10

        # Should be on page 1 (default page_offset)
        assert data["pagination_info"]["page_offset"] == 1
        assert data["pagination_info"]["page_size"] == 10
        assert data["pagination_info"]["total_records"] == 15
        assert data["pagination_info"]["total_pages"] == 2

        # Should be sorted by email ascending (default sort_order)
        assert data["pagination_info"]["sort_order"][0]["order_by"] == "email"
        assert data["pagination_info"]["sort_order"][0]["sort_direction"] == "ascending"

    def test_list_legacy_users_200_excludes_ignored_users(
        self, client, db_session, enable_factory_create
    ):
        """Test that ignored users are excluded from results"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
        )

        sam_gov_entity = SamGovEntityFactory.create()
        organization.sam_gov_entity = sam_gov_entity
        uei = sam_gov_entity.uei

        # Create legacy user
        vuseraccount = StagingVuserAccountFactory.create(
            email="ignored@example.com",
            full_name="Ignored User",
            is_active="Y",
            is_deleted_legacy="N",
        )
        StagingTuserProfileFactory.create(
            user_account_id=vuseraccount.user_account_id,
            profile_duns=uei,
            profile_type_id=4,
            is_deleted_legacy="N",
        )

        # Ignore this user
        IgnoredLegacyOrganizationUserFactory.create(
            organization=organization,
            user=user,
            email=vuseraccount.email,
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
        )

        sam_gov_entity = SamGovEntityFactory.create()
        organization.sam_gov_entity = sam_gov_entity
        uei = sam_gov_entity.uei

        # Create two user accounts with same email (case insensitive)
        vuseraccount_old = StagingVuserAccountFactory.create(
            email="duplicate@example.com",
            full_name="Old User",
            created_date=datetime(2020, 1, 1, tzinfo=UTC),
            is_active="Y",
            is_deleted_legacy="N",
        )
        StagingTuserProfileFactory.create(
            user_account_id=vuseraccount_old.user_account_id,
            profile_duns=uei,
            profile_type_id=4,
            is_deleted_legacy="N",
        )

        vuseraccount_new = StagingVuserAccountFactory.create(
            email="DUPLICATE@example.com",  # Case insensitive match
            full_name="New User",
            created_date=datetime(2024, 1, 1, tzinfo=UTC),
            is_active="Y",
            is_deleted_legacy="N",
        )
        StagingTuserProfileFactory.create(
            user_account_id=vuseraccount_new.user_account_id,
            profile_duns=uei,
            profile_type_id=4,
            is_deleted_legacy="N",
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
        assert data["data"][0]["full_name"] == "New User"

    def test_list_legacy_users_200_status_precedence_member_over_pending(
        self, client, db_session, enable_factory_create
    ):
        """Test that member status takes precedence over pending invitation status"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
        )

        sam_gov_entity = SamGovEntityFactory.create()
        organization.sam_gov_entity = sam_gov_entity
        uei = sam_gov_entity.uei

        # Create user who is both a member AND has a pending invitation
        vuseraccount = StagingVuserAccountFactory.create(
            email="both@example.com",
            full_name="Both Status User",
            is_active="Y",
            is_deleted_legacy="N",
        )
        StagingTuserProfileFactory.create(
            user_account_id=vuseraccount.user_account_id,
            profile_duns=uei,
            profile_type_id=4,
            is_deleted_legacy="N",
        )

        # Make them a member
        member_user = UserFactory.create()
        LinkExternalUserFactory.create(
            user=member_user,
            email=vuseraccount.email,
        )
        OrganizationUserFactory.create(
            user=member_user,
            organization=organization,
        )

        # Also give them a pending invitation
        OrganizationInvitationFactory.create(
            organization=organization,
            inviter_user=user,
            invitee_email=vuseraccount.email,
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
        )

        sam_gov_entity = SamGovEntityFactory.create()
        organization.sam_gov_entity = sam_gov_entity
        uei = sam_gov_entity.uei

        # Create 5 legacy users
        for i in range(5):
            vuseraccount = StagingVuserAccountFactory.create(
                email=f"user{i}@example.com",
                is_active="Y",
                is_deleted_legacy="N",
            )
            StagingTuserProfileFactory.create(
                user_account_id=vuseraccount.user_account_id,
                profile_duns=uei,
                profile_type_id=4,
                is_deleted_legacy="N",
            )

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
        )

        sam_gov_entity = SamGovEntityFactory.create()
        organization.sam_gov_entity = sam_gov_entity
        uei = sam_gov_entity.uei

        # Create 5 legacy users with predictable emails for sorting
        for i in range(5):
            vuseraccount = StagingVuserAccountFactory.create(
                email=f"user{i}@example.com",
                is_active="Y",
                is_deleted_legacy="N",
            )
            StagingTuserProfileFactory.create(
                user_account_id=vuseraccount.user_account_id,
                profile_duns=uei,
                profile_type_id=4,
                is_deleted_legacy="N",
            )

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
        )

        sam_gov_entity = SamGovEntityFactory.create()
        organization.sam_gov_entity = sam_gov_entity
        uei = sam_gov_entity.uei

        # Create users with specific names for sorting
        for name in ["Charlie", "Alice", "Bob"]:
            vuseraccount = StagingVuserAccountFactory.create(
                email=f"{name.lower()}@example.com",
                full_name=name,
                is_active="Y",
                is_deleted_legacy="N",
            )
            StagingTuserProfileFactory.create(
                user_account_id=vuseraccount.user_account_id,
                profile_duns=uei,
                profile_type_id=4,
                is_deleted_legacy="N",
            )

        db_session.commit()

        # Sort by full_name ascending
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/legacy-users",
            headers={"X-SGG-Token": token},
            json={
                "pagination": {
                    "page_offset": 1,
                    "page_size": 25,
                    "order_by": "full_name",
                    "sort_direction": "ascending",
                }
            },
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data["data"]) == 3
        # Check order
        assert data["data"][0]["full_name"] == "Alice"
        assert data["data"][1]["full_name"] == "Bob"
        assert data["data"][2]["full_name"] == "Charlie"

    def test_list_legacy_users_200_includes_all_required_fields(
        self, client, db_session, enable_factory_create
    ):
        """Test that response includes all required fields per specification"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
        )

        sam_gov_entity = SamGovEntityFactory.create()
        organization.sam_gov_entity = sam_gov_entity
        uei = sam_gov_entity.uei

        vuseraccount = StagingVuserAccountFactory.create(
            email="test@example.com",
            full_name="Test User",
            is_active="Y",
            is_deleted_legacy="N",
        )
        StagingTuserProfileFactory.create(
            user_account_id=vuseraccount.user_account_id,
            profile_duns=uei,
            profile_type_id=4,
            is_deleted_legacy="N",
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
        required_fields = ["email", "full_name", "status"]
        for field in required_fields:
            assert field in user_data, f"Missing required field: {field}"

        # Check field types and values
        assert isinstance(user_data["email"], str)
        assert isinstance(user_data["full_name"], str)
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

        # Create a different organization
        other_organization = OrganizationFactory.create()
        other_organization.sam_gov_entity = SamGovEntityFactory.create()
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
        )

        organization.sam_gov_entity = SamGovEntityFactory.create()
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
        """Test that partial pagination parameters use defaults for missing values"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
        )

        sam_gov_entity = SamGovEntityFactory.create()
        organization.sam_gov_entity = sam_gov_entity
        uei = sam_gov_entity.uei

        # Create a few test users
        for i in range(5):
            vuseraccount = StagingVuserAccountFactory.create(
                email=f"user{i}@example.com",
                is_active="Y",
                is_deleted_legacy="N",
            )
            StagingTuserProfileFactory.create(
                user_account_id=vuseraccount.user_account_id,
                profile_duns=uei,
                profile_type_id=4,
                is_deleted_legacy="N",
            )

        db_session.commit()

        # Provide only page_size, should use default page_offset=1
        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/legacy-users",
            headers={"X-SGG-Token": token},
            json={"pagination": {"page_size": 3}},  # Only page_size provided
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data["data"]) == 3
        assert data["pagination_info"]["page_offset"] == 1  # Default
        assert data["pagination_info"]["page_size"] == 3

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
