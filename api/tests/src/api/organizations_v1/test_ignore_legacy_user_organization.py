from uuid import uuid4

import pytest

from src.auth.api_jwt_auth import create_jwt_for_user
from src.constants.lookup_constants import Privilege
from src.db.models.entity_models import IgnoredLegacyOrganizationUser
from tests.lib.organization_test_utils import create_user_in_org
from tests.src.db.models.factories import IgnoredLegacyOrganizationUserFactory


class TestIgnoreLegacyUserOrganization:
    """Test POST  /v1/organizations/:organization_id/legacy-users/ignore endpoint"""

    @pytest.fixture
    def user_org_a(self, db_session):
        user, org, token = create_user_in_org(db_session, privileges=[Privilege.MANAGE_ORG_MEMBERS])
        return user, org, token

    def test_ignore_legacy_user_organization_200(
        self, db_session, enable_factory_create, client, user_org_a
    ):
        """Verify that a legacy user can be successfully added to the organization’s ignore list."""
        user, org, token = user_org_a
        resp = client.post(
            f"/v1/organizations/{org.organization_id}/legacy-users/ignore",
            headers={"X-SGG-Token": token},
            json={"email": "test@gmail.com"},
        )
        assert resp.status_code == 200

        ignored_users = (
            db_session.query(IgnoredLegacyOrganizationUser)
            .filter_by(organization_id=org.organization_id, email="test@gmail.com")
            .one_or_none()
        )
        assert ignored_users
        assert ignored_users.email == "test@gmail.com"
        assert ignored_users.ignored_by_user_id == user.user_id
        assert ignored_users.organization_id == org.organization_id

    def test_ignore_legacy_user_organization_previously_ignored_400(
        self, enable_factory_create, client, db_session, user_org_a
    ):
        """Test ignoring previously ignored user throws error"""
        # Create an ignored user record for an org
        user, org, token = user_org_a
        IgnoredLegacyOrganizationUserFactory.create(
            organization=org, user=user, email="test@gmail.com"
        )

        resp = client.post(
            f"/v1/organizations/{org.organization_id}/legacy-users/ignore",
            headers={"X-SGG-Token": token},
            json={"email": "test@gmail.com"},
        )
        assert resp.status_code == 400

    def test_ignore_legacy_user_organization_no_token(self, client):
        """Test hitting endpoint without auth returns 401"""
        resp = client.post(
            f"/v1/organizations/{uuid4()}/legacy-users/ignore", json={"email": "test@gmail.com"}
        )
        assert resp.status_code == 401

    def test_ignore_legacy_user_organization_invalid_token(self, client):
        """Test hitting endpoint with an invalid token returns 401"""
        resp = client.post(
            f"/v1/organizations/{uuid4()}/legacy-users/ignore", json={"email": "test@gmail.com"}
        )
        assert resp.status_code == 401

    def test_ignore_legacy_user_organization_404_org_not_found(
        self, client, enable_factory_create, db_session, user
    ):
        """Test error when organization does not exist"""
        token, _ = create_jwt_for_user(user, db_session)
        db_session.commit()

        resp = client.post(
            f"/v1/organizations/{uuid4()}/legacy-users/ignore",
            headers={"X-SGG-Token": token},
            json={"email": "test@gmail.com"},
        )
        assert resp.status_code == 404

    def test_ignore_legacy_user_organization_403_privilege(
        self, db_session, enable_factory_create, client
    ):
        """Test error when user does not have required privilege"""
        user, org, token = create_user_in_org(db_session, privileges=[Privilege.SUBMIT_APPLICATION])
        resp = client.post(
            f"/v1/organizations/{org.organization_id}/legacy-users/ignore",
            headers={"X-SGG-Token": token},
            json={"email": "test@gmail.com"},
        )
        assert resp.status_code == 403

    def test_ignore_legacy_user_organization_422_missing_email(
        self, client, db_session, enable_factory_create, user_org_a
    ):
        """Test error when request does not include the email"""
        user, org, token = user_org_a
        resp = client.post(
            f"/v1/organizations/{org.organization_id}/legacy-users/ignore",
            headers={"X-SGG-Token": token},
            json={},
        )
        assert resp.status_code == 422

    def test_ignore_legacy_user_organization_422_invalid_email(
        self, client, db_session, enable_factory_create, user_org_a
    ):
        """Test error when request does not include an invalid email"""
        user, org, token = user_org_a
        resp = client.post(
            f"/v1/organizations/{org.organization_id}/legacy-users/ignore",
            headers={"X-SGG-Token": token},
            json={"email": "test@.com"},
        )
        assert resp.status_code == 500
