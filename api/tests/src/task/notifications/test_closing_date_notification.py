
from datetime import timedelta

import pytest
from sqlalchemy import select

import tests.src.db.models.factories as factories
from src.adapters.aws.pinpoint_adapter import _clear_mock_responses, _get_mock_responses
from src.api.opportunities_v1.opportunity_schemas import OpportunityV1Schema
from src.db.models.user_models import (
    UserNotificationLog,
    UserOpportunityNotificationLog,
    UserSavedOpportunity,
    UserSavedSearch,
)
from src.task.notifications.constants import NotificationReason
from src.task.notifications.send_notifications import SendNotificationTask
from src.util import datetime_util
from tests.src.api.opportunities_v1.test_opportunity_route_search import OPPORTUNITIES

@pytest.fixture
def user_with_email(db_session, user, monkeypatch):
    monkeypatch.setenv("PINPOINT_APP_ID", "test-app-id")
    factories.LinkExternalUserFactory.create(user=user, email="test@example.com")
    return user


@pytest.fixture
def setup_search_data(opportunity_index, opportunity_index_alias, search_client):
    # Load into the search index
    schema = OpportunityV1Schema()
    json_records = [schema.dump(opportunity) for opportunity in OPPORTUNITIES]
    search_client.bulk_upsert(opportunity_index, json_records, "opportunity_id")

    # Swap the search index alias
    search_client.swap_alias_index(opportunity_index, opportunity_index_alias)


@pytest.fixture
def clear_notification_logs(db_session):
    """Clear all notification logs"""
    db_session.query(UserNotificationLog).delete()
    db_session.query(UserSavedOpportunity).delete()
    db_session.query(UserSavedSearch).delete()
    db_session.query(UserOpportunityNotificationLog).delete()


def test_closing_date_notifications(
    db_session, enable_factory_create, user_with_email, search_client, clear_notification_logs
):
    """Test that notifications are sent for opportunities closing in two weeks"""
    two_weeks_from_now = datetime_util.utcnow() + timedelta(days=14)

    # Create an opportunity closing in two weeks
    opportunity = factories.OpportunityFactory.create(no_current_summary=True)
    summary = factories.OpportunitySummaryFactory.create(
        opportunity=opportunity, close_date=two_weeks_from_now
    )
    factories.CurrentOpportunitySummaryFactory.create(opportunity=opportunity,opportunity_summary=summary)

    factories.UserSavedOpportunityFactory.create(user=user_with_email, opportunity=opportunity)

    # Create an opportunity closing in three weeks (shouldn't trigger notification)
    opportunity_later = factories.OpportunityFactory.create(no_current_summary=True)
    summary =factories.OpportunitySummaryFactory.create(
        opportunity=opportunity_later, close_date=datetime_util.utcnow() + timedelta(days=21)
    )
    factories.CurrentOpportunitySummaryFactory.create(opportunity=opportunity_later,opportunity_summary=summary)

    factories.UserSavedOpportunityFactory.create(
        user=user_with_email, opportunity=opportunity_later
    )

    _clear_mock_responses()

    # Run the notification task
    task = SendNotificationTask(db_session, search_client)
    task.run()

    # Verify notification log was created only for the opportunity closing in two weeks
    notification_logs = (
        db_session.execute(
            select(UserNotificationLog).where(
                UserNotificationLog.notification_reason == NotificationReason.CLOSING_DATE_REMINDER
            )
        )
        .scalars()
        .all()
    )

    notification_opportunity_logs = (
        db_session.execute(select(UserOpportunityNotificationLog)).scalars().all()
    )

    assert len(notification_logs) == 1
    assert notification_logs[0].notification_sent is True

    assert len(notification_opportunity_logs) == 1
    assert notification_opportunity_logs[0].opportunity_id == opportunity.opportunity_id
    assert notification_opportunity_logs[0].user_id == user_with_email.user_id

    # Verify email was sent via Pinpoint
    mock_responses = _get_mock_responses()
    assert len(mock_responses) == 1
