import pytest
from sqlalchemy.exc import IntegrityError

from src.constants.lookup_constants import NotificationQueueStatus
from tests.src.db.models.factories import (
    NotificationJobContentFactory,
    NotificationQueueFactory,
    UserFactory,
)


class TestNotificationQueue:
    def test_create(self, enable_factory_create):
        """Factory creates a pending row linked to job content and a user"""
        queue_record = NotificationQueueFactory.create()

        assert queue_record.job_content_id == queue_record.job_content.notification_job_content_id
        assert queue_record.user_id == queue_record.user.user_id
        assert queue_record.status == NotificationQueueStatus.PENDING
        assert queue_record.ses_message_id is None

    def test_create_sent(self, enable_factory_create):
        """is_sent trait sets status and ses_message_id"""
        queue_record = NotificationQueueFactory.create(is_sent=True)

        assert queue_record.status == NotificationQueueStatus.SENT
        assert queue_record.ses_message_id

    def test_same_user_different_job_content(self, enable_factory_create):
        """A user can be queued once for each job run"""
        user = UserFactory.create()

        NotificationQueueFactory.create(user=user)
        NotificationQueueFactory.create(user=user)

    def test_unique_constraint_job_content_user(self, enable_factory_create, db_session):
        """Only one queue row allowed per job content and user"""
        job_content = NotificationJobContentFactory.create()
        user = UserFactory.create()
        NotificationQueueFactory.create(job_content=job_content, user=user)

        with pytest.raises(IntegrityError):
            with db_session.begin():
                NotificationQueueFactory.create(job_content=job_content, user=user)
