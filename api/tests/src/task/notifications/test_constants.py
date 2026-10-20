import pytest

from src.constants.email_constants import EmailType
from src.task.notifications.constants import NotificationReason


@pytest.mark.parametrize("notification_reason", NotificationReason)
def test_every_notification_reason_has_an_email_type(notification_reason):
    """BaseNotificationTask tags each email with the EmailType matching its notification reason"""
    assert EmailType(notification_reason) == notification_reason
