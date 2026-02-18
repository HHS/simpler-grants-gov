import uuid

from src.auth.api_jwt_auth import create_jwt_for_user
from tests.lib.opportunity_test_utils import (
    create_user_in_agency_with_jwt,
    create_user_in_agency_with_jwt_and_api_key,
)
from tests.src.db.models.factories import (
    AgencyFactory,
    AgencyUserFactory,
    LinkExternalUserFactory,
    UserFactory,
)


class TestUserAgenciesGet:
    def test_get_user_agencies_200_with_agencies(self, enable_factory_create, client, db_session):
        """Test getting user agencies returns list of agencies"""
        user, agency_1, token = create_user_in_agency_with_jwt(db_session)

        # Add a second agency
        agency_2 = AgencyFactory.create()
        AgencyUserFactory.create(user=user, agency=agency_2)

        resp = client.post(f"/v1/users/{user.user_id}/agencies", headers={"X-SGG-Token": token})

        assert resp.status_code == 200
        data = resp.get_json()

        assert data["message"] == "Success"
        assert len(data["data"]) == 2

        # Sort by agency_id for consistent testing
        agencies = sorted(data["data"], key=lambda x: x["agency_id"])
        expected_agencies = sorted([agency_1, agency_2], key=lambda x: str(x.agency_id))

        assert agencies[0]["agency_id"] == str(expected_agencies[0].agency_id)
        assert agencies[0]["agency_name"] == expected_agencies[0].agency_name
        assert agencies[0]["agency_code"] == expected_agencies[0].agency_code

        assert agencies[1]["agency_id"] == str(expected_agencies[1].agency_id)
        assert agencies[1]["agency_name"] == expected_agencies[1].agency_name
        assert agencies[1]["agency_code"] == expected_agencies[1].agency_code

    def test_get_user_agencies_200_empty_list(self, enable_factory_create, client, db_session):
        """Test getting user agencies when user has no agencies"""
        user = UserFactory.create()
        LinkExternalUserFactory.create(user=user)

        token, _ = create_jwt_for_user(user, db_session)
        db_session.commit()

        resp = client.post(f"/v1/users/{user.user_id}/agencies", headers={"X-SGG-Token": token})

        assert resp.status_code == 200
        data = resp.get_json()

        assert data["message"] == "Success"
        assert data["data"] == []

    def test_get_user_agencies_403_different_user(self, enable_factory_create, client, db_session):
        """Test that a user cannot access another user's agencies"""
        user_1, _, token = create_user_in_agency_with_jwt(db_session)
        user_2, _, _ = create_user_in_agency_with_jwt(db_session)

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

    def test_get_user_agencies_200_api_key_happy_path(
        self, enable_factory_create, client, db_session
    ):
        """Test getting user agencies works with API key auth"""
        user, agency, _, api_key_id = create_user_in_agency_with_jwt_and_api_key(db_session)

        resp = client.post(f"/v1/users/{user.user_id}/agencies", headers={"X-API-Key": api_key_id})

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["message"] == "Success"
        assert len(data["data"]) == 1
        assert data["data"][0]["agency_id"] == str(agency.agency_id)

    def test_get_user_agencies_403_api_key_wrong_user(
        self, enable_factory_create, client, db_session
    ):
        """Test that API key auth returns 403 when user_id doesn't match authenticated user"""
        _, _, _, api_key_id = create_user_in_agency_with_jwt_and_api_key(db_session)
        other_user, _, _ = create_user_in_agency_with_jwt(db_session)

        resp = client.post(
            f"/v1/users/{other_user.user_id}/agencies", headers={"X-API-Key": api_key_id}
        )

        assert resp.status_code == 403
