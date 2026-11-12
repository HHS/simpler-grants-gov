import uuid

import click
import pytest
from sqlalchemy import delete, select

import tests.src.db.models.factories as factories
from src.constants.lookup_constants import ExternalUserType, NotificationType, OpportunityStatus
from src.db.models.opportunity_models import OpportunityVersion
from src.db.models.task_models import JobLog
from src.db.models.user_models import (
    NotificationJobContent,
    NotificationQueue,
    UserNotificationPreference,
)
from src.task.notifications.config import EmailNotificationConfig
from src.task.notifications.new_opportunity_notification import NewOpportunityNotificationTask
from tests.lib.seed_new_opportunity_notification import create_new_opportunities, subscribe_users


@pytest.fixture(autouse=True)
def clear_data(db_session):
    db_session.execute(delete(NotificationQueue))
    db_session.execute(delete(NotificationJobContent))
    db_session.execute(
        delete(JobLog).where(JobLog.job_type == NewOpportunityNotificationTask.__name__)
    )
    db_session.execute(delete(UserNotificationPreference))
    db_session.execute(delete(OpportunityVersion))
    db_session.commit()


@pytest.fixture
def oauth_login(enable_factory_create):
    oauth_login = f"seed_user_{uuid.uuid4()}"
    factories.LinkExternalUserFactory.create(
        external_user_id=oauth_login, external_user_type=ExternalUserType.LOGIN_GOV
    )
    return oauth_login


def test_seeded_data_is_included_in_new_opportunity_email(db_session, oauth_login):
    users = subscribe_users(db_session, [oauth_login])
    opportunities = create_new_opportunities(db_session, count=4)
    db_session.commit()

    task = NewOpportunityNotificationTask(db_session, EmailNotificationConfig())
    task.run()

    job_content = db_session.execute(
        select(NotificationJobContent).where(NotificationJobContent.job_id == task.job.job_id)
    ).scalar_one()
    for opportunity in opportunities:
        assert str(opportunity.opportunity_id) in job_content.email_body
    assert {o.opportunity_status for o in opportunities} == {
        OpportunityStatus.POSTED,
        OpportunityStatus.FORECASTED,
    }

    queued_user_ids = db_session.execute(
        select(NotificationQueue.user_id).where(
            NotificationQueue.job_content_id == job_content.notification_job_content_id
        )
    ).scalars()
    assert list(queued_user_ids) == [users[0].user_id]


def test_subscribe_users_can_run_multiple_times(db_session, oauth_login):
    subscribe_users(db_session, [oauth_login])
    subscribe_users(db_session, [oauth_login])
    db_session.commit()

    preferences = (
        db_session.execute(
            select(UserNotificationPreference).where(
                UserNotificationPreference.notification_type
                == NotificationType.ALL_NEW_OPPORTUNITIES
            )
        )
        .scalars()
        .all()
    )
    assert len(preferences) == 1
    assert preferences[0].is_enabled is True


def test_subscribe_users_errors_for_unknown_login(db_session):
    with pytest.raises(click.ClickException, match="No user found with OAuth login"):
        subscribe_users(db_session, [f"unknown_user_{uuid.uuid4()}"])
