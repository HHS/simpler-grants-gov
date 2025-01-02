import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.adapters import db
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import UserSavedOpportunity

logger = logging.getLogger(__name__)


def get_saved_opportunities(db_session: db.Session, user_id: UUID) -> list[Opportunity]:
    logger.info(f"Getting saved opportunities for user {user_id}")

    saved_opportunities = (
        db_session.execute(
            select(Opportunity)
            .join(UserSavedOpportunity)
            .where(UserSavedOpportunity.user_id == user_id)
            .options(selectinload("*"))
        )
        .scalars()
        .all()
    )
    return list(saved_opportunities)
