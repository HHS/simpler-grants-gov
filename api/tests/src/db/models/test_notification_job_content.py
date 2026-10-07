import pytest
from sqlalchemy.exc import IntegrityError

from src.constants.lookup_constants import NotificationType
from tests.src.db.models.factories import JobLogFactory, NotificationJobContentFactory


class TestNotificationJobContent:
    def test_create(self, enable_factory_create):
        """Factory creates a row linked to a job_log entry"""
        content = NotificationJobContentFactory.create()

        assert content.job_id == content.job.job_id
        assert content.notification_type == NotificationType.ALL_NEW_OPPORTUNITIES
        assert content.subject
        assert content.email_body

    def test_unique_constraint_job_id(self, enable_factory_create, db_session):
        """Only one content row allowed per job"""
        job = JobLogFactory.create()
        NotificationJobContentFactory.create(job=job)

        with pytest.raises(IntegrityError):
            with db_session.begin():
                NotificationJobContentFactory.create(job=job)
