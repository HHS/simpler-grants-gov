import logging
from datetime import date, timedelta
from uuid import UUID

import pytest

import tests.src.db.models.factories as factories
from src.adapters import db
from src.adapters.aws.pinpoint_adapter import _clear_mock_responses
from src.constants.lookup_constants import (
    ApplicantType,
    FundingCategory,
    FundingInstrument,
    OpportunityCategory,
    OpportunityStatus,
)
from src.db.models.opportunity_models import Opportunity, OpportunityVersion
from src.db.models.user_models import SuppressedEmail, UserNotificationLog, UserSavedOpportunity
from src.task.notifications.config import EmailNotificationConfig
from src.task.notifications.constants import (
    Metrics,
    NotificationReason,
    OpportunityVersionChange,
    UserOpportunityUpdateContent,
)
from src.task.notifications.email_notification import EmailNotificationTask
from src.task.notifications.opportunity_notifcation import UTM_TAG, OpportunityNotificationTask
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.db.models.factories import UserFactory


def build_opp_and_version(
    revision_number: int | None,
    opportunity_title: str | None,
    opportunity_status: OpportunityStatus,
    close_date: date | None,
    forecasted_award_date: date | None,
    forecasted_project_start_date: date | None,
    fiscal_year: int | None,
    estimated_total_program_funding: int | None,
    expected_number_of_awards: int | None,
    award_floor: int | None,
    award_ceiling: int | None,
    is_cost_sharing: bool | None,
    funding_instruments: list[FundingInstrument],
    category: OpportunityCategory | None,
    category_explanation: str | None,
    funding_categories: list[FundingCategory],
    funding_category_description: str | None,
    agency_email_address: str | None,
    agency_contact_description: str | None,
    applicant_types: list[ApplicantType],
    applicant_eligibility_description: str | None,
    additional_info_url: str | None,
    summary_description: str | None,
    has_attachments: bool | None = None,
    db_session: db.Session | None = None,
) -> OpportunityVersion:
    _ = db_session  # Prevent linter warning for unused variable
    opportunity = factories.OpportunityFactory.build(
        opportunity_title=opportunity_title,
        current_opportunity_summary=None,
        category=category,
        category_explanation=category_explanation,
        revision_number=revision_number,
    )
    if has_attachments:
        factories.OpportunityAttachmentFactory.create(opportunity=opportunity)

    opportunity_summary = factories.OpportunitySummaryFactory.build(
        opportunity=opportunity,
        close_date=close_date,
        forecasted_award_date=forecasted_award_date,
        forecasted_project_start_date=forecasted_project_start_date,
        fiscal_year=fiscal_year,
        estimated_total_program_funding=estimated_total_program_funding,
        expected_number_of_awards=expected_number_of_awards,
        award_floor=award_floor,
        award_ceiling=award_ceiling,
        is_cost_sharing=is_cost_sharing,
        funding_instruments=funding_instruments,
        funding_categories=funding_categories,
        funding_category_description=funding_category_description,
        agency_email_address=agency_email_address,
        agency_contact_description=agency_contact_description,
        applicant_types=applicant_types,
        applicant_eligibility_description=applicant_eligibility_description,
        additional_info_url=additional_info_url,
        summary_description=summary_description,
    )

    opportunity.current_opportunity_summary = factories.CurrentOpportunitySummaryFactory.build(
        opportunity_status=opportunity_status,
        opportunity_summary=opportunity_summary,
        opportunity=opportunity,
    )

    version = factories.OpportunityVersionFactory.build(opportunity=opportunity)

    return version


base_opal_fields = {
    "opportunity_title": "Opal 2025 Awards",
    "close_date": date(2026, 9, 1),
    "forecasted_award_date": None,
    "forecasted_project_start_date": None,
    "fiscal_year": None,
    "estimated_total_program_funding": 15_000_000,
    "expected_number_of_awards": 3,
    "award_floor": 50_000,
    "award_ceiling": 5_000_000,
    "is_cost_sharing": True,
    "funding_instruments": [FundingInstrument.COOPERATIVE_AGREEMENT],
    "category": None,
    "category_explanation": None,
    "funding_categories": [FundingCategory.EDUCATION],
    "funding_category_description": None,
    "agency_email_address": None,
    "agency_contact_description": "customer service",
    "applicant_types": [ApplicantType.PUBLIC_AND_STATE_INSTITUTIONS_OF_HIGHER_EDUCATION],
    "applicant_eligibility_description": "Not yet determined",
    "additional_info_url": None,
    "summary_description": None,
}

OPAL = build_opp_and_version(
    revision_number=1,
    opportunity_status=OpportunityStatus.POSTED,
    **base_opal_fields,
)

OPAL_STATUS = build_opp_and_version(
    revision_number=1,
    opportunity_status=OpportunityStatus.CLOSED,  # Opp Status update
    **base_opal_fields,
)

OPAL_REVISION_NUMB = build_opp_and_version(
    revision_number=2,  # non-tracked field update
    opportunity_status=OpportunityStatus.POSTED,
    **base_opal_fields,
)

base_topaz_fields = {
    "revision_number": 1,
    "opportunity_title": "Topaz 2025 Climate Research Grant",
    "forecasted_award_date": date(2026, 2, 1),
    "close_date": date(2025, 11, 30),
    "forecasted_project_start_date": date(2026, 4, 15),
    "fiscal_year": 2025,
    "estimated_total_program_funding": 10_000_000,
    "expected_number_of_awards": 7,
    "award_floor": 100_000,
    "award_ceiling": 2_500_000,
    "is_cost_sharing": True,
    "funding_instruments": [FundingInstrument.GRANT, FundingInstrument.COOPERATIVE_AGREEMENT],
    "category": OpportunityCategory.MANDATORY,
    "category_explanation": "Required under federal climate initiative mandate",
    "funding_categories": [
        FundingCategory.SCIENCE_TECHNOLOGY_AND_OTHER_RESEARCH_AND_DEVELOPMENT,
        FundingCategory.ENVIRONMENT,
    ],
    "funding_category_description": "Supports research in climate modeling and adaptation",
    "agency_email_address": None,
    "agency_contact_description": "customer service",
    "applicant_types": [ApplicantType.PUBLIC_AND_INDIAN_HOUSING_AUTHORITIES],
    "applicant_eligibility_description": "No income",
    "additional_info_url": None,
    "summary_description": "Summary",
}

TOPAZ = build_opp_and_version(
    opportunity_status=OpportunityStatus.FORECASTED,
    **base_topaz_fields,
)

TOPAZ_STATUS = build_opp_and_version(
    opportunity_status=OpportunityStatus.CLOSED,
    **base_topaz_fields,
)


class TestOpportunityNotification:
    @pytest.fixture
    def set_env_var_for_email_notification_config(self, monkeypatch):
        monkeypatch.setenv("AWS_PINPOINT_APP_ID", "test-app-id")
        monkeypatch.setenv("FRONTEND_BASE_URL", "http://testhost:3000")

    @pytest.fixture(autouse=True)
    def clear_data(self, db_session):
        """Clear all notification logs"""
        cascade_delete_from_db_table(db_session, UserNotificationLog)
        cascade_delete_from_db_table(db_session, Opportunity)
        cascade_delete_from_db_table(db_session, UserSavedOpportunity)
        cascade_delete_from_db_table(db_session, SuppressedEmail)

    @pytest.fixture(autouse=True)
    def user_with_email(self, db_session, user):
        return factories.LinkExternalUserFactory.create(user=user, email="test@example.com").user

    @pytest.fixture
    def notification_task(self, db_session):
        self.notification_config = EmailNotificationConfig()
        self.notification_config.reset_emails_without_sending = False
        self.notification_config.sync_suppressed_emails = False

        return OpportunityNotificationTask(db_session, self.notification_config)

    def test_email_notifications_collection(
        self,
        db_session,
        search_client,
        user,
        caplog,
        set_env_var_for_email_notification_config,
        notification_task,
    ):
        caplog.set_level(logging.INFO)

        """Test that latest opportunity version is collected for each saved opportunity"""
        # create a different user
        user_2 = factories.LinkExternalUserFactory.create().user

        # Create a saved opportunity that needs notification
        opp_1 = factories.OpportunityFactory.create(is_posted_summary=True)
        opp_2 = factories.OpportunityFactory.create(is_posted_summary=True)
        opp_3 = factories.OpportunityFactory.create(is_posted_summary=True)

        # create first versions for opps
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

        opp_1.current_opportunity_summary.opportunity_status = OpportunityStatus.CLOSED
        opp_2.current_opportunity_summary.opportunity_status = OpportunityStatus.ARCHIVED
        opp_3.current_opportunity_summary.opportunity_status = OpportunityStatus.FORECASTED

        # create new versions for opps
        factories.OpportunityVersionFactory.create(
            opportunity=opp_1, created_at=opp_1.created_at + timedelta(minutes=60)
        )
        opp_1_v_3 = factories.OpportunityVersionFactory.create(
            opportunity=opp_1, created_at=opp_1.created_at + timedelta(minutes=160)
        )
        opp_2_v_2 = factories.OpportunityVersionFactory.create(
            opportunity=opp_2, created_at=opp_2.created_at + timedelta(minutes=60)
        )
        factories.OpportunityVersionFactory.create(
            opportunity=opp_3, created_at=opp_3.created_at + timedelta(minutes=60)
        )
        opp_3_v_3 = factories.OpportunityVersionFactory.create(
            opportunity=opp_3, created_at=opp_3.created_at + timedelta(minutes=80)
        )

        _clear_mock_responses()

        results = notification_task._get_latest_opportunity_versions()

        # assert that only the latest version is picked up for each user_saved_opportunity
        assert len(results) == 4

        for user_saved_opp, latest_opp_ver in results:
            opp_id = user_saved_opp.opportunity_id

            if opp_id == opp_1.opportunity_id:
                assert latest_opp_ver.opportunity_id == opp_1_v_3.opportunity_id
            elif opp_id == opp_2.opportunity_id:
                assert latest_opp_ver.opportunity_id == opp_2_v_2.opportunity_id
            elif opp_id == opp_3.opportunity_id:
                assert latest_opp_ver.opportunity_id == opp_3_v_3.opportunity_id

        # Run the notification task
        task = EmailNotificationTask(
            db_session, search_client, notification_config=self.notification_config
        )
        task.run()

        # Verify notification log was created
        notification_logs = (
            db_session.query(UserNotificationLog)
            .filter(
                UserNotificationLog.notification_reason == NotificationReason.OPPORTUNITY_UPDATES
            )
            .all()
        )
        assert len(notification_logs) == 2
        assert {n.user_id for n in notification_logs} == {user.user_id, user_2.user_id}

        # Verify the log contains the correct metrics
        log_records = [
            r for r in caplog.records if "Successfully delivered notification to user" in r.message
        ]

        assert (
            len(
                [
                    log
                    for log in log_records
                    if log.__dict__["notification_reason"] == NotificationReason.OPPORTUNITY_UPDATES
                ]
            )
            == 2
        )

    def test_get_latest_opportunity_versions_deleted(
        self,
        db_session,
        search_client,
        user,
        set_env_var_for_email_notification_config,
        notification_task,
    ):
        """Test that the user notification does not pick up opportunities that have been marked as deleted"""
        opp = factories.OpportunityFactory.create(is_posted_summary=True)
        factories.UserSavedOpportunityFactory.create(user=user, opportunity=opp, is_deleted=True)
        factories.OpportunityVersionFactory.create(opportunity=opp)
        # Instantiate the task
        results = notification_task._get_latest_opportunity_versions()

        # assert deleted saved opportunity is not picked up
        assert len(results) == 0

    def test_with_no_user_email_notification(
        self, db_session, set_env_var_for_email_notification_config, notification_task
    ):
        """Test that no notification is collected if the user has no linked email address."""
        # Create a saved opportunity that needs notification
        opportunity = factories.OpportunityFactory.create(no_current_summary=True)
        factories.OpportunityVersionFactory.create(
            opportunity=opportunity,
        )
        factories.UserSavedOpportunityFactory.create(
            opportunity=opportunity,
        )
        factories.OpportunityVersionFactory.create(
            opportunity=opportunity,
        )

        results = notification_task.collect_email_notifications()

        assert len(results) == 0

    def test_with_no_relevant_notifications(
        self, db_session, user, set_env_var_for_email_notification_config, caplog, notification_task
    ):
        """Test that only relevant (tracked) changes to opportunities generate email notifications"""
        caplog.set_level(logging.INFO)
        # Create a saved opportunity that needs notification
        user_2 = factories.LinkExternalUserFactory.create(email="test@example.com").user

        opp_1 = factories.OpportunityFactory.create(no_current_summary=True)
        opp_2 = factories.OpportunityFactory.create(
            no_current_summary=True, category=OpportunityCategory.DISCRETIONARY
        )

        # First versions
        factories.OpportunityVersionFactory.create(
            opportunity=opp_1,
        )
        factories.OpportunityVersionFactory.create(
            opportunity=opp_2,
        )
        # Save opportunity
        factories.UserSavedOpportunityFactory.create(
            user=user,
            opportunity=opp_1,
        )
        factories.UserSavedOpportunityFactory.create(
            user=user_2,
            opportunity=opp_2,
        )

        # update fields
        opp_1.opportunity_title = None  # untracked
        opp_2.category = OpportunityCategory.MANDATORY
        # Second versions
        factories.OpportunityVersionFactory.create(
            opportunity=opp_1,
        )
        factories.OpportunityVersionFactory.create(
            opportunity=opp_2,
        )

        results = notification_task.collect_email_notifications()

        # assert only the change to Opportunity 2 is tracked and should result in a notification.
        assert len(results) == 1
        assert results[0].user_id == user_2.user_id

        # Verify the log captures non-relevant changes
        log_records = [
            r for r in caplog.records if "No relevant notifications found for user" in r.message
        ]

        assert len(log_records) == 1

    def test_with_no_prior_version_email_collections(
        self, db_session, user, set_env_var_for_email_notification_config, notification_task
    ):
        """Test that no notification log is created when no prior version exist"""
        opportunity = factories.OpportunityFactory.create(no_current_summary=True)
        factories.UserSavedOpportunityFactory.create(
            user=user,
            opportunity=opportunity,
        )

        results = notification_task.collect_email_notifications()

        assert len(results) == 0
        metrics = notification_task.metrics
        assert metrics[Metrics.VERSIONLESS_OPPORTUNITY_COUNT] == 1

    def test_with_no_prior_version_email_collections_with_latest_version(
        self, db_session, user, set_env_var_for_email_notification_config, caplog, notification_task
    ):
        """Test that no notification is created when a new version exists but no prior version exist"""
        opportunity = factories.OpportunityFactory.create(no_current_summary=True)
        factories.UserSavedOpportunityFactory.create(
            user=user,
            opportunity=opportunity,
        )
        factories.OpportunityVersionFactory.create(opportunity=opportunity)

        results = notification_task.collect_email_notifications()

        assert len(results) == 0
        # Verify the log contains the correct metrics
        log_records = [
            r
            for r in caplog.records
            if "No previous version found for this opportunity"
            and "No opportunities with prior versions for user" in r.message
        ]

        assert len(log_records) == 1

    def test_no_updates_email_collections(
        self, db_session, user, set_env_var_for_email_notification_config, notification_task
    ):
        """Test that no notification is collected when there are no opportunity updates."""
        opportunity = factories.OpportunityFactory.create(no_current_summary=True)
        version = factories.OpportunityVersionFactory.create(opportunity=opportunity)
        factories.UserSavedOpportunityFactory.create(
            user=user,
            opportunity=opportunity,
            last_notified_at=version.created_at + timedelta(minutes=1),
        )

        results = notification_task.collect_email_notifications()
        assert len(results) == 0

    def test_last_notified_version(
        self, db_session, user, set_env_var_for_email_notification_config, notification_task
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

        results = notification_task._get_last_notified_versions(
            [
                (user.user_id, opp.opportunity_id),
                (user_2.user_id, opp.opportunity_id),
            ]
        )

        assert results[user.user_id, opp.opportunity_id] == v_1
        assert results[user_2.user_id, opp.opportunity_id] == v_2

    @pytest.mark.parametrize(
        "diff_dict,expected_dict",
        [
            (
                # Single field with nested name
                [{"field": "a.b", "before": "new", "after": "old"}],
                {"b": {"before": "new", "after": "old"}},
            ),
            (
                # Multiple fields
                [
                    {"field": "a.b.c", "before": 123, "after": None},
                    {"field": "c.d", "before": True, "after": False},
                ],
                {"c": {"before": 123, "after": None}, "d": {"before": True, "after": False}},
            ),
            (
                # Flat field name
                [{"field": "a", "before": [], "after": [1]}],
                {"a": {"before": [], "after": [1]}},
            ),
        ],
    )
    def test_flatten_and_extract_field_changes(
        self,
        db_session,
        diff_dict,
        expected_dict,
        set_env_var_for_email_notification_config,
        notification_task,
    ):
        res = notification_task._flatten_and_extract_field_changes(diff_dict)

        assert res == expected_dict

    @pytest.mark.parametrize(
        "documents_diffs,expected_html",
        [
            (
                {
                    "opportunity_attachments": {
                        "before": None,
                        "after": [{"attachment_id": 2}],
                    }
                },
                '<p style="padding-left: 20px;">Documents</p><p style="padding-left: 40px;">•  One or more new documents were added.<br>',
            ),
            (
                {
                    "opportunity_attachments": {
                        "before": [{"attachment_id": 2}],
                        "after": [],
                    }
                },
                '<p style="padding-left: 20px;">Documents</p><p style="padding-left: 40px;">•  One or more new documents were removed.<br>',
            ),
            (
                {
                    "opportunity_attachments": {
                        "before": [{"attachment_id": 1}, {"attachment_id": 34}],
                        "after": [{"attachment_id": 2}],
                    }
                },
                '<p style="padding-left: 20px;">Documents</p><p style="padding-left: 40px;">•  One or more new documents were added.<br><p style="padding-left: 40px;">•  One or more new documents were removed.<br>',
            ),
            (
                {"additional_info_url": {"before": "grants.gov", "after": "simpler-grants.gov"}},
                '<p style="padding-left: 20px;">Documents</p><p style="padding-left: 40px;">•  A link to additional information was updated.<br>',
            ),
        ],
    )
    def test_build_documents_fields(
        self,
        db_session,
        documents_diffs,
        expected_html,
        set_env_var_for_email_notification_config,
        notification_task,
    ):
        res = notification_task._build_documents_fields(documents_diffs)

        assert res == expected_html

    @pytest.mark.parametrize(
        "opp_status_diffs,expected_html",
        [
            (
                {"before": OpportunityStatus.POSTED, "after": OpportunityStatus.CLOSED},
                '<p style="padding-left: 20px;">Status</p><p style="padding-left: 40px;">•  The status changed from Open to Closed.<br>',
            ),
            (
                {"before": OpportunityStatus.FORECASTED, "after": OpportunityStatus.ARCHIVED},
                '<p style="padding-left: 20px;">Status</p><p style="padding-left: 40px;">•  The status changed from Forecasted to Archived.<br>',
            ),
        ],
    )
    def test_build_opportunity_status_content(
        self,
        db_session,
        opp_status_diffs,
        expected_html,
        set_env_var_for_email_notification_config,
        notification_task,
    ):
        res = notification_task._build_opportunity_status_content(opp_status_diffs)

        assert res == expected_html

    @pytest.mark.parametrize(
        "imp_dates_diffs,opportunity_status,expected_html",
        [
            # close_date
            (
                {"close_date": {"before": "2035-10-10", "after": "2035-10-30"}},
                None,
                '<p style="padding-left: 20px;">Important dates</p><p style="padding-left: 40px;">•  The application due date changed from October 10, 2035 to October 30, 2035.<br>',
            ),
            (
                {"close_date": {"before": "2025-10-10", "after": None}},
                {"before": OpportunityStatus.POSTED, "after": OpportunityStatus.FORECASTED},
                '<p style="padding-left: 20px;">Important dates</p><p style="padding-left: 40px;">•  The application due date changed from October 10, 2025 to not specified.<br>',
            ),
            # forecasted_award_date
            (
                {"forecasted_award_date": {"before": "2030-1-6", "after": "2031-5-3"}},
                None,
                '<p style="padding-left: 20px;">Important dates</p><p style="padding-left: 40px;">•  The estimated award date changed from January 6, 2030 to May 3, 2031.<br>',
            ),
            (
                {"forecasted_award_date": {"before": None, "after": "2026-9-11"}},
                {"before": OpportunityStatus.POSTED, "after": OpportunityStatus.FORECASTED},
                '<p style="padding-left: 20px;">Important dates</p><p style="padding-left: 40px;">•  The estimated award date changed from not specified to September 11, 2026.<br>',
            ),
            # forecasted_project_start_date
            (
                {
                    "forecasted_project_start_date": {
                        "before": "2027-1-7",
                        "after": "2031-5-3",
                    }
                },
                None,
                '<p style="padding-left: 20px;">Important dates</p><p style="padding-left: 40px;">•  The estimated project start date changed from January 7, 2027 to May 3, 2031.<br>',
            ),
            (
                {"forecasted_project_start_date": {"before": None, "after": "2028-1-7"}},
                {"before": OpportunityStatus.POSTED, "after": OpportunityStatus.FORECASTED},
                '<p style="padding-left: 20px;">Important dates</p><p style="padding-left: 40px;">•  The estimated project start date changed from not specified to January 7, 2028.<br>',
            ),
            # fiscal_year
            (
                {"fiscal_year": {"before": 2050, "after": 2051}},
                None,
                '<p style="padding-left: 20px;">Important dates</p><p style="padding-left: 40px;">•  The fiscal year changed from 2050 to 2051.<br>',
            ),
            (
                {"fiscal_year": {"before": 2033, "after": None}},
                None,
                '<p style="padding-left: 20px;">Important dates</p><p style="padding-left: 40px;">•  The fiscal year changed from 2033 to not specified.<br>',
            ),
            (
                {"fiscal_year": {"before": 2033, "after": None}},
                {"before": OpportunityStatus.FORECASTED, "after": OpportunityStatus.POSTED},
                "",
            ),
            (
                {"forecasted_project_start_date": {"before": "2028-1-7", "after": "2029-1-7"}},
                {"before": OpportunityStatus.FORECASTED, "after": OpportunityStatus.CLOSED},
                "",
            ),
            (
                {"forecasted_award_date": {"before": "2025-10-7", "after": None}},
                {"before": OpportunityStatus.FORECASTED, "after": OpportunityStatus.ARCHIVED},
                "",
            ),
            (
                {
                    "forecasted_award_date": {"before": "2025-10-7", "after": None},
                    "close_date": {"before": "2035-10-10", "after": "2035-10-30"},
                },
                {"before": OpportunityStatus.FORECASTED, "after": OpportunityStatus.POSTED},
                '<p style="padding-left: 20px;">Important dates</p><p style="padding-left: 40px;">•  The application due date changed from October 10, 2035 to October 30, 2035.<br>',
            ),
        ],
    )
    def test_build_important_dates_content(
        self,
        db_session,
        imp_dates_diffs,
        opportunity_status,
        expected_html,
        set_env_var_for_email_notification_config,
        notification_task,
    ):
        res = notification_task._build_important_dates_content(imp_dates_diffs, opportunity_status)
        assert res == expected_html

    @pytest.mark.parametrize(
        "award_diffs,expected_html",
        [  # estimated_total_program_funding only
            (
                {"estimated_total_program_funding": {"before": 500_000, "after": None}},
                '<p style="padding-left: 20px;">Awards details</p><p style="padding-left: 40px;">•  Program funding changed from $500,000 to not specified.<br>',
            ),
            (
                {"expected_number_of_awards": {"before": None, "after": 3}},
                '<p style="padding-left: 20px;">Awards details</p><p style="padding-left: 40px;">•  The number of expected awards changed from not specified to 3.<br>',
            ),
            # multiple award fields
            (
                {
                    "award_floor": {"before": 500_000, "after": 200_000},
                    "award_ceiling": {"before": 1_000_000, "after": 500_000},
                },
                '<p style="padding-left: 20px;">Awards details</p><p style="padding-left: 40px;">•  The award minimum changed from $500,000 to $200,000.<br><p style="padding-left: 40px;">•  The award maximum changed from $1,000,000 to $500,000.<br>',
            ),
        ],
    )
    def test_build_award_fields_content(
        self,
        db_session,
        award_diffs,
        expected_html,
        set_env_var_for_email_notification_config,
        notification_task,
    ):
        res = notification_task._build_award_fields_content(award_diffs)

        assert res == expected_html

    @pytest.mark.parametrize(
        "category_diff,expected_html",
        [
            (
                {"is_cost_sharing": {"before": True, "after": None}},
                '<p style="padding-left: 20px;">Categorization</p><p style="padding-left: 40px;">•  Cost sharing or matching requirement has changed from Yes to not specified.<br>',
            ),
            (
                {
                    "funding_instruments": {
                        "before": [FundingInstrument.GRANT],
                        "after": [FundingInstrument.OTHER],
                    }
                },
                '<p style="padding-left: 20px;">Categorization</p><p style="padding-left: 40px;">•  The funding instrument type has changed from Grant to Other.<br>',
            ),
            (
                {"category": {"before": OpportunityCategory.OTHER, "after": None}},
                '<p style="padding-left: 20px;">Categorization</p><p style="padding-left: 40px;">•  The opportunity category has changed from Other to not specified.<br>',
            ),
            (
                {"category_explanation": {"before": None, "after": "to be determined"}},
                '<p style="padding-left: 20px;">Categorization</p><p style="padding-left: 40px;">•  Opportunity category explanation has changed from not specified to To be determined.<br>',
            ),
            # Skip category_explanation if Category changes from Other to any other category or none
            (
                {
                    "category": {
                        "before": OpportunityCategory.OTHER,
                        "after": OpportunityCategory.MANDATORY,
                    },
                    "category_explanation": {"before": "to be determined", "after": None},
                },
                '<p style="padding-left: 20px;">Categorization</p><p style="padding-left: 40px;">•  The opportunity category has changed from Other to Mandatory.<br>',
            ),
            (
                {
                    "category": {"before": OpportunityCategory.OTHER, "after": None},
                    "category_explanation": {"before": "to be determined", "after": None},
                },
                '<p style="padding-left: 20px;">Categorization</p><p style="padding-left: 40px;">•  The opportunity category has changed from Other to not specified.<br>',
            ),
            (
                {
                    "category": {
                        "before": OpportunityCategory.DISCRETIONARY,
                        "after": OpportunityCategory.OTHER,
                    },
                    "category_explanation": {"before": None, "after": "To be determined"},
                },
                '<p style="padding-left: 20px;">Categorization</p>'
                '<p style="padding-left: 40px;">•  The opportunity category has changed from Discretionary to Other.<br>'
                '<p style="padding-left: 40px;">•  Opportunity category explanation has changed from not specified to To be determined.<br>',
            ),
            (
                {
                    "funding_categories": {
                        "before": [FundingCategory.OPPORTUNITY_ZONE_BENEFITS],
                        "after": [FundingCategory.OTHER],
                    }
                },
                '<p style="padding-left: 20px;">Categorization</p><p style="padding-left: 40px;">•  The category of funding activity has changed from Opportunity zone benefits to Other.<br>',
            ),
            # Skip category_explanation if funding_categories changes from Other to any other category or none
            (
                {
                    "funding_categories": {
                        "before": [FundingCategory.OTHER],
                        "after": [FundingCategory.ENERGY],
                    },
                    "funding_category_description": {"before": "to be determined", "after": None},
                },
                '<p style="padding-left: 20px;">Categorization</p><p style="padding-left: 40px;">•  The category of funding activity has changed from Other to Energy.<br>',
            ),
            (
                {
                    "funding_categories": {
                        "before": [FundingCategory.EDUCATION],
                        "after": [FundingCategory.OTHER],
                    },
                    "funding_category_description": {"before": None, "after": "To be determined"},
                },
                '<p style="padding-left: 20px;">Categorization</p>'
                '<p style="padding-left: 40px;">•  The category of funding activity has changed from Education to Other.<br>'
                '<p style="padding-left: 40px;">•  The funding activity category explanation has been changed from not specified to To be determined.<br>',
            ),
        ],
    )
    def test_build_categorization_fields_content(
        self,
        db_session,
        category_diff,
        expected_html,
        set_env_var_for_email_notification_config,
        notification_task,
    ):
        res = notification_task._build_categorization_fields_content(category_diff)
        assert res == expected_html

    @pytest.mark.parametrize(
        "contact_diffs,expected_html",
        [
            (
                {"agency_email_address": {"before": None, "after": "contact@simpler.gov"}},
                '<p style="padding-left: 20px;">Grantor contact information</p>'
                '<p style="padding-left: 40px;">•  The updated email address is contact@simpler.gov.<br>',
            ),
            (
                {
                    "agency_contact_description": {
                        "before": "Email customer service for any enquiries",
                        "after": None,
                    }
                },
                '<p style="padding-left: 20px;">Grantor contact information</p><p style="padding-left: 40px;">•  New description: not specified.<br>',
            ),  # Truncate
            (
                {
                    "agency_contact_description": {
                        "before": None,
                        "after": "For additional information about this funding opportunity, please reach out to the Program Office by emailing researchgrants@exampleagency.gov or calling 1-800-555-0199.\n Assistance is available Monday through Friday, 8:30 AM–5:00 PM ET, excluding weekends and federal holidays.",
                    }
                },
                '<p style="padding-left: 20px;">Grantor contact information</p><p style="padding-left: 40px;">•  New description: For additional information about this funding opportunity, please reach out to the Program Office by emailing researchgrants@exampleagency.gov or calling 1-800-555-0199.<br> Assistance is available Monday through Friday, 8:30 AM–5:00 PM ET, excluding...<br>',
            ),
        ],
    )
    def test_build_grantor_contact_fields_content(
        self,
        db_session,
        contact_diffs,
        expected_html,
        set_env_var_for_email_notification_config,
        notification_task,
    ):
        res = notification_task._build_grantor_contact_fields_content(contact_diffs)
        assert res == expected_html
        assert res == expected_html

    @pytest.mark.parametrize(
        "eligibility_diffs,expected_html",
        [
            # Removed and Added type
            (
                {
                    "applicant_types": {
                        "before": [
                            ApplicantType.PUBLIC_AND_STATE_INSTITUTIONS_OF_HIGHER_EDUCATION,
                            ApplicantType.OTHER,
                        ],
                        "after": [ApplicantType.STATE_GOVERNMENTS],
                    }
                },
                '<p style="padding-left: 20px;">Eligibility</p>'
                '<p style="padding-left: 40px;">•  Additional eligibility criteria include: [State governments].<br>'
                '<p style="padding-left: 40px;">•  Removed eligibility criteria include: [Other, Public and state institutions of higher education].<br>',
            ),
            # Add
            (
                {"applicant_eligibility_description": {"before": None, "after": "not decided"}},
                '<p style="padding-left: 20px;">Eligibility</p><p style="padding-left: 40px;">•  Additional information was added.<br>',
            ),
            # Update
            (
                {
                    "applicant_eligibility_description": {
                        "before": "business and personal ",
                        "after": "business only",
                    }
                },
                '<p style="padding-left: 20px;">Eligibility</p><p style="padding-left: 40px;">•  Additional information was changed.<br>',
            ),
            # Delete
            (
                {"applicant_eligibility_description": {"before": "Business", "after": None}},
                '<p style="padding-left: 20px;">Eligibility</p><p style="padding-left: 40px;">•  Additional information was deleted.<br>',
            ),
        ],
    )
    def test_build_eligibility_content(
        self,
        db_session,
        eligibility_diffs,
        expected_html,
        set_env_var_for_email_notification_config,
        notification_task,
    ):

        res = notification_task._build_eligibility_content(eligibility_diffs)

        assert res == expected_html

    @pytest.mark.parametrize(
        "description_diffs,expected_html",
        [
            ({"before": "testing", "after": None}, ""),
            # Truncate
            (
                {
                    "before": "testing",
                    "after": "The Climate Innovation Research Grant supports groundbreaking projects aimed at reducing greenhouse gas emissions through renewable energy, sustainable agriculture, and carbon capture technologies. Open to institutions, nonprofits, and private entities.",
                },
                '<p style="padding-left: 20px;">Description</p><p style="padding-left: 40px;">•  <i>New Description:</i><div style="padding-left: 40px;">The Climate Innovation Research Grant supports groundbreaking projects aimed at reducing greenhouse gas emissions through renewable energy, sustainable agriculture, and carbon capture technologies. Open to institutions, nonprofits, and private entiti<a href="http://testhost:3000/opportunity/7f3c6a9e-4d2b-4e3a-9a7f-8c4c9f5d2b61" style="color:blue;">...Read full description</a></div><br>',
            ),
            # Truncate with html tag
            (
                {
                    "before": "testing",
                    "after": '<p> The <strong>Climate Innovation Research Grant</strong> supports groundbreaking projects aimed at reducing <em>greenhouse gas</em> emissions through <a href="https://example.org/renewables">renewable energy</a>,<strong class="highlight"> sustainable agriculture</strong>, and <u>carbon capture technologies</u>. Open to institutions, nonprofits, and private entities.</p>',
                },
                '<p style="padding-left: 20px;">Description</p><p style="padding-left: 40px;">•  <i>New Description:</i><div style="padding-left: 40px;"><p> The <strong>Climate Innovation Research Grant</strong> supports groundbreaking projects aimed at reducing <em>greenhouse gas</em> emissions through <a href="https://example.org/renewables">renewable energy</a>,<strong class="highlight"> sustainable agriculture</strong>, and <u>carbon capture technologies</u>. Open to institutions, nonprofits, and private entit<a href="http://testhost:3000/opportunity/7f3c6a9e-4d2b-4e3a-9a7f-8c4c9f5d2b61" style="color:blue;">...Read full description</a></p></div><br>',
            ),
        ],
    )
    def test_build_description_fields_content(
        self,
        db_session,
        description_diffs,
        expected_html,
        set_env_var_for_email_notification_config,
        notification_task,
    ):
        op_id = UUID("7f3c6a9e-4d2b-4e3a-9a7f-8c4c9f5d2b61")
        res = notification_task._build_description_fields_content(description_diffs, op_id)
        assert res == expected_html

    @pytest.mark.parametrize(
        "version_change,expected_html",
        [
            # Status update
            (
                OpportunityVersionChange(
                    opportunity_id=OPAL.opportunity_id, previous=OPAL, latest=OPAL_STATUS
                ),
                '<p style="padding-left: 20px;">Status</p><p style="padding-left: 40px;">•  The status changed from Open to Closed.<br>',
            ),
            # Update non-tracked field
            (
                (
                    OpportunityVersionChange(
                        opportunity_id=OPAL.opportunity_id, previous=OPAL, latest=OPAL_REVISION_NUMB
                    ),
                    "",
                )
            ),
        ],
    )
    def test_build_sections(
        self,
        db_session,
        version_change,
        expected_html,
        set_env_var_for_email_notification_config,
        notification_task,
    ):
        res = notification_task._build_sections(version_change)
        assert res == expected_html

    @pytest.mark.parametrize(
        "version_changes,expected",
        [
            # Multiple updates
            (
                [
                    OpportunityVersionChange(
                        opportunity_id=OPAL.opportunity_id, previous=OPAL, latest=OPAL_STATUS
                    ),
                    OpportunityVersionChange(
                        opportunity_id=TOPAZ.opportunity_id, previous=TOPAZ, latest=TOPAZ_STATUS
                    ),
                ],
                UserOpportunityUpdateContent(
                    subject="Your saved funding opportunities changed on Simpler.Grants.gov",
                    message=(
                        f"The following funding opportunities recently changed:<br><br><div>1. <a href='http://testhost:3000/opportunity/{OPAL.opportunity_id}{UTM_TAG}' target='_blank'>Opal 2025 Awards</a><br><br>Here’s what changed:</div>"
                        '<p style="padding-left: 20px;">Status</p><p style="padding-left: 40px;">•  The status changed from Open to Closed.<br>'
                        f"<div>2. <a href='http://testhost:3000/opportunity/{TOPAZ.opportunity_id}{UTM_TAG}' target='_blank'>Topaz 2025 Climate Research Grant</a><br><br>Here’s what changed:</div>"
                        '<p style="padding-left: 20px;">Status</p><p style="padding-left: 40px;">•  The status changed from Forecasted to Closed.<br>'
                        "<div><strong>Please carefully read the opportunity listing pages to review all changes.</strong><br><br>"
                        f"<a href='http://testhost:3000{UTM_TAG}' target='_blank' style='color:blue;'>Sign in to Simpler.Grants.gov to manage your saved opportunities.</a></div>"
                        "<div>If you have questions, please contact the Grants.gov Support Center:<br><br><a href='mailto:support@grants.gov'>support@grants.gov</a><br>1-800-518-4726<br>24 hours a day, 7 days a week<br>Closed on federal holidays</div>"
                    ),
                    updated_opportunity_ids=[OPAL.opportunity_id, TOPAZ.opportunity_id],
                ),
            ),
            # Relevant & none Relevant updates mix
            (
                [  # No relevant updates
                    OpportunityVersionChange(
                        opportunity_id=OPAL.opportunity_id, previous=OPAL, latest=OPAL_REVISION_NUMB
                    ),
                    OpportunityVersionChange(
                        opportunity_id=TOPAZ.opportunity_id, previous=TOPAZ, latest=TOPAZ_STATUS
                    ),
                ],
                UserOpportunityUpdateContent(
                    subject="Your saved funding opportunity changed on Simpler.Grants.gov",
                    message=(
                        f"The following funding opportunity recently changed:<br><br><div>1. <a href='http://testhost:3000/opportunity/{TOPAZ.opportunity_id}{UTM_TAG}' target='_blank'>Topaz 2025 Climate Research Grant</a><br><br>Here’s what changed:</div>"
                        '<p style="padding-left: 20px;">Status</p><p style="padding-left: 40px;">•  The status changed from Forecasted to Closed.<br>'
                        "<div><strong>Please carefully read the opportunity listing pages to review all changes.</strong><br><br>"
                        f"<a href='http://testhost:3000{UTM_TAG}' target='_blank' style='color:blue;'>Sign in to Simpler.Grants.gov to manage your saved opportunities.</a></div>"
                        "<div>If you have questions, please contact the Grants.gov Support Center:<br><br><a href='mailto:support@grants.gov'>support@grants.gov</a><br>1-800-518-4726<br>24 hours a day, 7 days a week<br>Closed on federal holidays</div>"
                    ),
                    updated_opportunity_ids=[TOPAZ.opportunity_id],
                ),
            ),
            # None relevant updates only
            (
                [
                    OpportunityVersionChange(
                        opportunity_id=OPAL.opportunity_id, previous=OPAL, latest=OPAL_REVISION_NUMB
                    ),
                ],
                None,
            ),
        ],
    )
    def test_build_notification_content(
        self,
        db_session,
        version_changes,
        expected,
        set_env_var_for_email_notification_config,
        notification_task,
    ):
        res = notification_task._build_notification_content(version_changes)

        assert res == expected

    def test_build_notification_content_all_changes(
        self,
        db_session,
        enable_factory_create,
        set_env_var_for_email_notification_config,
        notification_task,
    ):
        TOPZ_ALL = build_opp_and_version(
            revision_number=2,
            opportunity_title="Topaz 2025 Climate Research Grant",
            opportunity_status=OpportunityStatus.CLOSED,
            close_date=None,
            forecasted_award_date=date(2026, 3, 15),
            forecasted_project_start_date=date(2026, 5, 1),
            fiscal_year=2026,
            estimated_total_program_funding=12_000_000,
            expected_number_of_awards=5,
            award_floor=200_000,
            award_ceiling=3_000_000,
            is_cost_sharing=False,
            funding_instruments=[FundingInstrument.GRANT],
            category=OpportunityCategory.DISCRETIONARY,
            category_explanation="Focus on clean energy startups and demonstration projects",
            funding_categories=[FundingCategory.ENERGY],
            funding_category_description="Accelerates early-stage renewable energy technology adoption",
            agency_email_address="john.smith@gmail.com",
            agency_contact_description="grant manager",
            applicant_types=[ApplicantType.PUBLIC_AND_STATE_INSTITUTIONS_OF_HIGHER_EDUCATION],
            applicant_eligibility_description="Charter Schools only",
            additional_info_url="simpler-grants.gov",
            summary_description="Climate research in mars",
            has_attachments=True,
            db_session=enable_factory_create,
        )

        expected = UserOpportunityUpdateContent(
            subject="Your saved funding opportunity changed on Simpler.Grants.gov",
            message=(
                f"The following funding opportunity recently changed:<br><br><div>1. <a href='http://testhost:3000/opportunity/{TOPAZ.opportunity_id}{UTM_TAG}' target='_blank'>Topaz 2025 Climate Research Grant</a><br><br>Here’s what changed:</div>"
                '<p style="padding-left: 20px;">Status</p><p style="padding-left: 40px;">•  The status changed from Forecasted to Closed.<br><br>'
                '<p style="padding-left: 20px;">Important dates</p><p style="padding-left: 40px;">•  The application due date changed from November 30, 2025 to not specified.<br><br>'
                '<p style="padding-left: 20px;">Awards details</p><p style="padding-left: 40px;">•  Program funding changed from $10,000,000 to $12,000,000.<br>'
                '<p style="padding-left: 40px;">•  The number of expected awards changed from 7 to 5.<br>'
                '<p style="padding-left: 40px;">•  The award minimum changed from $100,000 to $200,000.<br>'
                '<p style="padding-left: 40px;">•  The award maximum changed from $2,500,000 to $3,000,000.<br><br>'
                '<p style="padding-left: 20px;">Categorization</p><p style="padding-left: 40px;">•  Cost sharing or matching requirement has changed from Yes to No.<br>'
                '<p style="padding-left: 40px;">•  The funding instrument type has changed from Grant, Cooperative agreement to Grant.<br>'
                '<p style="padding-left: 40px;">•  The opportunity category has changed from Mandatory to Discretionary.<br>'
                '<p style="padding-left: 40px;">•  The category of funding activity has changed from Science technology and other research and development, Environment to Energy.<br><br>'
                '<p style="padding-left: 20px;">Grantor contact information</p><p style="padding-left: 40px;">•  The updated email address is john.smith@gmail.com.<br>'
                '<p style="padding-left: 40px;">•  New description: grant manager.<br><br>'
                '<p style="padding-left: 20px;">Eligibility</p><p style="padding-left: 40px;">•  Additional eligibility criteria include: [Public and state institutions of higher education].<br>'
                '<p style="padding-left: 40px;">•  Removed eligibility criteria include: [Public and indian housing authorities].<br>'
                '<p style="padding-left: 40px;">•  Additional information was changed.<br><br>'
                '<p style="padding-left: 20px;">Documents</p><p style="padding-left: 40px;">•  A link to additional information was updated.<br><br>'
                '<p style="padding-left: 20px;">Description</p><p style="padding-left: 40px;">•  <i>New Description:</i><div style="padding-left: 40px;">Climate research in mars</div><br>'
                "<div><strong>Please carefully read the opportunity listing pages to review all changes.</strong><br><br>"
                f"<a href='http://testhost:3000{UTM_TAG}' target='_blank' style='color:blue;'>Sign in to Simpler.Grants.gov to manage your saved opportunities.</a></div>"
                "<div>If you have questions, please contact the Grants.gov Support Center:<br><br><a href='mailto:support@grants.gov'>support@grants.gov</a><br>1-800-518-4726<br>24 hours a day, 7 days a week<br>Closed on federal holidays</div>"
            ),
            updated_opportunity_ids=[TOPAZ.opportunity_id],
        )

        res = notification_task._build_notification_content(
            [
                OpportunityVersionChange(
                    opportunity_id=TOPAZ.opportunity_id, previous=TOPAZ, latest=TOPZ_ALL
                )
            ]
        )

        assert res == expected

    def test_get_latest_opportunity_versions_suppressed(
        self,
        db_session,
        enable_factory_create,
        set_env_var_for_email_notification_config,
        notification_task,
        user,
    ):
        """Test that the user notification does not pick up user on suppression_list"""
        # create opportunity
        opp = factories.OpportunityFactory.create(is_posted_summary=True)

        # create a saved opp with suppressed user
        suppressed_user = UserFactory.create()
        factories.LinkExternalUserFactory.create(user=suppressed_user, email="testing@example.com")

        factories.SuppressedEmailFactory(email=suppressed_user.email)
        factories.UserSavedOpportunityFactory.create(
            user=suppressed_user,
            opportunity=opp,
        )
        # Create a different user with the same saved opportunity
        factories.UserSavedOpportunityFactory.create(
            user=user,
            opportunity=opp,
        )
        factories.OpportunityVersionFactory.create(opportunity=opp)

        # Instantiate the task
        results = notification_task._get_latest_opportunity_versions()

        # Assert correct user saved opportunity is returned
        assert len(results) == 1
        assert results[0][0].user_id == user.user_id
