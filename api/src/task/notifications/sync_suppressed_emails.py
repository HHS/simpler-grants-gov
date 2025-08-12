from datetime import datetime, timedelta

from sqlalchemy import select

from src.adapters import db
from src.adapters.aws.sesv2_adapter import BaseSESV2Client, SESV2Client, get_sesv2_client
from src.db.models.user_models import LinkExternalUser, SuppressedEmail
from src.task.task import Task


class SyncSuppressedEmailsTask(Task):
    def __init__(self, db_session: db.Session, sesv2_client: BaseSESV2Client | None = None) -> None:
        super().__init__(db_session)

        self.sesv2_client = sesv2_client or get_sesv2_client()

    def run_task(self) -> None:
        # Get the most recent suppression timestamp from DB
        stmt = select(SuppressedEmail).order_by(SuppressedEmail.last_update_time.desc()).limit(1)
        with self.db_session.begin():
            last_record = self.db_session.execute(stmt).scalars().first()

            start_date: datetime | None = None
            if last_record:
                start_date = last_record.last_update_time + timedelta(microseconds=1)

            resp = self.sesv2_client.list_suppressed_destinations(start_date=start_date)
            emails = [d.email_address for d in resp.suppressed_destination_summaries]
            if not emails:
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

            suppression_map = {s.email: s for s in existing_suppressions}

            for destination in resp.suppressed_destination_summaries:
                email = destination.email_address
                if email not in user_email_set:
                    continue

                suppressed_email_record = suppression_map.get(email)
                if not suppressed_email_record:
                    suppressed_email_record = SuppressedEmail(email=email)

                suppressed_email_record.reason = destination.reason
                suppressed_email_record.last_update_time = destination.last_update_time
                self.db_session.add(suppressed_email_record)
