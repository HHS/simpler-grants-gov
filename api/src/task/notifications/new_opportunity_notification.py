import html
import logging
import uuid
from collections.abc import Sequence
from datetime import date, datetime, timedelta
from enum import StrEnum

from sqlalchemy import and_, func, insert, select

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
from src.constants.lookup_constants import (
    JobStatus,
    JobType,
    NotificationQueueStatus,
    NotificationType,
    OpportunityStatus,
)
from src.db.models.opportunity_models import Opportunity, OpportunitySummary
from src.db.models.task_models import JobLog
from src.db.models.user_models import (
    NotificationJobContent,
    NotificationQueue,
    User,
    UserNotificationPreference,
)
from src.services.opportunities_v1.get_opportunities import get_new_searchable_opportunities
from src.task.ecs_background_task import ecs_background_task
from src.task.notifications.config import EmailNotificationConfig, get_email_config
from src.task.notifications.constants import NOTIFICATION_TYPE_DEFAULTS
from src.task.task import Task
from src.task.task_blueprint import task_blueprint
from src.util import datetime_util

logger = logging.getLogger(__name__)

UTM_TAG = "?utm_source=notification&utm_medium=email&utm_campaign=new_opportunity"

DEFAULT_LOOKBACK = timedelta(hours=24)

# Gmail clips messages over ~102 KB, warn before we get there
EMAIL_BODY_SIZE_WARNING_BYTES = 90 * 1024

NOT_SPECIFIED = "Not specified"
TO_BE_ANNOUNCED = "To be announced"

STATUS_DISPLAY = {
    OpportunityStatus.FORECASTED: "Forecasted",
    OpportunityStatus.POSTED: "Open",
}


@task_blueprint.cli.command(
    "new-opportunity-notification",
    help="Queue the daily new opportunity email for opted-in users",
)
@ecs_background_task(JobType.NEW_OPPORTUNITY_NOTIFICATION)
@flask_db.with_db_session()
def run_new_opportunity_notification_task(db_session: db.Session) -> None:
    """Run the daily new opportunity notification enqueue task"""
    task = NewOpportunityNotificationTask(db_session)
    task.run()


class NewOpportunityNotificationTask(Task):
    """Queue the daily email listing every opportunity that became searchable since the last run

    The email is rendered once and stored in notification_job_content, then one pending
    notification_queue row is inserted per opted-in user. A separate processor sends the emails.
    """

    class Metrics(StrEnum):
        NEW_OPPORTUNITY_COUNT = "new_opportunity_count"
        OPTED_IN_USER_COUNT = "opted_in_user_count"
        NOTIFICATIONS_QUEUED = "notifications_queued"
        EMAIL_BODY_SIZE_BYTES = "email_body_size_bytes"

    def __init__(
        self,
        db_session: db.Session,
        notification_config: EmailNotificationConfig | None = None,
    ) -> None:
        super().__init__(db_session)

        if notification_config is None:
            notification_config = get_email_config()
        self.notification_config = notification_config

    def run_task(self) -> None:
        # Everything is written in a single transaction so a failure
        # partway through leaves no partial content or queue rows behind.
        try:
            self._enqueue_notifications()
        except Exception:
            self.db_session.rollback()
            raise

        self.db_session.commit()

    def _enqueue_notifications(self) -> None:
        if self.job is None:
            raise ValueError("Job is not initialized")

        window_start, window_end = self._get_window()
        opportunities = get_new_searchable_opportunities(self.db_session, window_start, window_end)
        user_ids = self._get_opted_in_user_ids()

        self.set_metrics(
            {
                self.Metrics.NEW_OPPORTUNITY_COUNT: len(opportunities),
                self.Metrics.OPTED_IN_USER_COUNT: len(user_ids),
            }
        )
        log_extra = {
            "job_id": self.job.job_id,
            "window_start": window_start.isoformat(),
            "window_end": window_end.isoformat(),
            "new_opportunity_count": len(opportunities),
            "opted_in_user_count": len(user_ids),
        }

        if not opportunities or not user_ids:
            logger.info(
                "No new opportunities or opted-in users, skipping new opportunity email",
                extra=log_extra,
            )
            return

        job_date = datetime_util.adjust_timezone(window_end, "America/New_York").date()
        job_content = NotificationJobContent(
            notification_job_content_id=uuid.uuid4(),
            job_id=self.job.job_id,
            notification_type=NotificationType.ALL_NEW_OPPORTUNITIES,
            subject=build_subject(job_date),
            email_body=build_email_body(opportunities, self.notification_config.frontend_base_url),
        )
        self.db_session.add(job_content)

        email_body_size = len(job_content.email_body.encode("utf-8"))
        self.set_metrics({self.Metrics.EMAIL_BODY_SIZE_BYTES: email_body_size})
        if email_body_size > EMAIL_BODY_SIZE_WARNING_BYTES:
            logger.warning(
                "New opportunity email body exceeds size threshold",
                extra={"job_id": self.job.job_id, "email_body_size_bytes": email_body_size},
            )

        self.db_session.flush()
        self.db_session.execute(
            insert(NotificationQueue),
            [
                {
                    "job_content_id": job_content.notification_job_content_id,
                    "user_id": user_id,
                    "status": NotificationQueueStatus.PENDING,
                }
                for user_id in user_ids
            ],
        )
        self.set_metrics({self.Metrics.NOTIFICATIONS_QUEUED: len(user_ids)})

        logger.info(
            "Queued new opportunity email",
            extra={
                **log_extra,
                "notification_job_content_id": job_content.notification_job_content_id,
            },
        )

    def _get_window(self) -> tuple[datetime, datetime]:
        """Get the [start, end) window to look for new opportunities in

        The window starts where the last successful run's window ended (when it started),
        so a failed or skipped run is caught up on by the next successful one.
        """
        if self.job is None:
            raise ValueError("Job is not initialized")

        window_end = self.job.created_at

        last_successful_job = self.db_session.execute(
            select(JobLog)
            .where(
                JobLog.job_type == self.cls_name(),
                JobLog.job_status == JobStatus.COMPLETED,
                JobLog.job_id != self.job.job_id,
            )
            .order_by(JobLog.created_at.desc())
            .limit(1)
        ).scalar_one_or_none()

        if last_successful_job is None:
            return window_end - DEFAULT_LOOKBACK, window_end

        return last_successful_job.created_at, window_end

    def _get_opted_in_user_ids(self) -> list[uuid.UUID]:
        """Get users who opted in, falling back to the notification type default for users without a preference"""
        notification_type = NotificationType.ALL_NEW_OPPORTUNITIES
        default_is_enabled = NOTIFICATION_TYPE_DEFAULTS[notification_type]

        stmt = (
            select(User.user_id)
            .outerjoin(
                UserNotificationPreference,
                and_(
                    UserNotificationPreference.user_id == User.user_id,
                    UserNotificationPreference.notification_type == notification_type,
                ),
            )
            .where(func.coalesce(UserNotificationPreference.is_enabled, default_is_enabled))
        )

        return list(self.db_session.execute(stmt).scalars().all())


def build_subject(job_date: date) -> str:
    return f"New opportunity updates for {_format_date(job_date)}"


def build_email_body(opportunities: Sequence[Opportunity], frontend_base_url: str) -> str:
    sections = [
        "The following funding opportunities were published in the past 24 hours.<br/>\n<br/>\n"
    ]

    for opportunity in opportunities:
        summary = opportunity.summary
        url = f"{frontend_base_url}/opportunity/{opportunity.opportunity_id}{UTM_TAG}"
        title = html.escape(opportunity.opportunity_title or "")
        sections.append(
            f"<b><a href='{url}' target='_blank'>{title}</a></b><br/>\n"
            f"Agency: {html.escape(_format_agency(opportunity))}<br/>\n"
            f"Status: {_format_status(opportunity.opportunity_status)}<br/>\n"
            f"Submission period: {_format_submission_period(summary)}<br/>\n"
            f"Award range: {_format_award_range(summary)}<br/>\n"
            f"Expected awards: {_format_expected_awards(summary)}<br/>\n"
            f"Cost sharing: {_format_cost_sharing(summary)}<br/>\n"
            "<br/>\n"
        )

    sections.append(
        "To stop receiving daily email updates for all new opportunities, "
        f"<a href='{frontend_base_url}/notifications{UTM_TAG}' target='_blank'>manage your notification settings</a>."
    )

    return "".join(sections)


def _format_date(value: date | None) -> str:
    if value is None:
        return TO_BE_ANNOUNCED
    return value.strftime("%m/%d/%Y")


def _format_dollars(value: int | None) -> str:
    if value is None:
        return NOT_SPECIFIED
    return f"${value:,}"


def _format_agency(opportunity: Opportunity) -> str:
    agency = opportunity.agency_record
    if agency is None:
        return opportunity.agency_code or NOT_SPECIFIED
    return f"{agency.agency_code} - {agency.agency_name}"


def _format_status(status: OpportunityStatus | None) -> str:
    if status is None:
        return NOT_SPECIFIED
    return STATUS_DISPLAY.get(status, NOT_SPECIFIED)


def _format_submission_period(summary: OpportunitySummary | None) -> str:
    if summary is None:
        return TO_BE_ANNOUNCED

    if summary.is_forecast:
        start, end = summary.forecasted_post_date, summary.forecasted_close_date
    else:
        start, end = summary.post_date, summary.close_date

    if start is None and end is None:
        return TO_BE_ANNOUNCED

    return f"{_format_date(start)}–{_format_date(end)}"


def _format_award_range(summary: OpportunitySummary | None) -> str:
    if summary is None or (summary.award_floor is None and summary.award_ceiling is None):
        return NOT_SPECIFIED

    return f"{_format_dollars(summary.award_floor)}–{_format_dollars(summary.award_ceiling)}"


def _format_expected_awards(summary: OpportunitySummary | None) -> str:
    if summary is None or summary.expected_number_of_awards is None:
        return NOT_SPECIFIED
    return str(summary.expected_number_of_awards)


def _format_cost_sharing(summary: OpportunitySummary | None) -> str:
    if summary is None or summary.is_cost_sharing is None:
        return NOT_SPECIFIED
    return "Yes" if summary.is_cost_sharing else "No"
