from datetime import timedelta

import pytest
from sqlalchemy import select

import tests.src.db.models.factories as factories
from src.adapters.aws.pinpoint_adapter import _clear_mock_responses, _get_mock_responses
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import (
    SuppressedEmail,
    UserNotificationLog,
    UserOpportunityNotificationLog,
    UserSavedSearch,
)
from src.task.notifications.closing_date_notification import ClosingDateNotificationTask
from src.task.notifications.config import EmailNotificationConfig
from src.task.notifications.constants import NotificationReason
from src.task.notifications.email_notification import EmailNotificationTask
from src.util import datetime_util
from tests.lib.db_testing import cascade_delete_from_db_table


class TestClosingDateNotification:
    notification_config: EmailNotificationConfig

    @pytest.fixture
    def configuration(self):
        self.notification_config = EmailNotificationConfig()
        self.notification_config.reset_emails_without_sending = False

    @pytest.fixture
    def user_with_email(self, db_session, user, monkeypatch):
        monkeypatch.setenv("AWS_PINPOINT_APP_ID", "test-app-id")
        factories.LinkExternalUserFactory.create(user=user, email="test@example.com")
        return user

    @pytest.fixture(autouse=True)
    def clear_data(self, db_session):
        """Clear all notification logs"""
        cascade_delete_from_db_table(db_session, UserNotificationLog)
        cascade_delete_from_db_table(db_session, UserOpportunityNotificationLog)
        cascade_delete_from_db_table(db_session, Opportunity)
        cascade_delete_from_db_table(db_session, UserSavedSearch)
        cascade_delete_from_db_table(db_session, SuppressedEmail)

    def test_closing_date_notifications(
        self,
        db_session,
        enable_factory_create,
        user_with_email,
        search_client,
        configuration,
    ):
        """Test that notifications are sent for opportunities closing in two weeks"""
        two_weeks_from_now = datetime_util.get_now_us_eastern_date() + timedelta(days=14)

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
            opportunity=opportunity_later,
            close_date=datetime_util.get_now_us_eastern_date() + timedelta(days=21),
        )
        factories.CurrentOpportunitySummaryFactory.create(
            opportunity=opportunity_later, opportunity_summary=summary
        )

        factories.UserSavedOpportunityFactory.create(
            user=user_with_email, opportunity=opportunity_later
        )

        # Create an opportunity closing in the past (shouldn't trigger notification)
        opportunity_past = factories.OpportunityFactory.create(no_current_summary=True)
        summary = factories.OpportunitySummaryFactory.create(
            opportunity=opportunity_past,
            close_date=datetime_util.get_now_us_eastern_date() - timedelta(days=21),
        )
        factories.CurrentOpportunitySummaryFactory.create(
            opportunity=opportunity_past, opportunity_summary=summary
        )

        factories.UserSavedOpportunityFactory.create(
            user=user_with_email, opportunity=opportunity_past
        )

        # Create an opportunity closing within the 2 week window (should trigger notification)
        opportunity_within_window = factories.OpportunityFactory.create(no_current_summary=True)
        summary = factories.OpportunitySummaryFactory.create(
            opportunity=opportunity_within_window,
            close_date=datetime_util.get_now_us_eastern_date() + timedelta(days=13),
        )
        factories.CurrentOpportunitySummaryFactory.create(
            opportunity=opportunity_within_window, opportunity_summary=summary
        )

        factories.UserSavedOpportunityFactory.create(
            user=user_with_email, opportunity=opportunity_within_window
        )

        _clear_mock_responses()

        # Run the notification task
        task = EmailNotificationTask(db_session, search_client, self.notification_config)
        task.run()

        # Verify notification log was created only for the opportunity closing in two weeks
        notification_logs = (
            db_session.execute(
                select(UserNotificationLog).where(
                    UserNotificationLog.notification_reason
                    == NotificationReason.CLOSING_DATE_REMINDER
                )
            )
            .scalars()
            .all()
        )

        notification_opportunity_logs = (
            db_session.execute(select(UserOpportunityNotificationLog)).scalars().all()
        )

        # this is emails not opps so this should be 1, 1 email 2 opportunities
        assert len(notification_logs) == 1
        assert notification_logs[0].notification_sent is True

        assert len(notification_opportunity_logs) == 2

        assert set([log.opportunity_id for log in notification_opportunity_logs]) == {
            opportunity.opportunity_id,
            opportunity_within_window.opportunity_id,
        }
        assert set([log.user_id for log in notification_opportunity_logs]) == {
            user_with_email.user_id
        }

        # Verify email was sent via Pinpoint
        mock_responses = _get_mock_responses()
        assert len(mock_responses) == 1

    def test_closing_date_notification_not_sent_twice(
        self,
        db_session,
        enable_factory_create,
        user_with_email,
        search_client,
        configuration,
    ):
        """Test that closing date notifications aren't sent multiple times for the same opportunity"""
        two_weeks_from_now = datetime_util.get_now_us_eastern_date() + timedelta(days=14)

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
        task = EmailNotificationTask(db_session, search_client, self.notification_config)
        task.run()

        # Verify no new notification logs were created
        notification_logs = (
            db_session.execute(
                select(UserNotificationLog).where(
                    UserNotificationLog.notification_reason
                    == NotificationReason.CLOSING_DATE_REMINDER
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
        task_again = EmailNotificationTask(db_session, search_client, self.notification_config)
        task_again.run()

        # Verify no emails were sent
        mock_responses = _get_mock_responses()
        assert len(mock_responses) == 0

    def test_post_notification_log_creation(
        self,
        db_session,
        search_client,
        enable_factory_create,
        user,
        user_with_email,
        configuration,
    ):
        """Test that notification logs are created when notifications are sent"""
        # Create an opportunity closing in 2 weeks that needs notification
        opportunity = factories.OpportunityFactory.create(no_current_summary=True)
        summary = factories.OpportunitySummaryFactory.create(
            opportunity=opportunity,
            close_date=datetime_util.get_now_us_eastern_date() + timedelta(days=14),
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
        task = EmailNotificationTask(db_session, search_client, self.notification_config)
        task.run()

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

    def test_excludes_emails_in_suppression_list(
        self, db_session, search_client, enable_factory_create, user_with_email, configuration
    ):
        """Test that the user notification does not pick up users on suppression_list"""
        # create a suppressed email
        suppressed_user = factories.UserFactory.create()
        factories.LinkExternalUserFactory.create(user=suppressed_user, email="testing@example.com")

        factories.SuppressedEmailFactory(email=suppressed_user.email)

        two_weeks_from_now = datetime_util.get_now_us_eastern_date() + timedelta(days=14)

        # Create an opportunity closing in two weeks
        opportunity = factories.OpportunityFactory.create(no_current_summary=True)
        summary = factories.OpportunitySummaryFactory.create(
            opportunity=opportunity, close_date=two_weeks_from_now
        )
        factories.CurrentOpportunitySummaryFactory.create(
            opportunity=opportunity, opportunity_summary=summary
        )
        # create saved opportunity for both users
        factories.UserSavedOpportunityFactory.create(user=suppressed_user, opportunity=opportunity)
        factories.UserSavedOpportunityFactory.create(user=user_with_email, opportunity=opportunity)

        task = ClosingDateNotificationTask(db_session, self.notification_config)
        results = task.collect_email_notifications()

        # Verify opportunity from suppressed user is not picked up
        assert len(results) == 1
        assert results[0].user_id == user_with_email.user_id
