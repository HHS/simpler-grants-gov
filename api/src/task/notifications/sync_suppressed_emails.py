from datetime import datetime, timedelta

from sqlalchemy import select, update

from src.adapters import db
from src.db.models.user_models import LinkExternalUser, SuppressedEmail
from src.task.task import Task


class SyncSuppressedEmails(Task):
    def __init__(self, db_session: db.Session, client: BaseSESV2Client | None = None) -> None:
        super().__init__(db_session)

        if client is None:
            client = SESV2Client()

        self.client = client

    def fetch_suppressed_emails(self) -> None:
        # Get the most recent suppression timestamp from DB
        stmt = select(SuppressedEmail).order_by(SuppressedEmail.last_update_time.desc()).limit(1)
        last_record = self.db_session.execute(stmt).scalars().first()
        start_date: datetime | None = None

        if last_record:
            start_date = last_record.last_update_time + timedelta(seconds=1)

        resp = self.client.list_suppressed_destinations(start_date=start_date)
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

            existing = suppression_map.get(email)
            if existing:
                existing.reason = destination.reason
                existing.last_update_time = destination.last_update_time
            else:
                self.db_session.add(
                    SuppressedEmail(
                        email=email,
                        reason=destination.reason,
                        last_update_time=destination.last_update_time,
                    )
                )

        self.db_session.commit()
