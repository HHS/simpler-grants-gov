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
from src.db.models.opportunity_models import Opportunity, OpportunityVersion
from src.db.models.user_models import UserNotificationLog, UserSavedOpportunity
from src.task.notifications.config import EmailNotificationConfig
from src.task.notifications.constants import (
    Metrics,
    NotificationReason,
    OpportunityVersionChange,
    UserOpportunityUpdateContent,
)
from src.task.notifications.email_notification import EmailNotificationTask
from src.task.notifications.opportunity_notifcation import OpportunityNotificationTask
from tests.lib.db_testing import cascade_delete_from_db_table


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
) -> OpportunityVersion:
    opportunity = factories.OpportunityFactory.build(
        opportunity_title=opportunity_title,
        current_opportunity_summary=None,
        category=category,
        category_explanation=category_explanation,
        revision_number=revision_number,
    )

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
    )

    opportunity.current_opportunity_summary = factories.CurrentOpportunitySummaryFactory.build(
        opportunity_status=opportunity_status,
        opportunity_summary=opportunity_summary,
        opportunity=opportunity,
    )

    version = factories.OpportunityVersionFactory.build(opportunity=opportunity)

    return version


OPAL_V1 = build_opp_and_version(
    revision_number=1,
    opportunity_title="Opal 2025 award",
    opportunity_status=OpportunityStatus.POSTED,
    close_date=date(2026, 9, 1),
    forecasted_award_date=None,
    forecasted_project_start_date=None,
    fiscal_year=None,
    estimated_total_program_funding=15_000_000,
    expected_number_of_awards=3,
    award_floor=50_000,
    award_ceiling=5_000_000,
    is_cost_sharing=True,
    funding_instruments=[FundingInstrument.COOPERATIVE_AGREEMENT],
    category=None,
    category_explanation=None,
    funding_categories=[FundingCategory.EDUCATION],
    funding_category_description=None,
)

OPAL_V2 = build_opp_and_version(
    revision_number=1,
    opportunity_title="Opal 2025 Awards",
    opportunity_status=OpportunityStatus.CLOSED,
    close_date=date(2026, 10, 15),
    forecasted_award_date=date(2026, 12, 1),
    forecasted_project_start_date=date(2027, 1, 15),
    fiscal_year=2026,
    estimated_total_program_funding=20_000_000,
    expected_number_of_awards=5,
    award_floor=100_000,
    award_ceiling=6_000_000,
    is_cost_sharing=False,
    funding_instruments=[FundingInstrument.GRANT],
    category=OpportunityCategory.DISCRETIONARY,
    category_explanation="Supports education innovation",
    funding_categories=[FundingCategory.HEALTH],
    funding_category_description="Health and wellness-related initiatives",
)
OPAL_V3 = build_opp_and_version(
    revision_number=2,  # non-tracked field
    opportunity_title="Opal 2025 award",
    opportunity_status=OpportunityStatus.POSTED,
    close_date=date(2026, 9, 1),
    forecasted_award_date=None,
    forecasted_project_start_date=None,
    fiscal_year=None,
    estimated_total_program_funding=15_000_000,
    expected_number_of_awards=3,
    award_floor=50_000,
    award_ceiling=5_000_000,
    is_cost_sharing=True,
    funding_instruments=[FundingInstrument.COOPERATIVE_AGREEMENT],
    category=None,
    category_explanation=None,
    funding_categories=[FundingCategory.EDUCATION],
    funding_category_description=None,
)

TOPAZ_V1 = build_opp_and_version(
    revision_number=0,
    opportunity_title="Topaz 2025 Climate Research Grant",
    opportunity_status=OpportunityStatus.FORECASTED,
    close_date=date(2025, 11, 30),
    forecasted_award_date=date(2026, 2, 1),
    forecasted_project_start_date=date(2026, 4, 15),
    fiscal_year=2025,
    estimated_total_program_funding=10_000_000,
    expected_number_of_awards=7,
    award_floor=100_000,
    award_ceiling=2_500_000,
    is_cost_sharing=True,
    funding_instruments=[
        FundingInstrument.GRANT,
        FundingInstrument.COOPERATIVE_AGREEMENT,
    ],
    category=OpportunityCategory.MANDATORY,
    category_explanation="Required under federal climate initiative mandate",
    funding_categories=[
        FundingCategory.SCIENCE_TECHNOLOGY_AND_OTHER_RESEARCH_AND_DEVELOPMENT,
        FundingCategory.ENVIRONMENT,
    ],
    funding_category_description="Supports research in climate modeling and adaptation",
)
TOPAZ_V2 = build_opp_and_version(
    revision_number=2,
    opportunity_title="Topaz 2026 Renewable Energy Grant",
    opportunity_status=OpportunityStatus.CLOSED,
    close_date=date(2025, 12, 31),
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
    category_explanation="Focus on clean energy startups and demonstration projects",  # New explanation
    funding_categories=[FundingCategory.ENERGY],
    funding_category_description="Accelerates early-stage renewable energy technology adoption",  # New description
)


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
        enable_factory_create,
        user,
        user_with_email,
        caplog,
        email_notification_task,
    ):
        """Test that latest opportunity version is collected for each saved opportunity"""
        # create a different user
        user_2 = factories.LinkExternalUserFactory.create(email="test@example.com").user

        # Create a saved opportunity that needs notification
        opp_1 = factories.OpportunityFactory.create(is_posted_summary=True)
        opp_2 = factories.OpportunityFactory.create(is_posted_summary=True)
        opp_3 = factories.OpportunityFactory.create(is_posted_summary=True)

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

        opp_1.current_opportunity_summary.opportunity_status = OpportunityStatus.CLOSED
        opp_2.current_opportunity_summary.opportunity_status = OpportunityStatus.ARCHIVED
        opp_3.current_opportunity_summary.opportunity_status = OpportunityStatus.FORECASTED

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
        db_session,
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
        db_session,
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
        db_session,
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
        db_session,
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

    @pytest.mark.parametrize(
        "diff_dict,expected_dict",
        [
            (
                # qSingle field with nested name
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
        self, db_session, diff_dict, expected_dict, email_notification_task
    ):
        # Instantiate the task
        task = OpportunityNotificationTask(db_session=db_session)
        res = task._flatten_and_extract_field_changes(diff_dict)

        assert res == expected_dict

    @pytest.mark.parametrize(
        "opp_status_diffs,expected_html",
        [
            (
                {"before": OpportunityStatus.POSTED, "after": OpportunityStatus.CLOSED},
                '<p style="margin-left: 20px;">Status</p><p style="margin-left: 40px;">•  The status changed from Open to Closed.<br>',
            ),
            (
                {"before": OpportunityStatus.FORECASTED, "after": OpportunityStatus.ARCHIVED},
                '<p style="margin-left: 20px;">Status</p><p style="margin-left: 40px;">•  The status changed from Forecasted to Archived.<br>',
            ),
        ],
    )
    def test_build_opportunity_status_content(
        self, db_session, opp_status_diffs, expected_html, email_notification_task
    ):
        # Instantiate the task
        task = OpportunityNotificationTask(db_session=db_session)
        res = task._build_opportunity_status_content(opp_status_diffs)

        assert res == expected_html

    @pytest.mark.parametrize(
        "imp_dates_diffs,expected_html",
        [
            # close_date
            (
                {"close_date": {"before" : date(2035, 10, 10), "after" : date(2035, 10, 30)}},
                '<p style="margin-left: 20px;">Important dates</p><p style="margin-left: 40px;">•  The application due date changed from October 10, 2035 to October 30, 2035.<br>'
            ),
            (
                {"close_date": {"before": date(2025, 10, 10), "after": None}},
                '<p style="margin-left: 20px;">Important dates</p><p style="margin-left: 40px;">•  The application due date changed from October 10, 2025 to None.<br>'
            ),
            # forecasted_award_date
            (
                {"forecasted_award_date": {"before": date(2030, 1, 6), "after": date(2031, 5, 3)}},
                '<p style="margin-left: 20px;">Important dates</p><p style="margin-left: 40px;">•  The estimated award date changed from January 6, 2030 to May 3, 2031.<br>'
            ),
            (
                {"forecasted_award_date": {"before": None, "after":  date(2026, 9, 11)}},
                '<p style="margin-left: 20px;">Important dates</p><p style="margin-left: 40px;">•  The estimated award date changed from None to September 11, 2026.<br>'
            ),
            # forecasted_project_start_date
                (
                {"forecasted_project_start_date": {"before": date(2027, 1, 7), "after": date(2031, 5, 3)}},
                '<p style="margin-left: 20px;">Important dates</p><p style="margin-left: 40px;">•  The estimated project start date changed from January 7, 2027 to May 3, 2031.<br>'
            ),
            (
                    {"forecasted_project_start_date": {"before": None, "after": date(2028, 1, 7)}},
                    '<p style="margin-left: 20px;">Important dates</p><p style="margin-left: 40px;">•  The estimated project start date changed from None to January 7, 2028.<br>'
            ),
            # fiscal_year
                (
                {"fiscal_year": {"before": 2050, "after": 2051}},
                '<p style="margin-left: 20px;">Important dates</p><p style="margin-left: 40px;">•  The fiscal year changed from 2050 to 2051.<br>'
            ),
            (
                    {"fiscal_year": {"before": 2033, "after": None}},
                    '<p style="margin-left: 20px;">Important dates</p><p style="margin-left: 40px;">•  The fiscal year changed from 2033 to None.<br>'
            )

        ]
    )
    def test_build_important_dates_content(
            self,
            db_session,
            email_notification_task,
            imp_dates_diffs,
            expected_html
    ):
        # Instantiate the task
        task = OpportunityNotificationTask(db_session=db_session)
        res = task._build_important_dates_content(imp_dates_diffs)

        assert res == expected_html

    @pytest.mark.parametrize(
        "version_change,expected_html",
        [
            (
                OpportunityVersionChange(
                    opportunity_id=OPAL_V1.opportunity_id, previous=OPAL_V1, latest=OPAL_V2
                ),
                '<p style="margin-left: 20px;">Status</p><p style="margin-left: 40px;">•  The status changed from Open to Closed.<br>',
            ),
            # Update non-tracked field
            (
                (
                    OpportunityVersionChange(
                        opportunity_id=OPAL_V1.opportunity_id, previous=OPAL_V1, latest=OPAL_V3
                    ),
                    "",
                )
            ),
        ],
    )
    def test_build_sections(
        self, email_notification_task, db_session, version_change, expected_html
    ):
        # Instantiate the task
        task = OpportunityNotificationTask(db_session=db_session)
        res = task._build_sections(version_change)
        assert res == expected_html

    @pytest.mark.parametrize(
        "version_changes,expected_html",
        [
            # # Multiple updates
            (
                [
                    OpportunityVersionChange(
                        opportunity_id=OPAL_V1.opportunity_id, previous=OPAL_V1, latest=OPAL_V2
                    ),
                    OpportunityVersionChange(
                        opportunity_id=TOPAZ_V1.opportunity_id, previous=TOPAZ_V1, latest=TOPAZ_V2
                    ),
                ],
                UserOpportunityUpdateContent(
                    subject="Your saved funding opportunities changed on <a href='None' target='_blank' style='color:blue;'>Simpler.Grants.gov</a>",
                    message=f"The following funding opportunities recently changed:<br><br><div>1. <a href='None/opportunity/{OPAL_V1.opportunity_id}' target='_blank'>Opal 2025 award</a><br><br>Here’s what changed:</div><p style=\"margin-left: 20px;\">Status</p><p style=\"margin-left: 40px;\">•  The status changed from Open to Closed.<br><div>2. <a href='None/opportunity/{TOPAZ_V1.opportunity_id}' target='_blank'>Topaz 2025 Climate Research Grant</a><br><br>Here’s what changed:</div><p style=\"margin-left: 20px;\">Status</p><p style=\"margin-left: 40px;\">•  The status changed from Forecasted to Closed.<br><div><strong>Please carefully read the opportunity listing pages to review all changes.</strong> <br><br><a href='None' target='_blank' style='color:blue;'>Sign in to Simpler.Grants.gov to manage your saved opportunities.</a></div><div>If you have questions, please contact the Grants.gov Support Center:<br><br><a href='mailto:support@grants.gov'>support@grants.gov</a><br>1-800-518-4726<br>24 hours a day, 7 days a week<br>Closed on federal holidays</div>",
                    updated_opportunity_ids=[OPAL_V1.opportunity_id, TOPAZ_V1.opportunity_id],
                ),
            ),
            # Relevant & none Relevant updates mix
            (
                [
                    OpportunityVersionChange(
                        opportunity_id=OPAL_V1.opportunity_id, previous=OPAL_V1, latest=OPAL_V3
                    ),  # No relevant updates
                    OpportunityVersionChange(
                        opportunity_id=TOPAZ_V1.opportunity_id, previous=TOPAZ_V1, latest=TOPAZ_V2
                    ),
                ],
                UserOpportunityUpdateContent(
                    subject="Your saved funding opportunity changed on <a href='None' target='_blank' style='color:blue;'>Simpler.Grants.gov</a>",
                    message=f"The following funding opportunity recently changed:<br><br><div>1. <a href='None/opportunity/{TOPAZ_V1.opportunity_id}' target='_blank'>Topaz 2025 Climate Research Grant</a><br><br>Here’s what changed:</div><p style=\"margin-left: 20px;\">Status</p><p style=\"margin-left: 40px;\">•  The status changed from Forecasted to Closed.<br><div><strong>Please carefully read the opportunity listing pages to review all changes.</strong> <br><br><a href='None' target='_blank' style='color:blue;'>Sign in to Simpler.Grants.gov to manage your saved opportunities.</a></div><div>If you have questions, please contact the Grants.gov Support Center:<br><br><a href='mailto:support@grants.gov'>support@grants.gov</a><br>1-800-518-4726<br>24 hours a day, 7 days a week<br>Closed on federal holidays</div>",
                    updated_opportunity_ids=[TOPAZ_V1.opportunity_id],
                ),
            ),
            # None relevant updates only
            (
                [
                    OpportunityVersionChange(
                        opportunity_id=OPAL_V1.opportunity_id, previous=OPAL_V1, latest=OPAL_V3
                    ),
                ],
                None,
            ),
        ],
    )
    def test_build_notification_content(
        self,
        db_session,
        enable_factory_create,
        user,
        email_notification_task,
        version_changes,
        expected_html,
    ):
        # Instantiate the task
        task = OpportunityNotificationTask(db_session=db_session)
        res = task._build_notification_content(version_changes)

        assert res == expected_html
