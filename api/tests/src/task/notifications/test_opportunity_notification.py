from datetime import date, timedelta

import pytest

import tests.src.db.models.factories as factories
from src.adapters.aws.pinpoint_adapter import _clear_mock_responses
from src.constants.lookup_constants import (
    FundingCategory,
    FundingInstrument,
    OpportunityCategory,
    OpportunityStatus,
)
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import UserNotificationLog, UserSavedOpportunity
from src.task.notifications.config import EmailNotificationConfig
from src.task.notifications.constants import Metrics, NotificationReason, OpportunityVersionChange
from src.task.notifications.email_notification import EmailNotificationTask
from src.task.notifications.opportunity_notifcation import OpportunityNotificationTask
from tests.lib.db_testing import cascade_delete_from_db_table


def link_user_with_email(user):
    factories.LinkExternalUserFactory.create(user=user, email="test@example.com")
    return user


class TestOpportunityNotification:

    @pytest.fixture
    def email_notification_task(self, db_session, search_client, monkeypatch):
        monkeypatch.setenv("AWS_PINPOINT_APP_ID", "test-app-id")
        monkeypatch.setenv("FRONTEND_BASE_URL", "http://testhost:3000")
        monkeypatch.setenv("ENABLE_OPPORTUNITY_NOTIFICATIONS", "true")
        monkeypatch.setenv("ENABLE_SEARCH_NOTIFICATIONS", "false")
        monkeypatch.setenv("ENABLE_CLOSING_DATE_NOTIFICATIONS", "false")

        config = EmailNotificationConfig()
        return EmailNotificationTask(db_session, search_client, config)

    @pytest.fixture(autouse=True)
    def clear_data(self, db_session):
        """Clear all notification logs"""
        cascade_delete_from_db_table(db_session, UserNotificationLog)
        cascade_delete_from_db_table(db_session, Opportunity)
        cascade_delete_from_db_table(db_session, UserSavedOpportunity)

    @pytest.fixture
    def user_with_email(self, db_session, user, monkeypatch):
        return link_user_with_email(user)

    def test_email_notifications_collection(
        self,
        cli_runner,
        db_session,
        search_client,
        enable_factory_create,
        user,
        user_with_email,
        caplog,
        monkeypatch,
        email_notification_task,
    ):
        """Test that latest opportunity version is collected for each saved opportunity"""
        # create a different user
        user_2 = factories.UserFactory.create()
        user_2 = link_user_with_email(user_2)

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

        opp_1.category = OpportunityCategory.CONTINUATION
        opp_2.category = OpportunityCategory.CONTINUATION
        opp_3.category = OpportunityCategory.CONTINUATION

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
                assert latest_opp_ver == opp_1_v_2
            elif opp_id == opp_2.opportunity_id:
                assert latest_opp_ver == opp_2_v_1
            elif opp_id == opp_3.opportunity_id:
                assert latest_opp_ver == opp_3_v_2

        # Run the notification task
        email_notification_task.run()

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
        cli_runner,
        db_session,
        search_client,
        enable_factory_create,
        user,
        email_notification_task,
    ):
        """Test that no notification is collected if the user has no linked email address."""
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
        cli_runner,
        db_session,
        search_client,
        enable_factory_create,
        user,
        email_notification_task,
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
        cli_runner,
        db_session,
        search_client,
        enable_factory_create,
        user,
        email_notification_task,
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
        cli_runner,
        db_session,
        search_client,
        enable_factory_create,
        user,
        monkeypatch,
        email_notification_task,
    ):
        """
         Test that `_get_last_notified_versions` correctly returns the most recent
        OpportunityVersion created *before* each user's `last_notified_at` timestamp for the given opportunity
        """
        # create a different user
        user_2 = factories.UserFactory.create()
        user_2 = link_user_with_email(user_2)

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

    def test_build_opportunity_status_content(
        self,
        cli_runner,
        db_session,
        search_client,
        enable_factory_create,
        user,
        monkeypatch,
        email_notification_task,
    ):
        # Create opp and first version
        opp = factories.OpportunityFactory.create(is_posted_summary=True)
        opp_p = factories.OpportunityVersionFactory.create(opportunity=opp)
        # Update opp and create second version
        opp.current_opportunity_summary.opportunity_status = OpportunityStatus.CLOSED
        opp_l = factories.OpportunityVersionFactory.create(opportunity=opp)

        # Instantiate the task
        task = OpportunityNotificationTask(db_session=db_session)
        res = task._build_sections(
            OpportunityVersionChange(
                opportunity_id=opp.opportunity_id,
                previous=opp_p,
                latest=opp_l,
            )
        )

        expected = '<p style="margin-left: 20px;">Status</p><p style="margin-left: 40px;">•  The status changed from Open to Closed.<br>'

        assert res == expected

    def test_build_important_dates_content(
        self,
        cli_runner,
        db_session,
        search_client,
        enable_factory_create,
        user,
        monkeypatch,
        email_notification_task,
    ):
        # Create opp and first version
        opp = factories.OpportunityFactory.create(is_forecasted_summary=True)

        opp_summary = opp.current_opportunity_summary.opportunity_summary
        opp_summary.close_date = date(2025, 7, 19)
        opp_summary.forecasted_award_date = date(2025, 10, 10)
        opp_summary.forecasted_project_start_date = date(2025, 5, 5)
        opp_summary.fiscal_year = 2025

        opp_p = factories.OpportunityVersionFactory.create(opportunity=opp)
        # Update opp and create second version
        opp.current_opportunity_summary.opportunity_summary.close_date += timedelta(days=10)
        opp.current_opportunity_summary.opportunity_summary.forecasted_award_date += timedelta(
            days=1
        )
        opp.current_opportunity_summary.opportunity_summary.forecasted_project_start_date += (
            timedelta(days=2)
        )
        opp.current_opportunity_summary.opportunity_summary.fiscal_year += 1

        opp_l = factories.OpportunityVersionFactory.create(opportunity=opp)
        # Instantiate the task
        task = OpportunityNotificationTask(db_session=db_session)
        res = task._build_sections(
            OpportunityVersionChange(
                opportunity_id=opp.opportunity_id, previous=opp_p, latest=opp_l
            )
        )
        expected = '<p style="margin-left: 20px;">Important dates</p><p style="margin-left: 40px;">•  The application due date changed from July 19, 2025 to July 29, 2025.<br><p style="margin-left: 40px;">•  The estimated award date changed from October 10, 2025 to October 11, 2025.<br><p style="margin-left: 40px;">•  The estimated project start date changed from May 5, 2025 to May 7, 2025.<br><p style="margin-left: 40px;">•  The fiscal year changed from 2025 to 2026.<br>'

        assert res == expected

    def test_build_award_dates_content(
        self,
        cli_runner,
        db_session,
        search_client,
        enable_factory_create,
        user,
        monkeypatch,
        email_notification_task,
    ):
        # Create opp and first version
        opp = factories.OpportunityFactory.create()
        opp_summary = opp.current_opportunity_summary.opportunity_summary

        opp_summary.estimated_total_program_funding = 300000
        opp_summary.expected_number_of_awards = 10
        opp_summary.award_floor = 10000
        opp_summary.award_ceiling = 300000

        opp_p = factories.OpportunityVersionFactory.create(opportunity=opp)

        # Update opp and create second version
        opp_summary.estimated_total_program_funding -= 50000
        opp_summary.expected_number_of_awards -= 1
        opp_summary.award_floor += 15000
        opp_summary.award_ceiling -= 50000

        opp_l = factories.OpportunityVersionFactory.create(opportunity=opp)
        # Instantiate the task
        task = OpportunityNotificationTask(db_session=db_session)
        res = task._build_sections(
            OpportunityVersionChange(
                opportunity_id=opp.opportunity_id, previous=opp_p, latest=opp_l
            )
        )
        expected = '<p style="margin-left: 20px;">Awards details</p><p style="margin-left: 40px;">•  Program funding changed from 300000 to 250000.<br><p style="margin-left: 40px;">•  The number of expected awards changed from 10 to 9.<br><p style="margin-left: 40px;">•  The award minimum changed from 10000 to 25000.<br><p style="margin-left: 40px;">•  The award maximum changed from 300000 to 250000.<br>'

        assert res == expected

    def test_build_categorization_content(
        self,
        cli_runner,
        db_session,
        search_client,
        enable_factory_create,
        user,
        monkeypatch,
        email_notification_task,
    ):
        # Create opp and first version
        opp = factories.OpportunityFactory.create()
        opp_summary = opp.current_opportunity_summary.opportunity_summary

        opp_summary.is_cost_sharing = True
        opp_summary.funding_instruments = [FundingInstrument.OTHER]
        opp.category = OpportunityCategory.DISCRETIONARY
        opp.category_explanation = None
        opp_summary.funding_categories = [
            FundingCategory.OTHER,
            FundingCategory.OPPORTUNITY_ZONE_BENEFITS,
        ]
        opp_summary.funding_category_description = "i am a description"

        opp_p = factories.OpportunityVersionFactory.create(opportunity=opp)

        # Update opp and create second version
        opp_summary.is_cost_sharing = False
        opp_summary.funding_instruments = [FundingInstrument.GRANT]
        opp.category = OpportunityCategory.OTHER
        opp.category_explanation = "i am an explanation"
        opp_summary.funding_categories = [FundingCategory.ARTS]
        opp_summary.funding_category_description = None

        opp_l = factories.OpportunityVersionFactory.create(opportunity=opp)
        # Instantiate the task
        task = OpportunityNotificationTask(db_session=db_session)
        res = task._build_sections(
            OpportunityVersionChange(
                opportunity_id=opp.opportunity_id, previous=opp_p, latest=opp_l
            )
        )
        expected = '<p style="margin-left: 20px;">Categorization</p><p style="margin-left: 40px;">•  Cost sharing or matching requirement has changed from Yes to No.<br><p style="margin-left: 40px;">•  The funding instrument type has changed from Other to Grant.<br><p style="margin-left: 40px;">•  The opportunity category has changed from Discretionary to Other.<br><p style="margin-left: 40px;">•  Opportunity category explanation has changed from None to I am an explanation.<br><p style="margin-left: 40px;">•  The category of funding activity has changed from Other, Opportunity_zone_benefits to Arts.<br>'

        assert res == expected

    def test_build_notification_content(
        self,
        cli_runner,
        db_session,
        search_client,
        enable_factory_create,
        user,
        monkeypatch,
        email_notification_task,
    ):
        # Create opp and first version
        opp = factories.OpportunityFactory.create(is_posted_summary=True)
        opp.opportunity_title = "Opal 2025 award"
        opp_summary = opp.current_opportunity_summary.opportunity_summary

        opp_summary.close_date = date(2025, 7, 19)
        opp_summary.forecasted_award_date = date(2025, 10, 10)
        opp_summary.forecasted_project_start_date = date(2025, 5, 5)

        opp_summary.fiscal_year = 2025
        opp_summary.estimated_total_program_funding = 300000
        opp_summary.expected_number_of_awards = 10
        opp_summary.award_floor = 10000
        opp_summary.award_ceiling = 300000

        opp_summary.is_cost_sharing = True
        opp_summary.funding_instruments = [FundingInstrument.OTHER]
        opp.category = OpportunityCategory.DISCRETIONARY
        opp.category_explanation = None
        opp_summary.funding_categories = [
            FundingCategory.OTHER,
            FundingCategory.OPPORTUNITY_ZONE_BENEFITS,
        ]
        opp_summary.funding_category_description = "i am a description"

        opp_p = factories.OpportunityVersionFactory.create(opportunity=opp)

        opp.current_opportunity_summary.opportunity_status = OpportunityStatus.CLOSED

        opp.current_opportunity_summary.opportunity_summary.close_date += timedelta(days=10)
        opp.current_opportunity_summary.opportunity_summary.forecasted_award_date += timedelta(
            days=1
        )
        opp.current_opportunity_summary.opportunity_summary.forecasted_project_start_date += (
            timedelta(days=2)
        )
        opp.current_opportunity_summary.opportunity_summary.fiscal_year += 1

        opp_summary.estimated_total_program_funding -= 50000
        opp_summary.expected_number_of_awards -= 1
        opp_summary.award_floor += 15000
        opp_summary.award_ceiling -= 50000

        opp_summary.is_cost_sharing = False
        opp_summary.funding_instruments = [FundingInstrument.GRANT]
        opp.category = OpportunityCategory.OTHER
        opp.category_explanation = "i am an explanation"
        opp_summary.funding_categories = [FundingCategory.ARTS]
        opp_summary.funding_category_description = None

        opp_l = factories.OpportunityVersionFactory.create(opportunity=opp)

        # Instantiate the task
        task = OpportunityNotificationTask(db_session=db_session)
        res = task._build_notification_content(
            [
                OpportunityVersionChange(
                    opportunity_id=opp.opportunity_id, previous=opp_p, latest=opp_l
                )
            ]
        )

        expected = f'The following funding opportunity recently changed:<br><br><div>1. <a href=\'None/opportunity/{opp.opportunity_id}\' target=\'_blank\'>Opal 2025 award</a><br><br>Here’s what changed:</div><p style="margin-left: 20px;">Status</p><p style="margin-left: 40px;">•  The status changed from Open to Closed.<br><br><p style="margin-left: 20px;">Important dates</p><p style="margin-left: 40px;">•  The application due date changed from July 19, 2025 to July 29, 2025.<br><p style="margin-left: 40px;">•  The estimated award date changed from October 10, 2025 to October 11, 2025.<br><p style="margin-left: 40px;">•  The estimated project start date changed from May 5, 2025 to May 7, 2025.<br><p style="margin-left: 40px;">•  The fiscal year changed from 2025 to 2026.<br><br><p style="margin-left: 20px;">Awards details</p><p style="margin-left: 40px;">•  Program funding changed from 300000 to 250000.<br><p style="margin-left: 40px;">•  The number of expected awards changed from 10 to 9.<br><p style="margin-left: 40px;">•  The award minimum changed from 10000 to 25000.<br><p style="margin-left: 40px;">•  The award maximum changed from 300000 to 250000.<br><br><p style="margin-left: 20px;">Categorization</p><p style="margin-left: 40px;">•  Cost sharing or matching requirement has changed from Yes to No.<br><p style="margin-left: 40px;">•  The funding instrument type has changed from Other to Grant.<br><p style="margin-left: 40px;">•  The opportunity category has changed from Discretionary to Other.<br><p style="margin-left: 40px;">•  Opportunity category explanation has changed from None to I am an explanation.<br><p style="margin-left: 40px;">•  The category of funding activity has changed from Other, Opportunity_zone_benefits to Arts.<br><br><br><div><strong>Please carefully read the opportunity listing pages to review all changes.</strong> <br><br><a href=\'None\' target=\'_blank\' style=\'color:blue;\'>Sign in to Simpler.Grants.gov to manage your saved opportunities.</a></div><div>If you have questions, please contact the Grants.gov Support Center:<br><br><a href=\'mailto:support@grants.gov\'>support@grants.gov</a><br>1-800-518-4726<br>24 hours a day, 7 days a week<br>Closed on federal holidays</div>'

        assert res.message == expected
        assert res.subject == "Your saved funding opportunity changed on <a href='None' target='_blank' style='color:blue;'>Simpler.Grants.gov</a>"
        assert res.updated_opportunity_ids == [opp.opportunity_id]

