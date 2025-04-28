from datetime import timedelta

import pytest
from sqlalchemy import select

import tests.src.db.models.factories as factories
from src.adapters.aws.pinpoint_adapter import _clear_mock_responses, _get_mock_responses
from src.db.models.user_models import (
    UserNotificationLog,
    UserOpportunityNotificationLog,
    UserSavedOpportunity,
)
from src.task.notifications.constants import NotificationReason
from src.task.notifications.email_notification import EmailNotificationTask
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
    db_session.query(UserOpportunityNotificationLog).delete()


def test_closing_date_notifications(
    db_session, enable_factory_create, user_with_email, search_client, clear_notification_logs
):
    """Test that notifications are sent for opportunities closing in two weeks"""
    two_weeks_from_now = datetime_util.utcnow() + timedelta(days=14)

    # Create an opportunity closing in two weeks
    opportunity = factories.OpportunityFactory.create(no_current_summary=True)
    summary = factories.OpportunitySummaryFactory.create(
        opportunity=opportunity, close_date=two_weeks_from_now
    )
    factories.CurrentOpportunitySummaryFactory.create(
        opportunity=opportunity, opportunity_summary=summary
    )

    factories.UserSavedOpportunityFactory.create(user=user_with_email, opportunity=opportunity)

    # Create an opportunity closing in three weeks (shouldn't trigger notification)
    opportunity_later = factories.OpportunityFactory.create(no_current_summary=True)
    summary = factories.OpportunitySummaryFactory.create(
        opportunity=opportunity_later, close_date=datetime_util.utcnow() + timedelta(days=21)
    )
    factories.CurrentOpportunitySummaryFactory.create(
        opportunity=opportunity_later, opportunity_summary=summary
    )

    factories.UserSavedOpportunityFactory.create(
        user=user_with_email, opportunity=opportunity_later
    )

    _clear_mock_responses()

    # Run the notification task
    task = EmailNotificationTask(db_session, search_client)
    task.run()

    # Verify notification log was created only for the opportunity closing in two weeks
    notification_logs = (
        db_session.execute(
            select(UserNotificationLog).where(
                UserNotificationLog.notification_reason == NotificationReason.CLOSING_DATE_REMINDER
            )
        )
        .scalars()
        .all()
    )

    notification_opportunity_logs = (
        db_session.execute(select(UserOpportunityNotificationLog)).scalars().all()
    )

    assert len(notification_logs) == 1
    assert notification_logs[0].notification_sent is True

    assert len(notification_opportunity_logs) == 1
    assert notification_opportunity_logs[0].opportunity_id == opportunity.opportunity_id
    assert notification_opportunity_logs[0].user_id == user_with_email.user_id

    # Verify email was sent via Pinpoint
    mock_responses = _get_mock_responses()
    assert len(mock_responses) == 1


def test_closing_date_notification_not_sent_twice(
    db_session, enable_factory_create, user_with_email, search_client, clear_notification_logs
):
    """Test that closing date notifications aren't sent multiple times for the same opportunity"""
    two_weeks_from_now = datetime_util.utcnow() + timedelta(days=14)

    # Create an opportunity closing in two weeks
    opportunity = factories.OpportunityFactory.create(no_current_summary=True)
    summary = factories.OpportunitySummaryFactory.create(
        opportunity=opportunity, close_date=two_weeks_from_now
    )
    factories.CurrentOpportunitySummaryFactory.create(
        opportunity=opportunity, opportunity_summary=summary
    )

    factories.UserSavedOpportunityFactory.create(user=user_with_email, opportunity=opportunity)

    _clear_mock_responses()

    # Run the notification task
    task = EmailNotificationTask(db_session, search_client)
    task.run()

    # Verify no new notification logs were created
    notification_logs = (
        db_session.execute(
            select(UserNotificationLog).where(
                UserNotificationLog.notification_reason == NotificationReason.CLOSING_DATE_REMINDER
            )
        )
        .scalars()
        .all()
    )

    assert len(notification_logs) == 1  # Only the original notification log

    notification_opportunity_logs = (
        db_session.execute(
            select(UserOpportunityNotificationLog).where(
                UserOpportunityNotificationLog.user_id == user_with_email.user_id
                and UserOpportunityNotificationLog.opportunity_id == opportunity.opportunity_id
            )
        )
        .scalars()
        .all()
    )

    _clear_mock_responses()
    assert len(notification_opportunity_logs) == 1

    # Run the notification task
    task_again = EmailNotificationTask(db_session, search_client)
    task_again.run()

    # Verify no emails were sent
    mock_responses = _get_mock_responses()
    print(mock_responses)
    assert len(mock_responses) == 0


def test_post_notification_log_creation(
    cli_runner, db_session, enable_factory_create, clear_notification_logs, user, user_with_email
):
    """Test that notification logs are created when notifications are sent"""
    # Create an opportunity closing in 2 weeks that needs notification
    opportunity = factories.OpportunityFactory.create(no_current_summary=True)
    summary = factories.OpportunitySummaryFactory.create(
        opportunity=opportunity,
        close_date=datetime_util.utcnow() + timedelta(days=14),
    )
    factories.CurrentOpportunitySummaryFactory.create(
        opportunity=opportunity, opportunity_summary=summary
    )

    factories.UserSavedOpportunityFactory.create(
        user=user,
        opportunity=opportunity,
        last_notified_at=opportunity.updated_at - timedelta(days=1),
    )

    # Run the notification task
    result = cli_runner.invoke(args=["task", "email-notifications"])
    assert result.exit_code == 0

    # Verify notification log was created
    notification_logs = db_session.query(UserNotificationLog).all()
    log = notification_logs[0]

    # UserNotificationLog
    assert len(notification_logs) == 1
    assert log.user_id == user.user_id
    assert log.notification_reason == NotificationReason.CLOSING_DATE_REMINDER
    assert log.notification_sent is True

    # UserOpportunityNotificationLog
    opp_notification_logs = db_session.query(UserOpportunityNotificationLog).all()
    assert len(opp_notification_logs) == 1
    assert opp_notification_logs[0].user_id == user.user_id
    assert opp_notification_logs[0].opportunity_id == opportunity.opportunity_id
