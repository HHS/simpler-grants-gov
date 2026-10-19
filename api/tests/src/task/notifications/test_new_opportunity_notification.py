from datetime import date, timedelta

import pytest
from sqlalchemy import delete, select

import src.task.notifications.new_opportunity_notification as new_opportunity_notification
import tests.src.db.models.factories as factories
from src.constants.lookup_constants import (
    JobStatus,
    NotificationQueueStatus,
    NotificationType,
    OpportunityStatus,
)
from src.db.models.opportunity_models import OpportunityVersion
from src.db.models.task_models import JobLog
from src.db.models.user_models import (
    NotificationJobContent,
    NotificationQueue,
    UserNotificationPreference,
)
from src.task.notifications.config import EmailNotificationConfig
from src.task.notifications.constants import NOTIFICATION_TYPE_DEFAULTS
from src.task.notifications.new_opportunity_notification import (
    NewOpportunityNotificationTask,
    build_email_body,
    build_subject,
)
from src.util import datetime_util

TASK_NAME = NewOpportunityNotificationTask.__name__


@pytest.fixture(autouse=True)
def clear_data(db_session):
    db_session.execute(delete(NotificationQueue))
    db_session.execute(delete(NotificationJobContent))
    db_session.execute(delete(JobLog).where(JobLog.job_type == TASK_NAME))
    db_session.execute(delete(UserNotificationPreference))
    db_session.execute(delete(OpportunityVersion))
    db_session.commit()


@pytest.fixture
def notification_config():
    config = EmailNotificationConfig()
    config.frontend_base_url = "http://frontend.test"
    return config


@pytest.fixture
def agency(enable_factory_create):
    return factories.AgencyFactory.create(is_test_agency=False)


@pytest.fixture
def opted_in_user(enable_factory_create):
    return _create_user_with_preference(is_enabled=True)


def _create_user_with_preference(is_enabled: bool):
    preference = factories.UserNotificationPreferenceFactory.create(
        notification_type=NotificationType.ALL_NEW_OPPORTUNITIES, is_enabled=is_enabled
    )
    return preference.user


def _create_opportunity(
    agency, first_visible_hours_ago: float, summary_trait="is_posted_summary", **kwargs
):
    opportunity = factories.OpportunityFactory.create(
        agency_code=agency.agency_code,
        agency_id=agency.agency_id,
        **{summary_trait: True},
        **kwargs,
    )
    factories.OpportunityVersionFactory.create(
        opportunity=opportunity,
        created_at=datetime_util.utcnow() - timedelta(hours=first_visible_hours_ago),
    )
    return opportunity


def _create_previous_job(hours_ago: float, job_status=JobStatus.COMPLETED):
    return factories.JobLogFactory.create(
        job_type=TASK_NAME,
        job_status=job_status,
        created_at=datetime_util.utcnow() - timedelta(hours=hours_ago),
    )


def _run_task(db_session, notification_config) -> NewOpportunityNotificationTask:
    task = NewOpportunityNotificationTask(db_session, notification_config)
    task.run()
    return task


def _get_job_content(db_session, task) -> NotificationJobContent | None:
    return db_session.execute(
        select(NotificationJobContent).where(NotificationJobContent.job_id == task.job.job_id)
    ).scalar_one_or_none()


def _get_queued_user_ids(db_session, job_content) -> set:
    return set(
        db_session.execute(
            select(NotificationQueue.user_id).where(
                NotificationQueue.job_content_id == job_content.notification_job_content_id
            )
        ).scalars()
    )


class TestNewOpportunityNotificationTask:
    def test_enqueues_email_for_opted_in_users(
        self, db_session, enable_factory_create, notification_config, agency, opted_in_user
    ):
        opted_out_user = _create_user_with_preference(is_enabled=False)
        no_preference_user = factories.UserFactory.create()
        new_opportunity = _create_opportunity(agency, first_visible_hours_ago=2)

        task = _run_task(db_session, notification_config)

        job_content = _get_job_content(db_session, task)
        assert job_content is not None
        assert job_content.notification_type == NotificationType.ALL_NEW_OPPORTUNITIES
        assert job_content.subject.startswith("New opportunity updates for ")
        assert new_opportunity.opportunity_title in job_content.email_body

        queue_rows = (
            db_session.execute(
                select(NotificationQueue).where(
                    NotificationQueue.job_content_id == job_content.notification_job_content_id
                )
            )
            .scalars()
            .all()
        )
        assert [row.user_id for row in queue_rows] == [opted_in_user.user_id]
        assert queue_rows[0].status == NotificationQueueStatus.PENDING
        assert opted_out_user.user_id not in {row.user_id for row in queue_rows}
        assert no_preference_user.user_id not in {row.user_id for row in queue_rows}

        db_session.refresh(task.job)
        assert task.job.job_status == JobStatus.COMPLETED
        assert task.metrics[task.Metrics.NEW_OPPORTUNITY_COUNT] == 1
        assert task.metrics[task.Metrics.OPTED_IN_USER_COUNT] == 1
        assert task.metrics[task.Metrics.NOTIFICATIONS_QUEUED] == 1
        assert task.metrics[task.Metrics.EMAIL_BODY_SIZE_BYTES] == len(
            job_content.email_body.encode("utf-8")
        )

    def test_first_run_looks_back_24_hours(
        self, db_session, enable_factory_create, notification_config, agency, opted_in_user
    ):
        included = _create_opportunity(agency, first_visible_hours_ago=23)
        excluded = _create_opportunity(agency, first_visible_hours_ago=25)

        task = _run_task(db_session, notification_config)

        email_body = _get_job_content(db_session, task).email_body
        assert str(included.opportunity_id) in email_body
        assert str(excluded.opportunity_id) not in email_body

    def test_window_starts_at_last_successful_job(
        self, db_session, enable_factory_create, notification_config, agency, opted_in_user
    ):
        _create_previous_job(hours_ago=48)
        _create_previous_job(hours_ago=30, job_status=JobStatus.FAILED)
        _create_previous_job(hours_ago=40)
        included = _create_opportunity(agency, first_visible_hours_ago=36)
        excluded = _create_opportunity(agency, first_visible_hours_ago=44)

        task = _run_task(db_session, notification_config)

        email_body = _get_job_content(db_session, task).email_body
        assert str(included.opportunity_id) in email_body
        assert str(excluded.opportunity_id) not in email_body

    def test_status_change_is_not_new(
        self, db_session, enable_factory_create, notification_config, agency, opted_in_user
    ):
        forecast_now_posted = _create_opportunity(agency, first_visible_hours_ago=1)
        factories.OpportunityVersionFactory.create(
            opportunity=forecast_now_posted,
            opportunity_data={"opportunity_status": OpportunityStatus.FORECASTED},
            created_at=datetime_util.utcnow() - timedelta(days=5),
        )
        newly_posted = _create_opportunity(agency, first_visible_hours_ago=1)

        task = _run_task(db_session, notification_config)

        email_body = _get_job_content(db_session, task).email_body
        assert str(newly_posted.opportunity_id) in email_body
        assert str(forecast_now_posted.opportunity_id) not in email_body

    def test_excludes_non_searchable_and_test_agency_opportunities(
        self, db_session, enable_factory_create, notification_config, agency, opted_in_user
    ):
        forecasted = _create_opportunity(
            agency, first_visible_hours_ago=1, summary_trait="is_forecasted_summary"
        )
        test_agency = factories.AgencyFactory.create(is_test_agency=True)
        excluded = [
            _create_opportunity(test_agency, first_visible_hours_ago=1),
            _create_opportunity(agency, first_visible_hours_ago=1, is_draft=True),
            _create_opportunity(
                agency, first_visible_hours_ago=1, summary_trait="is_closed_summary"
            ),
            factories.OpportunityFactory.create(
                agency_code=agency.agency_code, agency_id=agency.agency_id, is_posted_summary=True
            ),
        ]

        task = _run_task(db_session, notification_config)

        email_body = _get_job_content(db_session, task).email_body
        assert str(forecasted.opportunity_id) in email_body
        for opportunity in excluded:
            assert str(opportunity.opportunity_id) not in email_body
        assert task.metrics[task.Metrics.NEW_OPPORTUNITY_COUNT] == 1

    def test_users_without_preference_use_default(
        self,
        db_session,
        enable_factory_create,
        notification_config,
        agency,
        opted_in_user,
        monkeypatch,
    ):
        monkeypatch.setitem(
            NOTIFICATION_TYPE_DEFAULTS, NotificationType.ALL_NEW_OPPORTUNITIES, True
        )
        opted_out_user = _create_user_with_preference(is_enabled=False)
        no_preference_user = factories.UserFactory.create()
        _create_opportunity(agency, first_visible_hours_ago=1)

        task = _run_task(db_session, notification_config)

        queued_user_ids = _get_queued_user_ids(db_session, _get_job_content(db_session, task))
        assert opted_in_user.user_id in queued_user_ids
        assert no_preference_user.user_id in queued_user_ids
        assert opted_out_user.user_id not in queued_user_ids

    def test_no_new_opportunities_skips_enqueue(
        self, db_session, enable_factory_create, notification_config, agency, opted_in_user
    ):
        _create_opportunity(agency, first_visible_hours_ago=30)

        task = _run_task(db_session, notification_config)

        assert _get_job_content(db_session, task) is None
        assert db_session.execute(select(NotificationQueue)).scalars().all() == []
        assert task.metrics[task.Metrics.NEW_OPPORTUNITY_COUNT] == 0
        assert task.metrics[task.Metrics.OPTED_IN_USER_COUNT] == 1
        db_session.refresh(task.job)
        assert task.job.job_status == JobStatus.COMPLETED

    def test_no_opted_in_users_skips_enqueue(
        self, db_session, enable_factory_create, notification_config, agency
    ):
        _create_opportunity(agency, first_visible_hours_ago=1)

        task = _run_task(db_session, notification_config)

        assert _get_job_content(db_session, task) is None
        assert task.metrics[task.Metrics.OPTED_IN_USER_COUNT] == 0

    def test_logs_warning_when_email_body_is_large(
        self,
        db_session,
        enable_factory_create,
        notification_config,
        agency,
        opted_in_user,
        monkeypatch,
        caplog,
    ):
        monkeypatch.setattr(new_opportunity_notification, "EMAIL_BODY_SIZE_WARNING_BYTES", 10)
        _create_opportunity(agency, first_visible_hours_ago=1)

        task = _run_task(db_session, notification_config)

        records = [
            r
            for r in caplog.records
            if r.message == "New opportunity email body exceeds size threshold"
        ]
        assert len(records) == 1
        assert records[0].levelname == "WARNING"
        assert records[0].job_id == task.job.job_id
        assert records[0].email_body_size_bytes == task.metrics[task.Metrics.EMAIL_BODY_SIZE_BYTES]

    def test_failure_rolls_back_and_marks_job_failed(
        self,
        db_session,
        enable_factory_create,
        notification_config,
        agency,
        opted_in_user,
        monkeypatch,
    ):
        def fail_insert(*args, **kwargs):
            raise RuntimeError("insert failed")

        monkeypatch.setattr(new_opportunity_notification, "insert", fail_insert)
        _create_opportunity(agency, first_visible_hours_ago=1)

        task = NewOpportunityNotificationTask(db_session, notification_config)
        with pytest.raises(RuntimeError, match="insert failed"):
            task.run()

        assert _get_job_content(db_session, task) is None
        db_session.refresh(task.job)
        assert task.job.job_status == JobStatus.FAILED


class TestBuildEmail:
    def test_build_subject(self):
        assert build_subject(date(2026, 3, 7)) == "New opportunity updates for 03/07/2026"

    def test_build_email_body_with_values(self, enable_factory_create, agency):
        opportunity = factories.OpportunityFactory.create(
            opportunity_title="Research & <Development>",
            agency_code=agency.agency_code,
            agency_id=agency.agency_id,
            is_posted_summary=True,
        )
        summary = opportunity.summary
        summary.post_date = date(2026, 1, 2)
        summary.close_date = date(2026, 3, 4)
        summary.award_floor = 0
        summary.award_ceiling = 1234567
        summary.expected_number_of_awards = 5
        summary.is_cost_sharing = True

        email_body = build_email_body([opportunity], "http://frontend.test")

        assert (
            f"<a href='http://frontend.test/opportunity/{opportunity.opportunity_id}" in email_body
        )
        assert "Research &amp; &lt;Development&gt;" in email_body
        assert f"Agency: {agency.agency_code} - {agency.agency_name}<br/>" in email_body
        assert "Status: Open<br/>" in email_body
        assert "Submission period: 01/02/2026–03/04/2026<br/>" in email_body
        assert "Award range: $0–$1,234,567<br/>" in email_body
        assert "Expected awards: 5<br/>" in email_body
        assert "Cost sharing: Yes<br/>" in email_body
        assert "http://frontend.test/notifications" in email_body

    def test_build_email_body_with_missing_values(self, enable_factory_create, agency):
        opportunity = factories.OpportunityFactory.create(
            agency_code=agency.agency_code,
            agency_id=agency.agency_id,
            is_forecasted_summary=True,
        )
        summary = opportunity.summary
        summary.forecasted_post_date = None
        summary.forecasted_close_date = None
        summary.award_floor = None
        summary.award_ceiling = None
        summary.expected_number_of_awards = None
        summary.is_cost_sharing = None

        email_body = build_email_body([opportunity], "http://frontend.test")

        assert "Status: Forecasted<br/>" in email_body
        assert "Submission period: To be announced<br/>" in email_body
        assert "Award range: Not specified<br/>" in email_body
        assert "Expected awards: Not specified<br/>" in email_body
        assert "Cost sharing: Not specified<br/>" in email_body
