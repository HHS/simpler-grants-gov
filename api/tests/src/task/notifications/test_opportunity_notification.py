from datetime import timedelta

import pytest

import tests.src.db.models.factories as factories
from src.adapters.aws.pinpoint_adapter import _clear_mock_responses
from src.db.models.user_models import UserNotificationLog, UserSavedOpportunity
from src.task.notifications.constants import NotificationReason
from src.util import datetime_util


@pytest.fixture
def user_with_email(db_session, user, monkeypatch):
    monkeypatch.setenv("PINPOINT_APP_ID", "test-app-id")
    factories.LinkExternalUserFactory.create(user=user, email="test@example.com")
    return user


@pytest.fixture
def clear_notification_logs(db_session):
    """Clear all notification logs"""
    db_session.query(UserNotificationLog).delete()
    db_session.query(UserSavedOpportunity).delete()


def test_opportunity_notifications_cli(
    cli_runner,
    db_session,
    enable_factory_create,
    user,
    user_with_email,
    caplog,
    clear_notification_logs,
):
    """Simple test that verifies we can invoke the notification task via CLI"""
    # Create a saved opportunity that needs notification
    opportunity = factories.OpportunityFactory.create()
    saved_opportunity = factories.UserSavedOpportunityFactory.create(
        user=user,
        opportunity=opportunity,
        last_notified_at=opportunity.updated_at - timedelta(days=1),
    )
    factories.OpportunityChangeAuditFactory.create(
        opportunity=opportunity,
        updated_at=saved_opportunity.last_notified_at + timedelta(minutes=1),
    )

    _clear_mock_responses()

    result = cli_runner.invoke(args=["task", "email-notifications"])

    assert result.exit_code == 0

    # Verify expected log messages
    assert "Collected updated opportunity notifications" in caplog.text
    assert "Sending notification to user" in caplog.text

    # Verify the log contains the correct metrics
    log_records = [
        r for r in caplog.records if "Successfully sent notification to user" in r.message
    ]
    assert len(log_records) == 1
    extra = log_records[0].__dict__
    assert extra["user_id"] == user.user_id
    assert extra["notification_reason"] == NotificationReason.OPPORTUNITY_UPDATES


def test_last_notified_at_updates(
    cli_runner, db_session, enable_factory_create, user, user_with_email
):
    """Test that last_notified_at gets updated after sending notifications"""
    # Create an opportunity that was updated after the last notification
    opportunity = factories.OpportunityFactory.create()
    saved_opp = factories.UserSavedOpportunityFactory.create(
        user=user,
        opportunity=opportunity,
        last_notified_at=opportunity.updated_at - timedelta(days=1),
    )
    factories.OpportunityChangeAuditFactory.create(
        opportunity=opportunity,
        updated_at=saved_opp.last_notified_at + timedelta(minutes=1),
    )
    # Store the original notification time
    original_notification_time = saved_opp.last_notified_at

    # Run the notification task
    result = cli_runner.invoke(args=["task", "email-notifications"])
    assert result.exit_code == 0

    # Refresh the saved opportunity from the database
    db_session.refresh(saved_opp)

    # Verify last_notified_at was updated
    assert saved_opp.last_notified_at > original_notification_time
    # Verify last_notified_at is now after the opportunity's updated_at
    assert saved_opp.last_notified_at > opportunity.updated_at


def test_notification_log_creation(
    cli_runner, db_session, enable_factory_create, clear_notification_logs, user, user_with_email
):
    """Test that notification logs are created when notifications are sent"""
    # Create a saved opportunity that needs notification
    opportunity = factories.OpportunityFactory.create(no_current_summary=True)
    factories.OpportunitySummaryFactory.create(
        opportunity=opportunity,
        close_date=datetime_util.utcnow() + timedelta(days=21),
    )
    saved_opportunity = factories.UserSavedOpportunityFactory.create(
        user=user,
        opportunity=opportunity,
        last_notified_at=opportunity.updated_at - timedelta(days=1),
    )

    factories.OpportunityChangeAuditFactory.create(
        opportunity=opportunity,
        updated_at=saved_opportunity.last_notified_at + timedelta(minutes=1),
    )

    # Run the notification task
    result = cli_runner.invoke(args=["task", "email-notifications"])
    assert result.exit_code == 0

    # Verify notification log was created
    notification_logs = db_session.query(UserNotificationLog).all()
    assert len(notification_logs) == 1

    log = notification_logs[0]
    assert log.user_id == user.user_id
    assert log.notification_reason == NotificationReason.OPPORTUNITY_UPDATES

    assert log.notification_sent is True


def test_no_notification_log_when_no_updates(
    cli_runner, db_session, enable_factory_create, clear_notification_logs, user, user_with_email
):
    """Test that no notification log is created when there are no updates"""
    # Create a saved opportunity that doesn't need notification
    opportunity = factories.OpportunityFactory.create(no_current_summary=True)
    factories.OpportunitySummaryFactory.create(
        opportunity=opportunity,
        close_date=datetime_util.utcnow() + timedelta(days=21),
    )
    factories.UserSavedOpportunityFactory.create(
        user=user,
        opportunity=opportunity,
        last_notified_at=opportunity.updated_at + timedelta(minutes=1),  # After the update
    )

    # Run the notification task
    result = cli_runner.invoke(args=["task", "email-notifications"])

    assert result.exit_code == 0

    # Verify no notification log was created
    notification_logs = db_session.query(UserNotificationLog).all()
    assert len(notification_logs) == 0
