import logging
from uuid import UUID

from src.adapters import db
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import UserSavedOpportunity

logger = logging.getLogger(__name__)


def get_saved_opportunities(db_session: db.Session, user_id: UUID) -> list[UserSavedOpportunity]:
    logger.info(f"Getting saved opportunities for user {user_id}")

    return (
        db_session.query(UserSavedOpportunity)
        .join(Opportunity)
        .filter(UserSavedOpportunity.user_id == user_id)
        .all()
    )
