import logging
import uuid

from sqlalchemy import select

from src.adapters import db
from src.auth.endpoint_access_util import can_access
from src.constants.lookup_constants import Privilege
from src.db.models.user_models import User, UserSavedOpportunityNotification

logger = logging.getLogger(__name__)


def get_saved_opportunity_notification_preferences(db_session: db.Session, user: User) -> dict:
    """Returns notification preferences for the user's saved opportunities."""
    notification_rows = (
        db_session.execute(
            select(UserSavedOpportunityNotification).where(
                UserSavedOpportunityNotification.user_id == user.user_id
            )
        )
        .scalars()
        .all()
    )

    # Build lookup: organization_id (or None) -> email_enabled
    notification_lookup: dict[uuid.UUID | None, bool] = {
        row.organization_id: row.email_enabled for row in notification_rows
    }

    # Self settings — default True if no row exists
    self_email_enabled = notification_lookup.get(None, True)

    # Organization settings — only for orgs where user has VIEW_ORG_SAVED_OPPORTUNITIES
    organizations = []
    for org_user in user.organization_users:
        if can_access(user, {Privilege.VIEW_ORG_SAVED_OPPORTUNITIES}, org_user.organization):
            org_id = org_user.organization_id
            email_enabled = notification_lookup.get(org_id, False)
            organizations.append(
                {
                    "organization_id": org_id,
                    "email_enabled": email_enabled,
                }
            )

    logger.info(
        "Fetched saved opportunity notification preferences",
        extra={"user_id": user.user_id, "organization_count": len(organizations)},
    )

    return {
        "self": {"email_enabled": self_email_enabled},
        "organizations": organizations,
    }
