import uuid

from src.constants.lookup_constants import Privilege
from src.db.models.entity_models import OrganizationSavedOpportunity
from tests.lib.organization_test_utils import create_user_in_org, create_user_not_in_org
from tests.src.db.models.factories import (
    OpportunityFactory,
    OrganizationFactory,
    OrganizationSavedOpportunityFactory,
)


class TestOrganizationDeleteSavedOpportunity:
    """Test DELETE /v1/organizations/:organization_id/saved-opportunities/:opportunity_id"""

    def test_delete_saved_opportunity_200(self, enable_factory_create, client, db_session):
        """Deleting an existing saved opportunity returns 200"""
        opportunity = OpportunityFactory.create(is_draft=False)
        user, organization, token = create_user_in_org(
            privileges=[Privilege.VIEW_ORG_MEMBERSHIP],
            db_session=db_session,
        )
        OrganizationSavedOpportunityFactory.create(
            organization=organization, opportunity=opportunity
        )

        resp = client.delete(
            f"/v1/organizations/{organization.organization_id}/saved-opportunities/{opportunity.opportunity_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 200
        assert resp.get_json()["message"] == "Success"

        count = (
            db_session.query(OrganizationSavedOpportunity)
            .filter_by(
                organization_id=organization.organization_id,
                opportunity_id=opportunity.opportunity_id,
            )
            .count()
        )
        assert count == 0

    def test_delete_saved_opportunity_200_graceful(self, enable_factory_create, client, db_session):
        """Deleting a non-existent saved opportunity (valid IDs) returns 200 gracefully"""
        opportunity = OpportunityFactory.create(is_draft=False)
        user, organization, token = create_user_in_org(
            privileges=[Privilege.VIEW_ORG_MEMBERSHIP],
            db_session=db_session,
        )

        resp = client.delete(
            f"/v1/organizations/{organization.organization_id}/saved-opportunities/{opportunity.opportunity_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 200
        assert resp.get_json()["message"] == "Success"

    def test_delete_saved_opportunity_401_no_auth(self, enable_factory_create, client, db_session):
        """Request without authentication token returns 401"""
        organization = OrganizationFactory.create()
        opportunity = OpportunityFactory.create(is_draft=False)

        resp = client.delete(
            f"/v1/organizations/{organization.organization_id}/saved-opportunities/{opportunity.opportunity_id}",
        )

        assert resp.status_code == 401

    def test_delete_saved_opportunity_403_not_org_member(
        self, enable_factory_create, client, db_session
    ):
        """User who is not a member of the organization gets 403"""
        opportunity = OpportunityFactory.create(is_draft=False)
        organization = OrganizationFactory.create()
        user, token = create_user_not_in_org(db_session)

        resp = client.delete(
            f"/v1/organizations/{organization.organization_id}/saved-opportunities/{opportunity.opportunity_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 403

    def test_delete_saved_opportunity_403_wrong_privilege(
        self, enable_factory_create, client, db_session
    ):
        """User with insufficient privileges gets 403"""
        opportunity = OpportunityFactory.create(is_draft=False)
        user, organization, token = create_user_in_org(
            privileges=[Privilege.MANAGE_ORG_MEMBERS],
            db_session=db_session,
        )

        resp = client.delete(
            f"/v1/organizations/{organization.organization_id}/saved-opportunities/{opportunity.opportunity_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 403

    def test_delete_saved_opportunity_404_organization_not_found(
        self, enable_factory_create, client, db_session
    ):
        """Non-existent organization returns 404"""
        opportunity = OpportunityFactory.create(is_draft=False)
        user, token = create_user_not_in_org(db_session)

        resp = client.delete(
            f"/v1/organizations/{uuid.uuid4()}/saved-opportunities/{opportunity.opportunity_id}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 404

    def test_delete_saved_opportunity_404_opportunity_not_found(
        self, enable_factory_create, client, db_session
    ):
        """Non-existent opportunity returns 404"""
        user, organization, token = create_user_in_org(
            privileges=[Privilege.VIEW_ORG_MEMBERSHIP],
            db_session=db_session,
        )

        resp = client.delete(
            f"/v1/organizations/{organization.organization_id}/saved-opportunities/{uuid.uuid4()}",
            headers={"X-SGG-Token": token},
        )

        assert resp.status_code == 404
