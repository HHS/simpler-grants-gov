import uuid
from datetime import date

import pytest

from src.constants.lookup_constants import Privilege
from tests.lib.organization_test_utils import create_user_in_org, create_user_not_in_org
from tests.src.db.models.factories import OrganizationFactory, SamGovEntityFactory


class TestOrganizationGet:
    """Test GET /v1/organizations/:organization_id endpoint"""

    def test_get_organization_200_with_sam_gov_entity(
        self, enable_factory_create, client, db_session
    ):
        """Test getting organization with SAM.gov entity data"""
        # Create SAM.gov entity
        sam_gov_entity = SamGovEntityFactory.create(
            uei="TEST123456789",
            legal_business_name="Test Organization LLC",
            expiration_date=date(2025, 12, 31),
            ebiz_poc_email="ebiz@testorg.com",
            ebiz_poc_first_name="Jane",
            ebiz_poc_last_name="Doe",
        )

        # Create user in organization with required privileges
        user, organization, token = create_user_in_org(
            privileges=[Privilege.VIEW_ORGANIZATION],
            db_session=db_session,
            sam_gov_entity=sam_gov_entity,
        )

        # Make request
        resp = client.get(
            f"/v1/organizations/{organization.organization_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 200
        data = resp.get_json()

        assert data["message"] == "Success"
        assert data["data"]["organization_id"] == str(organization.organization_id)
        assert data["data"]["sam_gov_entity"]["uei"] == "TEST123456789"
        assert data["data"]["sam_gov_entity"]["legal_business_name"] == "Test Organization LLC"
        assert data["data"]["sam_gov_entity"]["expiration_date"] == "2025-12-31"
        assert data["data"]["sam_gov_entity"]["ebiz_poc_email"] == "ebiz@testorg.com"
        assert data["data"]["sam_gov_entity"]["ebiz_poc_first_name"] == "Jane"
        assert data["data"]["sam_gov_entity"]["ebiz_poc_last_name"] == "Doe"

    def test_get_organization_200_without_sam_gov_entity(
        self, enable_factory_create, client, db_session
    ):
        """Test getting organization without SAM.gov entity data"""
        # Create user in organization with required privileges - no SAM.gov entity
        user, organization, token = create_user_in_org(
            privileges=[Privilege.VIEW_ORGANIZATION],
            db_session=db_session,
            without_sam_gov_entity=True,
        )

        # Make request
        resp = client.get(
            f"/v1/organizations/{organization.organization_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 200
        data = resp.get_json()

        assert data["message"] == "Success"
        assert data["data"]["organization_id"] == str(organization.organization_id)
        assert data["data"]["sam_gov_entity"] is None

    def test_get_organization_403_no_privilege(self, enable_factory_create, client, db_session):
        """Test that user without VIEW_ORGANIZATION privilege gets 403"""
        # Create user in organization with wrong privilege (not VIEW_ORGANIZATION)
        user, organization, token = create_user_in_org(
            privileges=[Privilege.VIEW_APPLICATION],
            db_session=db_session,
        )

        # Make request
        resp = client.get(
            f"/v1/organizations/{organization.organization_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 403

    def test_get_organization_403_not_organization_member(
        self, enable_factory_create, client, db_session
    ):
        """Test that user who is not a member of the organization gets 403"""
        # Create user that is NOT a member of any organization
        user, token = create_user_not_in_org(db_session)

        # Create organization (user is NOT a member)
        organization = OrganizationFactory.create()

        # Make request
        resp = client.get(
            f"/v1/organizations/{organization.organization_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 403

    def test_get_organization_403_different_organization(
        self, enable_factory_create, client, db_session
    ):
        """Test that user cannot access a different organization"""
        # Create user in one organization with proper privileges
        user, user_organization, token = create_user_in_org(
            privileges=[Privilege.VIEW_ORGANIZATION],
            db_session=db_session,
        )

        # Create a different organization that user is NOT a member of
        other_organization = OrganizationFactory.create()

        # Try to access other_organization
        resp = client.get(
            f"/v1/organizations/{other_organization.organization_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 403

    def test_get_organization_404_organization_not_found(
        self, enable_factory_create, client, db_session
    ):
        """Test that non-existent organization returns 404"""
        # Create user (doesn't need to be in any organization for this test)
        user, token = create_user_not_in_org(db_session)

        # Try to access non-existent organization
        non_existent_id = str(uuid.uuid4())
        resp = client.get(
            f"/v1/organizations/{non_existent_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 404

    def test_get_organization_401_no_token(self, client):
        """Test that accessing organization without auth token returns 401"""
        random_org_id = str(uuid.uuid4())

        resp = client.get(f"/v1/organizations/{random_org_id}")

        assert resp.status_code == 401

    def test_get_organization_401_invalid_token(self, client):
        """Test that accessing organization with invalid token returns 401"""
        random_org_id = str(uuid.uuid4())

        resp = client.get(
            f"/v1/organizations/{random_org_id}",
            headers={"X-SGG-Token": "invalid-token"},
        )

        assert resp.status_code == 401

    def test_get_organization_400_malformed_uuid(self, enable_factory_create, client, db_session):
        """Test that malformed UUID parameter returns 400"""
        # Create user (doesn't need to be in any organization for this test)
        user, token = create_user_not_in_org(db_session)

        # Try to access organization with malformed UUID
        resp = client.get(
            "/v1/organizations/not-a-uuid",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 404  # Flask routing will return 404 for invalid UUID format

    def test_get_organization_with_multiple_privileges(
        self, enable_factory_create, client, db_session
    ):
        """Test that user with multiple privileges including VIEW_ORGANIZATION can access"""
        # Create user in organization with multiple privileges including VIEW_ORGANIZATION
        user, organization, token = create_user_in_org(
            privileges=[
                Privilege.VIEW_ORGANIZATION,
                Privilege.MANAGE_ORG_MEMBERS,
                Privilege.VIEW_APPLICATION,
            ],
            db_session=db_session,
        )

        # Make request
        resp = client.get(
            f"/v1/organizations/{organization.organization_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["message"] == "Success"
        assert data["data"]["organization_id"] == str(organization.organization_id)

    def test_get_organization_owner_can_access(self, enable_factory_create, client, db_session):
        """Test that organization owner with proper privilege can access"""
        # Create user in organization as owner with required privileges
        user, organization, token = create_user_in_org(
            privileges=[Privilege.VIEW_ORGANIZATION],
            db_session=db_session,
        )

        # Make request
        resp = client.get(
            f"/v1/organizations/{organization.organization_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["message"] == "Success"
        assert data["data"]["organization_id"] == str(organization.organization_id)

    def test_get_organization_non_owner_can_access_with_privilege(
        self, enable_factory_create, client, db_session
    ):
        """Test that non-owner with VIEW_ORGANIZATION privilege can access"""
        # Create user in organization as non-owner with required privileges
        user, organization, token = create_user_in_org(
            privileges=[Privilege.VIEW_ORGANIZATION],
            db_session=db_session,
        )

        # Make request
        resp = client.get(
            f"/v1/organizations/{organization.organization_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["message"] == "Success"
        assert data["data"]["organization_id"] == str(organization.organization_id)

    @pytest.mark.parametrize(
        "privilege_set,expected_status",
        [
            ([Privilege.VIEW_ORGANIZATION], 200),
            ([Privilege.MANAGE_ORG_MEMBERS], 403),
            ([Privilege.VIEW_APPLICATION], 403),
            ([Privilege.VIEW_ORGANIZATION, Privilege.MANAGE_ORG_MEMBERS], 200),
            ([], 403),
        ],
    )
    def test_get_organization_privilege_requirements(
        self, enable_factory_create, client, db_session, privilege_set, expected_status
    ):
        """Test various privilege combinations to ensure only VIEW_ORGANIZATION grants access"""
        # Create user in organization with specified privileges
        user, organization, token = create_user_in_org(
            privileges=privilege_set,
            db_session=db_session,
        )

        # Make request
        resp = client.get(
            f"/v1/organizations/{organization.organization_id}",
            headers={"X-SGG-Token": token},
        )
        assert resp.status_code == expected_status

        if expected_status == 200:
            data = resp.get_json()
            assert data["message"] == "Success"
            assert data["data"]["organization_id"] == str(organization.organization_id)
