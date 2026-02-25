import uuid

from src.constants.lookup_constants import Privilege
from src.db.models.entity_models import OrganizationSavedOpportunity
from tests.lib.organization_test_utils import create_user_in_org, create_user_not_in_org
from tests.src.db.models.factories import (
    OpportunityFactory,
    OrganizationFactory,
    OrganizationSavedOpportunityFactory,
)


class TestOrganizationSaveOpportunityPost:
    """Test POST /v1/organizations/:organization_id/saved-opportunities endpoint"""

    def test_save_opportunity_201_new(self, enable_factory_create, client, db_session):
        """New save returns 201 with Success message"""
        opportunity = OpportunityFactory.create(is_draft=False)
        user, organization, token = create_user_in_org(
            privileges=[Privilege.VIEW_ORG_MEMBERSHIP],
            db_session=db_session,
        )

        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/saved-opportunities",
            headers={"X-SGG-Token": token},
            json={"opportunity_id": str(opportunity.opportunity_id)},
        )

        assert resp.status_code == 201
        assert resp.get_json()["message"] == "Success"

        saved = (
            db_session.query(OrganizationSavedOpportunity)
            .filter_by(
                organization_id=organization.organization_id,
                opportunity_id=opportunity.opportunity_id,
            )
            .one_or_none()
        )
        assert saved is not None

    def test_save_opportunity_200_already_saved(self, enable_factory_create, client, db_session):
        """Saving an already-saved opportunity returns 200 without creating a duplicate"""
        opportunity = OpportunityFactory.create(is_draft=False)
        user, organization, token = create_user_in_org(
            privileges=[Privilege.VIEW_ORG_MEMBERSHIP],
            db_session=db_session,
        )
        OrganizationSavedOpportunityFactory.create(
            organization=organization, opportunity=opportunity
        )

        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/saved-opportunities",
            headers={"X-SGG-Token": token},
            json={"opportunity_id": str(opportunity.opportunity_id)},
        )

        assert resp.status_code == 200
        assert resp.get_json()["message"] == "Opportunity already saved to organization"

        # Verify no duplicate record was created
        count = (
            db_session.query(OrganizationSavedOpportunity)
            .filter_by(
                organization_id=organization.organization_id,
                opportunity_id=opportunity.opportunity_id,
            )
            .count()
        )
        assert count == 1

    def test_save_opportunity_401_no_auth(self, enable_factory_create, client, db_session):
        """Request without authentication token returns 401"""
        opportunity = OpportunityFactory.create(is_draft=False)
        organization = OrganizationFactory.create()

        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/saved-opportunities",
            json={"opportunity_id": str(opportunity.opportunity_id)},
        )

        assert resp.status_code == 401
        assert resp.get_json()["message"] == "Unable to process token"

    def test_save_opportunity_403_not_org_member(self, enable_factory_create, client, db_session):
        """User who is not a member of the organization gets 403"""
        opportunity = OpportunityFactory.create(is_draft=False)
        organization = OrganizationFactory.create()
        user, token = create_user_not_in_org(db_session)

        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/saved-opportunities",
            headers={"X-SGG-Token": token},
            json={"opportunity_id": str(opportunity.opportunity_id)},
        )

        assert resp.status_code == 403
        assert resp.get_json()["message"] == "Forbidden"

    def test_save_opportunity_403_wrong_privilege(self, enable_factory_create, client, db_session):
        """User with insufficient privileges gets 403"""
        opportunity = OpportunityFactory.create(is_draft=False)
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
        )

        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/saved-opportunities",
            headers={"X-SGG-Token": token},
            json={"opportunity_id": str(opportunity.opportunity_id)},
        )

        assert resp.status_code == 403

    def test_save_opportunity_404_organization_not_found(
        self, enable_factory_create, client, db_session
    ):
        """Non-existent organization returns 404"""
        opportunity = OpportunityFactory.create(is_draft=False)
        user, token = create_user_not_in_org(db_session)

        resp = client.post(
            f"/v1/organizations/{uuid.uuid4()}/saved-opportunities",
            headers={"X-SGG-Token": token},
            json={"opportunity_id": str(opportunity.opportunity_id)},
        )

        assert resp.status_code == 404

    def test_save_opportunity_404_opportunity_not_found(
        self, enable_factory_create, client, db_session
    ):
        """Non-existent opportunity returns 404"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.VIEW_ORG_MEMBERSHIP],
            db_session=db_session,
        )

        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/saved-opportunities",
            headers={"X-SGG-Token": token},
            json={"opportunity_id": str(uuid.uuid4())},
        )

        assert resp.status_code == 404

    def test_save_opportunity_404_draft_opportunity(
        self, enable_factory_create, client, db_session
    ):
        """Draft opportunity returns 404"""
        opportunity = OpportunityFactory.create(is_draft=True)
        user, organization, token = create_user_in_org(
            privileges=[Privilege.VIEW_ORG_MEMBERSHIP],
            db_session=db_session,
        )

        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/saved-opportunities",
            headers={"X-SGG-Token": token},
            json={"opportunity_id": str(opportunity.opportunity_id)},
        )

        assert resp.status_code == 404

    def test_save_opportunity_422_missing_opportunity_id(
        self, enable_factory_create, client, db_session
    ):
        """Missing opportunity_id in request body returns 422"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.VIEW_ORG_MEMBERSHIP],
            db_session=db_session,
        )

        resp = client.post(
            f"/v1/organizations/{organization.organization_id}/saved-opportunities",
            headers={"X-SGG-Token": token},
            json={},
        )

        assert resp.status_code == 422
