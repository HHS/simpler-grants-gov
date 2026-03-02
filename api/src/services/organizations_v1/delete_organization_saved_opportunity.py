import logging
from uuid import UUID

from sqlalchemy import select

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import check_user_access
from src.constants.lookup_constants import Privilege
from src.db.models.entity_models import OrganizationSavedOpportunity
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import User
from src.services.organizations_v1.get_organization import get_organization

logger = logging.getLogger(__name__)


def delete_organization_saved_opportunity(
    db_session: db.Session,
    user: User,
    organization_id: UUID,
    opportunity_id: UUID,
) -> None:
    """
    Delete a saved opportunity for an organization.

    Validates the organization and opportunity exist, checks user access,
    then removes the saved opportunity if present (graceful if not found).
    """
    organization = get_organization(db_session, organization_id)
    check_user_access(db_session, user, {Privilege.MODIFY_ORG_SAVED_OPPORTUNITIES}, organization)

    opportunity = db_session.execute(
        select(Opportunity).where(Opportunity.opportunity_id == opportunity_id)
    ).scalar_one_or_none()

    if opportunity is None:
        raise_flask_error(404, message=f"Could not find Opportunity with ID {opportunity_id}")

    saved_opportunity = db_session.execute(
        select(OrganizationSavedOpportunity).where(
            OrganizationSavedOpportunity.organization_id == organization_id,
            OrganizationSavedOpportunity.opportunity_id == opportunity_id,
        )
    ).scalar_one_or_none()

    if saved_opportunity is not None:
        db_session.delete(saved_opportunity)

    logger.info(
        "deleted organization saved opportunity",
        extra={"organization_id": organization_id, "opportunity_id": opportunity_id},
    )
