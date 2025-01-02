import logging
from uuid import UUID

from sqlalchemy import select

from src.adapters import db
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import UserSavedOpportunity

logger = logging.getLogger(__name__)


def get_saved_opportunities(db_session: db.Session, user_id: UUID) -> list[UserSavedOpportunity]:
    logger.info(f"Getting saved opportunities for user {user_id}")

    stmt = (
        select(UserSavedOpportunity)
        .join(Opportunity)
        .where(UserSavedOpportunity.user_id == user_id)
    )

    result = db_session.execute(stmt)
    return list(result.scalars().all())
