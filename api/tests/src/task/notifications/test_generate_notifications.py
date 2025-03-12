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
from src.task.notifications.generate_notifications import (
    NotificationConstants,
    NotificationTask,
    _strip_pagination_params,
)
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


def test_via_cli(cli_runner, db_session, enable_factory_create, user, user_with_email):
    """Simple test that verifies we can invoke the notification task via CLI"""
    result = cli_runner.invoke(args=["task", "generate-notifications"])

    assert result.exit_code == 0


def test_search_notifications_cli(
    cli_runner,
    db_session,
    enable_factory_create,
    user,
    user_with_email,
    caplog,
    clear_notification_logs,
    setup_search_data,
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

    result = cli_runner.invoke(args=["task", "generate-notifications"])

    assert result.exit_code == 0

    # Verify expected log messages
    assert "Collected search notifications" in caplog.text
    assert "Sending notification to user" in caplog.text

    # Verify the log contains the correct metrics
    log_records = [r for r in caplog.records if "Sending notification to user" in r.message]
    assert len(log_records) == 1
    extra = log_records[0].__dict__
    assert extra["user_id"] == user.user_id
    assert extra["opportunity_count"] == 0
    assert extra["search_count"] == 1

    # Verify notification log was created
    notification_logs = (
        db_session.query(UserNotificationLog)
        .filter(UserNotificationLog.notification_reason == NotificationConstants.SEARCH_UPDATES)
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

    assert len(notification_logs) == 2
    assert notification_logs[0].notification_sent is True


def test_collect_notifications_cli(
    cli_runner, db_session, enable_factory_create, user, user_with_email, caplog
):
    """Simple test that verifies we can invoke the notification task via CLI"""
    # Create a saved opportunity that needs notification
    opportunity = factories.OpportunityFactory.create()
    saved_opportunity = factories.UserSavedOpportunityFactory.create(
        user=user,
        opportunity=opportunity,
        last_notified_at=opportunity.updated_at - timedelta(days=1),
    )
    factories.OpportunityChangeAuditFactory.create(
        opportunity=opportunity,
        updated_at=saved_opportunity.last_notified_at + timedelta(minutes=1),
    )

    result = cli_runner.invoke(args=["task", "generate-notifications"])

    assert result.exit_code == 0

    # Verify expected log messages
    assert "Collected opportunity notifications" in caplog.text
    assert "Sending notification to user" in caplog.text

    # Verify the log contains the correct metrics
    log_records = [r for r in caplog.records if "Sending notification to user" in r.message]
    assert len(log_records) == 1
    extra = log_records[0].__dict__
    assert extra["user_id"] == user.user_id
    assert extra["opportunity_count"] == 1
    assert extra["search_count"] == 0


def test_last_notified_at_updates(
    cli_runner, db_session, enable_factory_create, user, user_with_email
):
    """Test that last_notified_at gets updated after sending notifications"""
    # Create an opportunity that was updated after the last notification
    opportunity = factories.OpportunityFactory.create()
    saved_opp = factories.UserSavedOpportunityFactory.create(
        user=user,
        opportunity=opportunity,
        last_notified_at=opportunity.updated_at - timedelta(days=1),
    )
    factories.OpportunityChangeAuditFactory.create(
        opportunity=opportunity,
        updated_at=saved_opp.last_notified_at + timedelta(minutes=1),
    )
    # Store the original notification time
    original_notification_time = saved_opp.last_notified_at

    # Run the notification task
    result = cli_runner.invoke(args=["task", "generate-notifications"])
    assert result.exit_code == 0

    # Refresh the saved opportunity from the database
    db_session.refresh(saved_opp)

    # Verify last_notified_at was updated
    assert saved_opp.last_notified_at > original_notification_time
    # Verify last_notified_at is now after the opportunity's updated_at
    assert saved_opp.last_notified_at > opportunity.updated_at


def test_notification_log_creation(
    cli_runner, db_session, enable_factory_create, clear_notification_logs, user, user_with_email
):
    """Test that notification logs are created when notifications are sent"""
    # Create a saved opportunity that needs notification
    opportunity = factories.OpportunityFactory.create(no_current_summary=True)
    factories.OpportunitySummaryFactory.create(
        opportunity=opportunity,
        close_date=datetime_util.utcnow() + timedelta(days=21),
    )
    saved_opportunity = factories.UserSavedOpportunityFactory.create(
        user=user,
        opportunity=opportunity,
        last_notified_at=opportunity.updated_at - timedelta(days=1),
    )

    factories.OpportunityChangeAuditFactory.create(
        opportunity=opportunity,
        updated_at=saved_opportunity.last_notified_at + timedelta(minutes=1),
    )

    # Run the notification task
    result = cli_runner.invoke(args=["task", "generate-notifications"])
    assert result.exit_code == 0

    # Verify notification log was created
    notification_logs = db_session.query(UserNotificationLog).all()
    assert len(notification_logs) == 1

    log = notification_logs[0]
    assert log.user_id == user.user_id
    assert log.notification_reason == NotificationConstants.OPPORTUNITY_UPDATES
    assert log.notification_sent is True


def test_no_notification_log_when_no_updates(
    cli_runner, db_session, enable_factory_create, clear_notification_logs, user, user_with_email
):
    """Test that no notification log is created when there are no updates"""
    # Create a saved opportunity that doesn't need notification
    opportunity = factories.OpportunityFactory.create(no_current_summary=True)
    factories.OpportunitySummaryFactory.create(
        opportunity=opportunity,
        close_date=datetime_util.utcnow() + timedelta(days=21),
    )
    factories.UserSavedOpportunityFactory.create(
        user=user,
        opportunity=opportunity,
        last_notified_at=opportunity.updated_at + timedelta(minutes=1),  # After the update
    )

    # Run the notification task
    result = cli_runner.invoke(args=["task", "generate-notifications"])
    assert result.exit_code == 0

    # Verify no notification log was created
    notification_logs = db_session.query(UserNotificationLog).all()
    assert len(notification_logs) == 0


def test_combined_notifications_cli(
    cli_runner,
    db_session,
    enable_factory_create,
    user,
    user_with_email,
    caplog,
    clear_notification_logs,
):
    """Test that verifies we can handle both opportunity and search notifications together"""
    # Create a saved opportunity that needs notification
    opportunity = factories.OpportunityFactory.create(no_current_summary=True)
    factories.OpportunitySummaryFactory.create(
        opportunity=opportunity,
        close_date=datetime_util.utcnow() + timedelta(days=21),
    )
    saved_opportunity = factories.UserSavedOpportunityFactory.create(
        user=user,
        opportunity=opportunity,
        last_notified_at=opportunity.updated_at - timedelta(days=1),
    )
    factories.OpportunityChangeAuditFactory.create(
        opportunity=opportunity,
        updated_at=saved_opportunity.last_notified_at + timedelta(minutes=1),
    )

    # Create a saved search that needs notification
    saved_search = factories.UserSavedSearchFactory.create(
        user=user,
        search_query={"keywords": "test"},
        name="Test Search",
        last_notified_at=datetime_util.utcnow() - timedelta(days=1),
        searched_opportunity_ids=[1, 2, 3],
    )

    result = cli_runner.invoke(args=["task", "generate-notifications"])

    assert result.exit_code == 0

    # Verify expected log messages
    assert "Collected opportunity notifications" in caplog.text
    assert "Collected search notifications" in caplog.text
    assert "Sending notification to user" in caplog.text

    # Verify the log contains the correct metrics
    log_records = [r for r in caplog.records if "Sending notification to user" in r.message]
    assert len(log_records) == 1
    extra = log_records[0].__dict__
    assert extra["user_id"] == user.user_id
    assert extra["opportunity_count"] == 1
    assert extra["search_count"] == 1

    # Verify notification logs were created for both types
    notification_logs = db_session.query(UserNotificationLog).all()
    assert len(notification_logs) == 2

    notification_reasons = {log.notification_reason for log in notification_logs}
    assert notification_reasons == {
        NotificationConstants.OPPORTUNITY_UPDATES,
        NotificationConstants.SEARCH_UPDATES,
    }

    # Verify last_notified_at was updated for both
    db_session.refresh(saved_opportunity)
    db_session.refresh(saved_search)
    assert saved_opportunity.last_notified_at > datetime_util.utcnow() - timedelta(minutes=1)
    assert saved_search.last_notified_at > datetime_util.utcnow() - timedelta(minutes=1)


def test_grouped_search_queries_cli(
    cli_runner,
    db_session,
    enable_factory_create,
    clear_notification_logs,
    user,
    user_with_email,
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

    result = cli_runner.invoke(args=["task", "generate-notifications"])

    assert result.exit_code == 0

    # Verify notification logs were created for both users
    notification_logs = (
        db_session.query(UserNotificationLog)
        .filter(UserNotificationLog.notification_reason == NotificationConstants.SEARCH_UPDATES)
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
    task = NotificationTask(db_session, search_client)
    task.run()

    # Verify notification log was created due to changed results
    notification_logs = (
        db_session.query(UserNotificationLog)
        .filter(
            UserNotificationLog.user_id == user.user_id,
            UserNotificationLog.notification_reason == NotificationConstants.SEARCH_UPDATES,
        )
        .all()
    )
    assert len(notification_logs) == 1

    # Verify the saved search was updated with new results
    db_session.refresh(saved_search)
    assert 999 in saved_search.searched_opportunity_ids  # New opportunity should be in results
    assert saved_search.last_notified_at > datetime_util.utcnow() - timedelta(minutes=1)

    # Run the task again - should not generate new notifications since results haven't changed
    task_rerun = NotificationTask(db_session, search_client)
    task_rerun.run()

    notification_logs = (
        db_session.query(UserNotificationLog)
        .filter(
            UserNotificationLog.user_id == user.user_id,
            UserNotificationLog.notification_reason == NotificationConstants.SEARCH_UPDATES,
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


def test_closing_date_notifications(
    db_session, enable_factory_create, user_with_email, search_client, clear_notification_logs
):
    """Test that notifications are sent for opportunities closing in two weeks"""
    two_weeks_from_now = datetime_util.utcnow() + timedelta(days=14)

    # Create an opportunity closing in two weeks
    opportunity = factories.OpportunityFactory.create(no_current_summary=True)
    factories.OpportunitySummaryFactory.create(
        opportunity=opportunity, close_date=two_weeks_from_now
    )
    factories.UserSavedOpportunityFactory.create(user=user_with_email, opportunity=opportunity)

    # Create an opportunity closing in three weeks (shouldn't trigger notification)
    opportunity_later = factories.OpportunityFactory.create(no_current_summary=True)
    factories.OpportunitySummaryFactory.create(
        opportunity=opportunity_later, close_date=datetime_util.utcnow() + timedelta(days=21)
    )

    factories.UserSavedOpportunityFactory.create(
        user=user_with_email, opportunity=opportunity_later
    )

    _clear_mock_responses()

    # Run the notification task
    task = NotificationTask(db_session, search_client)
    task.run()

    # Verify notification log was created only for the opportunity closing in two weeks
    notification_logs = (
        db_session.execute(
            select(UserNotificationLog).where(
                UserNotificationLog.notification_reason
                == NotificationConstants.CLOSING_DATE_REMINDER
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


def test_closing_date_notification_not_sent_twice(
    db_session, enable_factory_create, user_with_email, search_client, clear_notification_logs
):
    """Test that closing date notifications aren't sent multiple times for the same opportunity"""
    two_weeks_from_now = datetime_util.utcnow() + timedelta(days=14)

    # Create an opportunity closing in two weeks
    opportunity = factories.OpportunityFactory.create(no_current_summary=True)
    factories.OpportunitySummaryFactory.create(
        opportunity=opportunity, close_date=two_weeks_from_now
    )
    factories.UserSavedOpportunityFactory.create(user=user_with_email, opportunity=opportunity)

    _clear_mock_responses()

    # Run the notification task
    task = NotificationTask(db_session, search_client)
    task.run()

    # Verify no new notification logs were created
    notification_logs = (
        db_session.execute(
            select(UserNotificationLog).where(
                UserNotificationLog.notification_reason
                == NotificationConstants.CLOSING_DATE_REMINDER
            )
        )
        .scalars()
        .all()
    )

    assert len(notification_logs) == 1  # Only the original notification log

    notification_opportunity_logs = (
        db_session.execute(
            select(UserOpportunityNotificationLog).where(
                UserOpportunityNotificationLog.user_id == user_with_email.user_id
                and UserOpportunityNotificationLog.opportunity_id == opportunity.opportunity_id
            )
        )
        .scalars()
        .all()
    )

    _clear_mock_responses()
    assert len(notification_opportunity_logs) == 1

    # Run the notification task
    task_again = NotificationTask(db_session, search_client)
    task_again.run()

    # Verify no emails were sent
    mock_responses = _get_mock_responses()
    print(mock_responses)
    assert len(mock_responses) == 0
