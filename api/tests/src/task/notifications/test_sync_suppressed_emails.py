from datetime import UTC, datetime, timedelta

import pytest

from src.adapters.aws.sesv2_adapter import MockSESV2Client, SuppressedDestination
from src.db.models.user_models import LinkExternalUser, SuppressedEmail
from src.task.notifications.constants import Metrics
from src.task.notifications.sync_suppressed_emails import SyncSuppressedEmailsTask
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.db.models import factories


@pytest.fixture(autouse=True)
def clear_data(db_session):
    cascade_delete_from_db_table(db_session, SuppressedEmail)
    cascade_delete_from_db_table(db_session, LinkExternalUser)


@pytest.fixture
def client():
    return MockSESV2Client()


@pytest.fixture
def task(db_session, client):
    task = SyncSuppressedEmailsTask(db_session, client)
    return task


def test_sync_suppressed_emails_update(task, client, db_session, enable_factory_create):
    supp_1 = factories.SuppressedEmailFactory.create()
    factories.LinkExternalUserFactory.create(email=supp_1.email)

    client.add_mock_responses(
        SuppressedDestination(
            EmailAddress=supp_1.email,
            Reason="COMPLAINT",
            LastUpdateTime=supp_1.last_update_time + timedelta(days=1),
        )
    )
    task.run()

    result = db_session.query(SuppressedEmail).all()
    assert len(result) == 1
    assert result[0].email == supp_1.email
    assert result[0].reason == "COMPLAINT"
    assert result[0].last_update_time == supp_1.last_update_time


def test_sync_suppressed_emails_create(task, client, db_session, enable_factory_create):
    user = factories.LinkExternalUserFactory.create()

    client.add_mock_responses(
        SuppressedDestination(
            EmailAddress=user.email,
            Reason="BOUNCE",
            LastUpdateTime=datetime.now(UTC),
        )
    )

    task.run()

    result = db_session.query(SuppressedEmail).all()
    assert len(result) == 1
    assert result[0].email == user.email

    metrics = task.metrics
    assert metrics[Metrics.SUPPRESSED_DESTINATION_COUNT] == 1


def test_sync_suppressed_no_suppressed_email(task, db_session):
    task.run()

    result = db_session.query(SuppressedEmail).all()
    assert len(result) == 0


def test_sync_suppressed_emails_none_existent_user(task, client, db_session):

    client.add_mock_responses(
        SuppressedDestination(
            EmailAddress="random@gmail.com",
            Reason="BOUNCE",
            LastUpdateTime=datetime.now(UTC),
        )
    )
    task.run()

    result = db_session.query(SuppressedEmail).all()
    assert len(result) == 0
