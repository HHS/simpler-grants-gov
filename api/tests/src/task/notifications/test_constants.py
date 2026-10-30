import pytest

from src.constants.email_constants import EmailType
from src.constants.lookup_constants import NotificationType
from src.task.notifications.constants import NotificationReason


@pytest.mark.parametrize("notification_reason", NotificationReason)
def test_every_notification_reason_has_an_email_type(notification_reason):
    """BaseNotificationTask tags each email with the EmailType matching its notification reason"""
    assert EmailType(notification_reason) == notification_reason


@pytest.mark.parametrize("notification_type", NotificationType)
def test_every_notification_type_has_an_email_type(notification_type):
    """The notification queue processor tags each email with the EmailType matching its notification type"""
    assert EmailType(notification_type) == notification_type
