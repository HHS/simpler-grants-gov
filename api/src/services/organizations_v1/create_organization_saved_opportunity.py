import logging
from uuid import UUID

from sqlalchemy import select

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.db.models.entity_models import OrganizationSavedOpportunity
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import User
from src.services.organizations_v1.get_organization import get_organization_and_verify_access

logger = logging.getLogger(__name__)


def create_organization_saved_opportunity(
    db_session: db.Session,
    user: User,
    organization_id: UUID,
    json_data: dict,
) -> bool:
    """
    Save an opportunity for an organization.

    Returns True if a new record was created, False if already saved.
    """
    # Validate organization exists and fetch it
    get_organization_and_verify_access(db_session, user, organization_id)

    # Validate opportunity exists and is not in draft status
    opportunity_id = json_data["opportunity_id"]
    opportunity = db_session.execute(
        select(Opportunity).where(
            Opportunity.opportunity_id == opportunity_id,
            Opportunity.is_draft.is_(False),
        )
    ).scalar_one_or_none()

    if opportunity is None:
        raise_flask_error(404, message=f"Could not find Opportunity with ID {opportunity_id}")

    # Check if already saved
    existing = db_session.execute(
        select(OrganizationSavedOpportunity).where(
            OrganizationSavedOpportunity.organization_id == organization_id,
            OrganizationSavedOpportunity.opportunity_id == opportunity_id,
        )
    ).scalar_one_or_none()

    if existing:
        logger.info(
            "Opportunity already saved to organization",
            extra={"organization_id": organization_id, "opportunity_id": opportunity_id},
        )
        return False

    # Create new saved opportunity
    saved_opportunity = OrganizationSavedOpportunity(
        organization_id=organization_id,
        opportunity_id=opportunity_id,
    )
    db_session.add(saved_opportunity)

    logger.info(
        "added organization saved opportunity",
        extra={"organization_id": organization_id, "opportunity_id": opportunity_id},
    )

    return True
