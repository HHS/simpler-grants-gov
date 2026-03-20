import logging
from uuid import UUID, uuid4

from pydantic import BaseModel
from sqlalchemy import select

from src.adapters import db
from src.db.models.user_models import User, UserSavedOpportunityNotification
from src.services.users.get_saved_opportunities import _check_access

logger = logging.getLogger(__name__)


class UpdateOpportunityNotificationSettingInput(BaseModel):
    organization_id: UUID | None = None
    email_enabled: bool


def set_saved_opportunity_notification_settings(
    db_session: db.Session, user: User, json_data: dict
) -> None:
    """
    Create or update a user's saved opportunity notification setting.
    """
    requested_setting = UpdateOpportunityNotificationSettingInput.model_validate(json_data)
    org_id = requested_setting.organization_id

    # Check org access if organization_id is specified
    if org_id:
        _check_access(db_session, user, [org_id])

    # Fetch existing row (self or org)
    setting = db_session.execute(
        select(UserSavedOpportunityNotification)
        .where(UserSavedOpportunityNotification.user_id == user.user_id)
        .where(UserSavedOpportunityNotification.organization_id == org_id)
    ).scalar_one_or_none()
    if not setting:
        setting = UserSavedOpportunityNotification(
            user_id=user.user_id,
            user_saved_opportunity_notification_id=uuid4(),
            organization_id=org_id,
        )

    # Update email_enabled if it differs or just update timestamp
    setting.email_enabled = requested_setting.email_enabled

    db_session.add(setting)

    logger.info(
        "Modified saved opportunity notification setting",
        extra={
            "organization_id": org_id,
            "email_enabled": requested_setting.email_enabled,
        },
    )
