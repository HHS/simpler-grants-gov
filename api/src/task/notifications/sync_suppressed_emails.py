import logging
from datetime import datetime, timedelta

from sqlalchemy import select

from src.adapters import db
from src.adapters.aws.sesv2_adapter import BaseSESV2Client, get_sesv2_client
from src.db.models.user_models import LinkExternalUser, SuppressedEmail
from src.task.notifications import constants
from src.task.notifications.constants import Metrics
from src.task.task import Task

logger = logging.getLogger(__name__)


class SyncSuppressedEmailsTask(Task):
    Metrics = constants.Metrics  # type: ignore[assignment]

    def __init__(self, db_session: db.Session, sesv2_client: BaseSESV2Client | None = None) -> None:
        super().__init__(db_session)

        self.sesv2_client = sesv2_client or get_sesv2_client()

    def run_task(self) -> None:
        with self.db_session.begin():
            self.process_suppressed_emails()

    def process_suppressed_emails(self) -> None:
        # Get the most recent suppression timestamp from DB
        stmt = select(SuppressedEmail).order_by(SuppressedEmail.last_update_time.desc()).limit(1)

        last_record = self.db_session.execute(stmt).scalars().first()

        start_time: datetime | None = None
        if last_record:
            start_time = last_record.last_update_time + timedelta(microseconds=1)

        resp = self.sesv2_client.list_suppressed_destinations(start_time=start_time)
        suppressed_emails = resp.suppressed_destination_summaries

        emails = [d.email_address for d in suppressed_emails]
        if not emails:
            logger.info("No suppressed email destinations returned")
            return

        # Fetch relevant users
        existing_users = (
            self.db_session.execute(
                select(LinkExternalUser.email).where(LinkExternalUser.email.in_(emails))
            )
            .scalars()
            .all()
        )
        user_email_set = set(existing_users)

        # Fetch existing suppressed records to update
        existing_suppressions = (
            self.db_session.execute(
                select(SuppressedEmail).where(SuppressedEmail.email.in_(user_email_set))
            )
            .scalars()
            .all()
        )
        logger.info("Updating %d existing suppressed emails", len(existing_suppressions))

        suppression_map = {s.email: s for s in existing_suppressions}

        for destination in resp.suppressed_destination_summaries:
            email = destination.email_address
            if email not in user_email_set:
                continue

            suppressed_email_record = suppression_map.get(email)
            if not suppressed_email_record:
                self.increment(Metrics.SUPPRESSED_DESTINATION_COUNT)
                suppressed_email_record = SuppressedEmail(email=email)

            suppressed_email_record.reason = destination.reason
            suppressed_email_record.last_update_time = destination.last_update_time
            self.db_session.add(suppressed_email_record)
