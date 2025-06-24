from datetime import timedelta

import pytest

import tests.src.db.models.factories as factories
from src.adapters.aws.pinpoint_adapter import _clear_mock_responses
from src.constants.lookup_constants import OpportunityCategory
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import UserNotificationLog, UserSavedOpportunity
from src.task.notifications.constants import Metrics, NotificationReason
from src.task.notifications.opportunity_notifcation import OpportunityNotificationTask
from tests.lib.db_testing import cascade_delete_from_db_table


def link_user_with_email(user):
    factories.LinkExternalUserFactory.create(user=user, email="test@example.com")
    return user



class TestOpportunityNotification:
    @pytest.fixture
    def set_env_var_for_email_notification_config(self,monkeypatch):
        monkeypatch.setenv("AWS_PINPOINT_APP_ID", "test-app-id")
        monkeypatch.setenv("FRONTEND_BASE_URL", "http://testhost:3000")

    @pytest.fixture(autouse=True)
    def clear_data(self, db_session):
        """Clear all notification logs"""
        cascade_delete_from_db_table(db_session, UserNotificationLog)
        cascade_delete_from_db_table(db_session, Opportunity)
        cascade_delete_from_db_table(db_session, UserSavedOpportunity)

    @pytest.fixture(autouse=True)
    def user_with_email(self, db_session, user, monkeypatch):
        return link_user_with_email(user)

    def test_email_notifications_collection(
        self,
        db_session,
        cli_runner,
        enable_factory_create,
        user,
        caplog,
            set_env_var_for_email_notification_config
    ):
        """Test that latest opportunity version is collected for each saved opportunity"""
        # create a different user

        user_2 = factories.LinkExternalUserFactory.create(email="test@example.com").user

        # Create a saved opportunity that needs notification
        opp_1 = factories.OpportunityFactory.create(category=OpportunityCategory.OTHER)
        opp_2 = factories.OpportunityFactory.create(category=OpportunityCategory.OTHER)
        opp_3 = factories.OpportunityFactory.create(category=OpportunityCategory.OTHER)

        # create old versions  for opps
        factories.OpportunityVersionFactory.create(
            opportunity=opp_1,
        )
        factories.OpportunityVersionFactory.create(
            opportunity=opp_2,
        )
        factories.OpportunityVersionFactory.create(
            opportunity=opp_3,
        )

        # User saved opportunity records
        factories.UserSavedOpportunityFactory.create(
            user=user,
            opportunity=opp_1,
        )
        factories.UserSavedOpportunityFactory.create(
            user=user,
            opportunity=opp_2,
        )
        factories.UserSavedOpportunityFactory.create(
            user=user_2,
            opportunity=opp_1,
        )
        factories.UserSavedOpportunityFactory.create(
            user=user_2,
            opportunity=opp_3,
        )

        # create new versions for opps
        factories.OpportunityVersionFactory.create(
            opportunity=opp_1, created_at=opp_1.created_at + timedelta(minutes=60)
        )
        opp_1_v_2 = factories.OpportunityVersionFactory.create(
            opportunity=opp_1, created_at=opp_1.created_at + timedelta(minutes=160)
        )
        opp_2_v_1 = factories.OpportunityVersionFactory.create(
            opportunity=opp_2, created_at=opp_2.created_at + timedelta(minutes=60)
        )
        factories.OpportunityVersionFactory.create(
            opportunity=opp_3, created_at=opp_3.created_at + timedelta(minutes=60)
        )
        opp_3_v_2 = factories.OpportunityVersionFactory.create(
            opportunity=opp_3, created_at=opp_3.created_at + timedelta(minutes=80)
        )

        _clear_mock_responses()

        # Instantiate the task
        task = OpportunityNotificationTask(db_session=db_session)

        results = task._get_latest_opportunity_versions()

        # assert that only the latest version is picked up for each user_saved_opportunity
        assert len(results) == 4

        for user_saved_opp, latest_opp_ver in results:
            opp_id = user_saved_opp.opportunity_id

            if opp_id == opp_1.opportunity_id:
                assert latest_opp_ver.opportunity_id == opp_1_v_2.opportunity_id
            elif opp_id == opp_2.opportunity_id:
                assert latest_opp_ver.opportunity_id == opp_2_v_1.opportunity_id
            elif opp_id == opp_3.opportunity_id:
                assert latest_opp_ver.opportunity_id == opp_3_v_2.opportunity_id

        # Run the notification task
        OpportunityNotificationTask(db_session=db_session)

        # Verify notification log was created
        notification_logs = (
            db_session.query(UserNotificationLog)
            .filter(
                UserNotificationLog.notification_reason == NotificationReason.OPPORTUNITY_UPDATES
            )
            .all()
        )
        assert len(notification_logs) == 2
        assert notification_logs[0].user_id == user.user_id
        assert notification_logs[1].user_id == user_2.user_id

        # Verify the log contains the correct metrics
        log_records = [
            r for r in caplog.records if "Successfully delivered notification to user" in r.message
        ]
        assert len(log_records) == 2
        assert (
            log_records[0].__dict__["notification_reason"] == NotificationReason.OPPORTUNITY_UPDATES
        )

    def test_with_no_user_email_notification(
        self,
        db_session,
        enable_factory_create,
            set_env_var_for_email_notification_config
    ):
        """Test that no notification is collected if the user has no linked email address."""
        user = factories.UserFactory.create()
        # Create a saved opportunity that needs notification
        opportunity = factories.OpportunityFactory.create(no_current_summary=True)
        factories.OpportunityVersionFactory.create(
            opportunity=opportunity,
        )
        factories.UserSavedOpportunityFactory.create(
            user=user,
            opportunity=opportunity,
        )
        factories.OpportunityVersionFactory.create(
            opportunity=opportunity,
        )

        # Instantiate the task
        task = OpportunityNotificationTask(db_session=db_session)

        results = task.collect_email_notifications()

        assert len(results) == 0

    def test_with_no_prior_version_email_collections(
        self,
        db_session,
        enable_factory_create,
        user,
            set_env_var_for_email_notification_config
    ):
        """Test that no notification log is created when no prior version exist"""
        opportunity = factories.OpportunityFactory.create(no_current_summary=True)
        factories.UserSavedOpportunityFactory.create(
            user=user,
            opportunity=opportunity,
        )

        # Instantiate the task
        task = OpportunityNotificationTask(db_session=db_session)
        results = task.collect_email_notifications()

        assert len(results) == 0
        metrics = task.metrics
        assert metrics[Metrics.VERSIONLESS_OPPORTUNITY_COUNT] == 1

    def test_no_updates_email_collections(
        self,
        db_session,
        enable_factory_create,
        user,
            set_env_var_for_email_notification_config
    ):
        """Test that no notification is collected when there are no opportunity updates."""
        opportunity = factories.OpportunityFactory.create(no_current_summary=True)
        version = factories.OpportunityVersionFactory.create(opportunity=opportunity)
        factories.UserSavedOpportunityFactory.create(
            user=user,
            opportunity=opportunity,
            last_notified_at=version.created_at + timedelta(minutes=1),
        )

        # Instantiate the task
        task = OpportunityNotificationTask(db_session=db_session)

        results = task.collect_email_notifications()
        assert len(results) == 0

    def test_last_notified_version(
        self,
        db_session,
        enable_factory_create,
        user,
            set_env_var_for_email_notification_config

    ):
        """
         Test that `_get_last_notified_versions` correctly returns the most recent
        OpportunityVersion created *before* each user's `last_notified_at` timestamp for the given opportunity
        """
        # create a different user
        user_2 = factories.LinkExternalUserFactory.create(email="test@example.com").user

        v_1 = factories.OpportunityVersionFactory.create()
        opp = v_1.opportunity

        factories.UserSavedOpportunityFactory.create(
            user=user,
            opportunity=opp,
            last_notified_at=v_1.created_at + timedelta(minutes=1),
        )
        v_2 = factories.OpportunityVersionFactory.create(
            opportunity=opp, created_at=v_1.created_at + timedelta(minutes=60)
        )
        factories.UserSavedOpportunityFactory.create(
            user=user_2,
            opportunity=opp,
            last_notified_at=v_2.created_at + timedelta(minutes=1),
        )

        # Instantiate the task
        task = OpportunityNotificationTask(db_session=db_session)

        results = task._get_last_notified_versions(
            [
                (user.user_id, opp.opportunity_id),
                (user_2.user_id, opp.opportunity_id),
            ]
        )

        assert results[user.user_id, opp.opportunity_id] == v_1
        assert results[user_2.user_id, opp.opportunity_id] == v_2
