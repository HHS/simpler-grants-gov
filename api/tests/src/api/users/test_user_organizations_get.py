import uuid
from datetime import date

from src.auth.api_jwt_auth import create_jwt_for_user
from tests.src.db.models.factories import (
    LinkExternalUserFactory,
    OrganizationFactory,
    OrganizationUserFactory,
    SamGovEntityFactory,
    UserFactory,
)


class TestUserOrganizationsGet:
    def test_get_user_organizations_200_with_sam_gov_entities(
        self, enable_factory_create, client, db_session
    ):
        """Test getting user organizations with SAM.gov entity data"""
        # Create user
        user = UserFactory.create()
        LinkExternalUserFactory.create(user=user)

        # Create SAM.gov entities
        sam_gov_entity_1 = SamGovEntityFactory.create(
            legal_business_name="Test Organization LLC",
            expiration_date=date(2025, 12, 31),
            ebiz_poc_email="ebiz1@testorg.com",
            ebiz_poc_first_name="Jane",
            ebiz_poc_last_name="Doe",
        )
        sam_gov_entity_2 = SamGovEntityFactory.create(
            legal_business_name="Another Test Org Inc",
            expiration_date=date(2026, 6, 30),
            ebiz_poc_email="ebiz2@anothertestorg.com",
            ebiz_poc_first_name="John",
            ebiz_poc_last_name="Smith",
        )

        # Create organizations with SAM.gov entities
        org_1 = OrganizationFactory.create(sam_gov_entity=sam_gov_entity_1)
        org_2 = OrganizationFactory.create(sam_gov_entity=sam_gov_entity_2)

        # Create organization-user relationships
        OrganizationUserFactory.create(user=user, organization=org_1,)
        OrganizationUserFactory.create(user=user, organization=org_2,)

        # Create JWT token
        token, _ = create_jwt_for_user(user, db_session)
        db_session.commit()

        # Make request
        resp = client.get(f"/v1/users/{user.user_id}/organizations", headers={"X-SGG-Token": token})

        assert resp.status_code == 200
        data = resp.get_json()

        assert data["message"] == "Success"
        assert len(data["data"]) == 2

        # Sort by UEI for consistent testing
        organizations = sorted(data["data"], key=lambda x: x["sam_gov_entity"]["uei"])

        # Check first organization (org_1 - user is owner: True)
        org_data_1 = organizations[0]
        assert org_data_1["organization_id"] == str(org_1.organization_id)
        assert org_data_1["sam_gov_entity"]["uei"] == sam_gov_entity_1.uei
        assert org_data_1["sam_gov_entity"]["legal_business_name"] == "Test Organization LLC"
        assert org_data_1["sam_gov_entity"]["expiration_date"] == "2025-12-31"
        assert org_data_1["sam_gov_entity"]["ebiz_poc_email"] == "ebiz1@testorg.com"
        assert org_data_1["sam_gov_entity"]["ebiz_poc_first_name"] == "Jane"
        assert org_data_1["sam_gov_entity"]["ebiz_poc_last_name"] == "Doe"

        # Check second organization (org_2 - user is owner: False)
        org_data_2 = organizations[1]
        assert org_data_2["organization_id"] == str(org_2.organization_id)
        assert org_data_2["sam_gov_entity"]["uei"] == sam_gov_entity_2.uei
        assert org_data_2["sam_gov_entity"]["legal_business_name"] == "Another Test Org Inc"
        assert org_data_2["sam_gov_entity"]["expiration_date"] == "2026-06-30"
        assert org_data_2["sam_gov_entity"]["ebiz_poc_email"] == "ebiz2@anothertestorg.com"
        assert org_data_2["sam_gov_entity"]["ebiz_poc_first_name"] == "John"
        assert org_data_2["sam_gov_entity"]["ebiz_poc_last_name"] == "Smith"

    def test_get_user_organizations_200_without_sam_gov_entities(
        self, enable_factory_create, client, db_session
    ):
        """Test getting user organizations without SAM.gov entity data"""
        # Create user
        user = UserFactory.create()
        LinkExternalUserFactory.create(user=user)

        # Create organization without SAM.gov entity
        org = OrganizationFactory.create(sam_gov_entity=None)

        # Create organization-user relationship
        OrganizationUserFactory.create(user=user, organization=org, )

        # Create JWT token
        token, _ = create_jwt_for_user(user, db_session)
        db_session.commit()

        # Make request
        resp = client.get(f"/v1/users/{user.user_id}/organizations", headers={"X-SGG-Token": token})

        assert resp.status_code == 200
        data = resp.get_json()

        assert data["message"] == "Success"
        assert len(data["data"]) == 1

        org_data = data["data"][0]
        assert org_data["organization_id"] == str(org.organization_id)
        assert org_data["sam_gov_entity"] is None

    def test_get_user_organizations_200_empty_list(self, enable_factory_create, client, db_session):
        """Test getting user organizations when user has no organizations"""
        # Create user with no organizations
        user = UserFactory.create()
        LinkExternalUserFactory.create(user=user)

        # Create JWT token
        token, _ = create_jwt_for_user(user, db_session)
        db_session.commit()

        # Make request
        resp = client.get(f"/v1/users/{user.user_id}/organizations", headers={"X-SGG-Token": token})

        assert resp.status_code == 200
        data = resp.get_json()

        assert data["message"] == "Success"
        assert data["data"] == []

    def test_get_user_organizations_403_different_user(
        self, enable_factory_create, client, db_session
    ):
        """Test that a user cannot access another user's organizations"""
        # Create two users
        user_1 = UserFactory.create()
        user_2 = UserFactory.create()
        LinkExternalUserFactory.create(user=user_1)
        LinkExternalUserFactory.create(user=user_2)

        # Create organization for user_2
        org = OrganizationFactory.create()
        OrganizationUserFactory.create(user=user_2, organization=org)

        # Create JWT token for user_1
        token, _ = create_jwt_for_user(user_1, db_session)
        db_session.commit()

        # Try to access user_2's organizations with user_1's token
        resp = client.get(
            f"/v1/users/{user_2.user_id}/organizations", headers={"X-SGG-Token": token}
        )

        assert resp.status_code == 403

    def test_get_user_organizations_401_no_token(self, client):
        """Test that accessing organizations without auth token returns 401"""
        random_user_id = str(uuid.uuid4())

        resp = client.get(f"/v1/users/{random_user_id}/organizations")

        assert resp.status_code == 401

    def test_get_user_organizations_401_invalid_token(self, client):
        """Test that accessing organizations with invalid token returns 401"""
        random_user_id = str(uuid.uuid4())

        resp = client.get(
            f"/v1/users/{random_user_id}/organizations", headers={"X-SGG-Token": "invalid-token"}
        )

        assert resp.status_code == 401

    def test_get_user_organizations_mixed_sam_gov_entities(
        self, enable_factory_create, client, db_session
    ):
        """Test getting user organizations with mixed SAM.gov entity data"""
        # Create user
        user = UserFactory.create()
        LinkExternalUserFactory.create(user=user)

        # Create one organization with SAM.gov entity
        sam_gov_entity = SamGovEntityFactory.create(
            uei="MIXED123456789",
            legal_business_name="Mixed Test Org",
            expiration_date=date(2025, 3, 15),
            ebiz_poc_email="ebiz@mixedorg.com",
            ebiz_poc_first_name="Alice",
            ebiz_poc_last_name="Johnson",
        )
        org_with_sam = OrganizationFactory.create(sam_gov_entity=sam_gov_entity)

        # Create one organization without SAM.gov entity
        org_without_sam = OrganizationFactory.create(sam_gov_entity=None)

        # Create organization-user relationships
        OrganizationUserFactory.create(
            user=user, organization=org_with_sam,
        )
        OrganizationUserFactory.create(
            user=user, organization=org_without_sam,
        )

        # Create JWT token
        token, _ = create_jwt_for_user(user, db_session)
        db_session.commit()

        # Make request
        resp = client.get(f"/v1/users/{user.user_id}/organizations", headers={"X-SGG-Token": token})

        assert resp.status_code == 200
        data = resp.get_json()

        assert data["message"] == "Success"
        assert len(data["data"]) == 2

        # Find organizations by checking for SAM.gov entity presence
        org_with_sam_data = None
        org_without_sam_data = None

        for org_data in data["data"]:
            if org_data["sam_gov_entity"] is not None:
                org_with_sam_data = org_data
            else:
                org_without_sam_data = org_data

        # Check organization with SAM.gov entity
        assert org_with_sam_data is not None
        assert org_with_sam_data["organization_id"] == str(org_with_sam.organization_id)
        assert org_with_sam_data["sam_gov_entity"]["uei"] == "MIXED123456789"
        assert org_with_sam_data["sam_gov_entity"]["legal_business_name"] == "Mixed Test Org"
        assert org_with_sam_data["sam_gov_entity"]["expiration_date"] == "2025-03-15"
        assert org_with_sam_data["sam_gov_entity"]["ebiz_poc_email"] == "ebiz@mixedorg.com"
        assert org_with_sam_data["sam_gov_entity"]["ebiz_poc_first_name"] == "Alice"
        assert org_with_sam_data["sam_gov_entity"]["ebiz_poc_last_name"] == "Johnson"

        # Check organization without SAM.gov entity
        assert org_without_sam_data is not None
        assert org_without_sam_data["organization_id"] == str(org_without_sam.organization_id)
        assert org_without_sam_data["sam_gov_entity"] is None
