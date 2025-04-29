from datetime import timedelta

import pytest
from sqlalchemy import select

import tests.src.db.models.factories as factories
from src.adapters.aws.pinpoint_adapter import _clear_mock_responses, _get_mock_responses
from src.api.opportunities_v1.opportunity_schemas import OpportunityV1Schema
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import UserNotificationLog, UserSavedOpportunity, UserSavedSearch
from src.task.notifications.constants import NotificationReason
from src.task.notifications.email_notification import EmailNotificationTask
from src.task.notifications.generate_notifications import NotificationConstants
from src.task.notifications.search_notification import _strip_pagination_params
from src.util import datetime_util
from tests.lib.db_testing import cascade_delete_from_db_table
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


@pytest.fixture(autouse=True)
def cleanup_opportunities(db_session):
    cascade_delete_from_db_table(db_session, Opportunity)
    cascade_delete_from_db_table(db_session, UserSavedOpportunity)


def test_search_notifications_cli(
    cli_runner,
    db_session,
    setup_search_data,
    enable_factory_create,
    user,
    user_with_email,
    caplog,
    clear_notification_logs,
):
    """Test that verifies we can collect and send search notifications via CLI"""

    # Create a saved search that needs notification
    saved_search = factories.UserSavedSearchFactory.create(
        user=user,
        search_query={"keywords": "test"},
        name="Test Search",
        last_notified_at=datetime_util.utcnow() - timedelta(days=1),
        searched_opportunity_ids=[1, 2, 3],
    )

    notification_logs_count = (
        db_session.query(UserNotificationLog)
        .filter(UserNotificationLog.notification_reason == NotificationConstants.SEARCH_UPDATES)
        .count()
    )

    _clear_mock_responses()

    result = cli_runner.invoke(args=["task", "email-notifications"])

    assert result.exit_code == 0

    # Verify expected log messages
    assert "Collected search notifications" in caplog.text
    assert "Created changed search email notification" in caplog.text
    assert "Sending notification to user" in caplog.text

    # Verify the log contains the correct metrics
    log_records = [
        r for r in caplog.records if "Successfully sent notification to user" in r.message
    ]
    assert len(log_records) == 1
    extra = log_records[0].__dict__
    assert extra["user_id"] == user.user_id
    assert extra["notification_reason"] == NotificationReason.SEARCH_UPDATES

    # Verify notification log was created
    notification_logs = (
        db_session.query(UserNotificationLog)
        .filter(UserNotificationLog.notification_reason == NotificationReason.SEARCH_UPDATES)
        .all()
    )
    assert len(notification_logs) == notification_logs_count + 1

    # Verify last_notified_at was updated
    db_session.refresh(saved_search)
    assert saved_search.last_notified_at > datetime_util.utcnow() - timedelta(minutes=1)

    # Verify email was sent via Pinpoint
    mock_responses = _get_mock_responses()
    assert len(mock_responses) == 1

    request = mock_responses[0][0]
    assert request["MessageRequest"]["Addresses"] == {"test@example.com": {"ChannelType": "EMAIL"}}

    # Verify notification log was created
    notification_logs = (
        db_session.execute(
            select(UserNotificationLog).where(UserNotificationLog.user_id == user.user_id)
        )
        .scalars()
        .all()
    )

    assert len(notification_logs) == 1
    assert notification_logs[0].notification_sent is True


def test_grouped_search_queries_cli(
    cli_runner,
    db_session,
    enable_factory_create,
    clear_notification_logs,
    user,
    user_with_email,
    setup_search_data,
):
    """Test that verifies we properly handle multiple users with the same search query"""
    # Create two users with the same search query
    user1 = factories.UserFactory.create()
    user2 = factories.UserFactory.create()
    factories.LinkExternalUserFactory.create(user=user1, email="user1@example.com")
    factories.LinkExternalUserFactory.create(user=user2, email="user2@example.com")

    same_search_query = {"keywords": "shared search"}

    # Create saved searches with the same query but different results
    saved_search1 = factories.UserSavedSearchFactory.create(
        user=user1,
        search_query=same_search_query,
        name="User 1 Search",
        last_notified_at=datetime_util.utcnow() - timedelta(days=1),
        searched_opportunity_ids=[1, 2, 3],
    )

    saved_search2 = factories.UserSavedSearchFactory.create(
        user=user2,
        search_query=same_search_query,
        name="User 2 Search",
        last_notified_at=datetime_util.utcnow() - timedelta(days=1),
        searched_opportunity_ids=[4, 5, 6],
    )

    result = cli_runner.invoke(args=["task", "email-notifications"])

    assert result.exit_code == 0

    # Verify notification logs were created for both users
    notification_logs = (
        db_session.query(UserNotificationLog)
        .filter(UserNotificationLog.notification_reason == NotificationReason.SEARCH_UPDATES)
        .all()
    )
    assert len(notification_logs) == 2

    # Verify each user got their own notification
    user_ids = {log.user_id for log in notification_logs}
    assert user_ids == {user1.user_id, user2.user_id}

    # Verify both searches were updated with the same new results
    db_session.refresh(saved_search1)
    db_session.refresh(saved_search2)

    assert saved_search1.searched_opportunity_ids == saved_search2.searched_opportunity_ids
    assert saved_search1.last_notified_at > datetime_util.utcnow() - timedelta(minutes=1)
    assert saved_search2.last_notified_at > datetime_util.utcnow() - timedelta(minutes=1)


def test_search_notifications_on_index_change(
    cli_runner,
    db_session,
    enable_factory_create,
    user,
    user_with_email,
    opportunity_index,
    search_client,
    clear_notification_logs,
):
    """Test that verifies notifications are generated when search results change due to index updates"""
    # Create a saved search with initial results
    saved_search = factories.UserSavedSearchFactory.create(
        user=user,
        search_query={"keywords": "test"},
        name="Test Search",
        last_notified_at=datetime_util.utcnow() - timedelta(days=1),
        searched_opportunity_ids=[1, 2],  # Initial results
    )

    # Update the search index with new data that will change the results
    schema = OpportunityV1Schema()
    new_opportunity = factories.OpportunityFactory.create(
        opportunity_id=999,
        opportunity_title="New Test Opportunity",
    )
    factories.OpportunitySummaryFactory.build(
        opportunity=new_opportunity,
        summary_description="This should appear in test search results",
    )
    json_record = schema.dump(new_opportunity)
    search_client.bulk_upsert(opportunity_index, [json_record], "opportunity_id")

    # Run the notification task
    task = EmailNotificationTask(db_session, search_client)
    task.run()

    # Verify notification log was created due to changed results
    notification_logs = (
        db_session.query(UserNotificationLog)
        .filter(
            UserNotificationLog.user_id == user.user_id,
            UserNotificationLog.notification_reason == NotificationReason.SEARCH_UPDATES,
        )
        .all()
    )
    assert len(notification_logs) == 1

    # Verify the saved search was updated with new results
    db_session.refresh(saved_search)
    assert 999 in saved_search.searched_opportunity_ids  # New opportunity should be in results
    assert saved_search.last_notified_at > datetime_util.utcnow() - timedelta(minutes=1)

    # Run the task again - should not generate new notifications since results haven't changed
    task_rerun = EmailNotificationTask(db_session, search_client)
    task_rerun.run()

    notification_logs = (
        db_session.query(UserNotificationLog)
        .filter(
            UserNotificationLog.user_id == user.user_id,
            UserNotificationLog.notification_reason == NotificationReason.SEARCH_UPDATES,
        )
        .all()
    )
    assert len(notification_logs) == 1  # Should still only be one notification


def test_pagination_params_are_stripped_from_search_query(
    cli_runner, db_session, enable_factory_create, user, clear_notification_logs
):
    """Test that pagination parameters are stripped from search queries"""
    saved_search = factories.UserSavedSearchFactory.create(
        user=user,
        search_query={
            "query": "test",
            "pagination": {"page": 1, "per_page": 10},
        },
        name="Test Search",
        last_notified_at=datetime_util.utcnow() - timedelta(days=1),
        searched_opportunity_ids=[1, 2],
    )

    params = _strip_pagination_params(saved_search.search_query)
    assert params.keys() == {"query"}
