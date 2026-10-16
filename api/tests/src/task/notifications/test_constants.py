import pytest

from src.task.notifications.constants import EmailType, NotificationReason


@pytest.mark.parametrize("notification_reason", NotificationReason)
def test_every_notification_reason_has_an_email_type(notification_reason):
    """BaseNotificationTask tags each email with the EmailType matching its notification reason"""
    assert EmailType(notification_reason) == notification_reason
