import logging
from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from sqlalchemy import select

import src.adapters.db as db
from src.adapters.search import SearchClient
from src.db.models.user_models import User, UserSavedOpportunity, UserSavedSearch
from src.task.notifications.constants import EmailData

logger = logging.getLogger(__name__)


class BaseNotification(ABC):
    def __init__(self, db_session: db.Session, search_client: Optional[SearchClient] = None):
        self.db_session = db_session
        self.search_client = search_client

    @abstractmethod
    def collect_notifications(
        self,
    ) -> dict[UUID, list[UserSavedOpportunity]] | dict[UUID, list[UserSavedSearch]] | None:
        """Collect notifications for users (either saved opportunities or searches)."""
        pass

    @abstractmethod
    def prepare_notification(
        self, saved_data: dict[UUID, list[UserSavedOpportunity]] | dict[UUID, list[UserSavedSearch]]
    ) -> EmailData:
        """Prepare notification content (email data)"""
        pass

    def notification_data(self) -> EmailData | None:
        """Fetch collected notifications and prepare email data."""
        collected_data = self.collect_notifications()
        if collected_data:
            return self.prepare_notification(collected_data)
        return

    def _get_user_email(self, user_id: UUID) -> str | None:

        # Fetch user details
        user = self.db_session.execute(
            select(User).where(User.user_id == user_id)
        ).scalar_one_or_none()

        if not user or not user.email:
            logger.warning("No email found for user", extra={"user_id": user.user_id})
        return user.email
