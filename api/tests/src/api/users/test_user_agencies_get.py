import uuid

from src.auth.api_jwt_auth import create_jwt_for_user
from tests.src.db.models.factories import (
    AgencyFactory,
    AgencyUserFactory,
    LinkExternalUserFactory,
    UserFactory,
)


class TestUserAgenciesGet:
    def test_get_user_agencies_200_with_agencies(self, enable_factory_create, client, db_session):
        """Test getting user agencies returns list of agencies"""
        # Create user
        user = UserFactory.create()
        LinkExternalUserFactory.create(user=user)

        # Create agencies (let factory generate unique codes to avoid conflicts)
        agency_1 = AgencyFactory.create()
        agency_2 = AgencyFactory.create()

        # Create agency-user relationships
        AgencyUserFactory.create(user=user, agency=agency_1)
        AgencyUserFactory.create(user=user, agency=agency_2)

        # Create JWT token
        token, _ = create_jwt_for_user(user, db_session)
        db_session.commit()

        # Make request
        resp = client.post(f"/v1/users/{user.user_id}/agencies", headers={"X-SGG-Token": token})

        assert resp.status_code == 200
        data = resp.get_json()

        assert data["message"] == "Success"
        assert len(data["data"]) == 2

        # Sort by agency_id for consistent testing
        agencies = sorted(data["data"], key=lambda x: x["agency_id"])
        expected_agencies = sorted([agency_1, agency_2], key=lambda x: str(x.agency_id))

        # Check first agency
        assert agencies[0]["agency_id"] == str(expected_agencies[0].agency_id)
        assert agencies[0]["agency_name"] == expected_agencies[0].agency_name
        assert agencies[0]["agency_code"] == expected_agencies[0].agency_code

        # Check second agency
        assert agencies[1]["agency_id"] == str(expected_agencies[1].agency_id)
        assert agencies[1]["agency_name"] == expected_agencies[1].agency_name
        assert agencies[1]["agency_code"] == expected_agencies[1].agency_code

    def test_get_user_agencies_200_empty_list(self, enable_factory_create, client, db_session):
        """Test getting user agencies when user has no agencies"""
        # Create user with no agencies
        user = UserFactory.create()
        LinkExternalUserFactory.create(user=user)

        # Create JWT token
        token, _ = create_jwt_for_user(user, db_session)
        db_session.commit()

        # Make request
        resp = client.post(f"/v1/users/{user.user_id}/agencies", headers={"X-SGG-Token": token})

        assert resp.status_code == 200
        data = resp.get_json()

        assert data["message"] == "Success"
        assert data["data"] == []

    def test_get_user_agencies_403_different_user(self, enable_factory_create, client, db_session):
        """Test that a user cannot access another user's agencies"""
        # Create two users
        user_1 = UserFactory.create()
        user_2 = UserFactory.create()
        LinkExternalUserFactory.create(user=user_1)
        LinkExternalUserFactory.create(user=user_2)

        # Create agency for user_2
        agency = AgencyFactory.create()
        AgencyUserFactory.create(user=user_2, agency=agency)

        # Create JWT token for user_1
        token, _ = create_jwt_for_user(user_1, db_session)
        db_session.commit()

        # Try to access user_2's agencies with user_1's token
        resp = client.post(f"/v1/users/{user_2.user_id}/agencies", headers={"X-SGG-Token": token})

        assert resp.status_code == 403

    def test_get_user_agencies_401_no_token(self, client):
        """Test that accessing agencies without auth token returns 401"""
        random_user_id = str(uuid.uuid4())

        resp = client.post(f"/v1/users/{random_user_id}/agencies")

        assert resp.status_code == 401

    def test_get_user_agencies_401_invalid_token(self, client):
        """Test that accessing agencies with invalid token returns 401"""
        random_user_id = str(uuid.uuid4())

        resp = client.post(
            f"/v1/users/{random_user_id}/agencies", headers={"X-SGG-Token": "invalid-token"}
        )

        assert resp.status_code == 401
