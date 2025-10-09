import uuid
from datetime import date, timedelta

import pytest
from sqlalchemy import select

import tests.src.db.models.factories as factories
from src.adapters.aws.pinpoint_adapter import _clear_mock_responses, _get_mock_responses
from src.api.opportunities_v1.opportunity_schemas import OpportunityV1Schema
from src.constants.lookup_constants import OpportunityStatus
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import SuppressedEmail, UserNotificationLog, UserSavedSearch
from src.task.notifications.config import EmailNotificationConfig
from src.task.notifications.constants import NotificationReason
from src.task.notifications.email_notification import EmailNotificationTask
from src.task.notifications.search_notification import (
    UTM_TAG,
    SearchNotificationTask,
    _strip_pagination_params,
)
from src.util import datetime_util
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.api.opportunities_v1.test_opportunity_route_search import OPPORTUNITIES

notification_config = None


@pytest.fixture
def user_with_email(db_session, user, monkeypatch):
    monkeypatch.setenv("AWS_PINPOINT_APP_ID", "test-app-id")
    factories.LinkExternalUserFactory.create(user=user, email="test@example.com")
    return user


@pytest.fixture(scope="module")
def setup_opensearch_data(opportunity_index_alias, search_client):
    index_name = f"test-opportunity-index-{uuid.uuid4().int}"
    search_client.create_index(index_name)
    # Load into the search index
    schema = OpportunityV1Schema()
    json_records = [schema.dump(opportunity) for opportunity in OPPORTUNITIES]

    search_client.bulk_upsert(index_name, json_records, "opportunity_id")
    # Swap the search index alias
    search_client.swap_alias_index(index_name, opportunity_index_alias)

    yield index_name


@pytest.fixture(autouse=True)
def clear_data(db_session):
    """Clear all notification logs"""
    cascade_delete_from_db_table(db_session, UserNotificationLog)
    cascade_delete_from_db_table(db_session, Opportunity)
    cascade_delete_from_db_table(db_session, UserSavedSearch)
    cascade_delete_from_db_table(db_session, SuppressedEmail)


@pytest.fixture()
def notification_task(db_session, search_client):
    notification_config = EmailNotificationConfig()
    notification_config.reset_emails_without_sending = False
    notification_config.sync_suppressed_emails = False

    return SearchNotificationTask(
        db_session=db_session, search_client=search_client, notification_config=notification_config
    )


def test_search_notifications_cli(
    cli_runner,
    db_session,
    setup_opensearch_data,
    enable_factory_create,
    user,
    user_with_email,
    caplog,
):
    """Test that verifies we can collect and send search notifications via CLI"""

    # Update the search index with new data that will change the results
    for i in range(4, 6):
        opportunity = factories.OpportunityFactory.create(
            legacy_opportunity_id=i,
            opportunity_id=OPPORTUNITIES[i].opportunity_id,
            no_current_summary=True,
        )
        summary = factories.OpportunitySummaryFactory.create(
            opportunity=opportunity,
            post_date=date.fromisoformat("2025-01-31"),
            close_date=date.fromisoformat("2025-04-30"),
        )
        factories.CurrentOpportunitySummaryFactory.create(
            opportunity=opportunity,
            opportunity_summary=summary,
        )
    # Create a saved search that needs notification
    saved_search = factories.UserSavedSearchFactory.create(
        user=user,
        search_query={"keywords": "test"},
        name="Test Search",
        last_notified_at=datetime_util.utcnow() - timedelta(days=1),
        searched_opportunity_ids=[
            OPPORTUNITIES[0].opportunity_id,
            OPPORTUNITIES[1].opportunity_id,
            OPPORTUNITIES[2].opportunity_id,
        ],
    )

    notification_logs_count = (
        db_session.query(UserNotificationLog)
        .filter(UserNotificationLog.notification_reason == NotificationReason.SEARCH_UPDATES)
        .count()
    )

    _clear_mock_responses()

    result = cli_runner.invoke(
        args=["task", "email-notifications"],
        env={"RESET_EMAILS_WITHOUT_SENDING": "false", "SYNC_SUPPRESSED_EMAILS": "false"},
    )
    assert result.exit_code == 0

    # Verify expected log messages
    assert "Collected search notifications" in caplog.text
    assert "Created changed search email notification" in caplog.text
    assert "Sending notification to user" in caplog.text

    # Verify the log contains the correct metrics
    log_records = [
        r for r in caplog.records if "Successfully delivered notification to user" in r.message
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
    user,
    user_with_email,
):
    """Test that verifies we properly handle multiple users with the same search query"""
    # Create two users with the same search query
    user1 = factories.UserFactory.create()
    user2 = factories.UserFactory.create()
    factories.LinkExternalUserFactory.create(user=user1, email="user1@example.com")
    factories.LinkExternalUserFactory.create(user=user2, email="user2@example.com")

    # Update the search index with new data that will change the results
    for i in range(7, 9):
        opportunity = factories.OpportunityFactory.create(
            legacy_opportunity_id=i,
            opportunity_id=OPPORTUNITIES[i].opportunity_id,
            no_current_summary=True,
        )
        summary = factories.OpportunitySummaryFactory.create(
            opportunity=opportunity,
            post_date=date.fromisoformat("2025-01-31"),
            close_date=date.fromisoformat("2025-04-30"),
        )
        factories.CurrentOpportunitySummaryFactory.create(
            opportunity=opportunity,
            opportunity_summary=summary,
        )

    same_search_query = {"keywords": "shared search"}

    # Create saved searches with the same query but different results
    saved_search1 = factories.UserSavedSearchFactory.create(
        user=user1,
        search_query=same_search_query,
        name="User 1 Search",
        last_notified_at=datetime_util.utcnow() - timedelta(days=1),
        searched_opportunity_ids=[
            OPPORTUNITIES[0].opportunity_id,
            OPPORTUNITIES[1].opportunity_id,
            OPPORTUNITIES[2].opportunity_id,
        ],
    )

    saved_search2 = factories.UserSavedSearchFactory.create(
        user=user2,
        search_query=same_search_query,
        name="User 2 Search",
        last_notified_at=datetime_util.utcnow() - timedelta(days=1),
        searched_opportunity_ids=[
            OPPORTUNITIES[3].opportunity_id,
            OPPORTUNITIES[4].opportunity_id,
            OPPORTUNITIES[5].opportunity_id,
        ],
    )

    result = cli_runner.invoke(
        args=["task", "email-notifications"],
        env={"RESET_EMAILS_WITHOUT_SENDING": "false", "SYNC_SUPPRESSED_EMAILS": "false"},
    )

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
    db_session,
    enable_factory_create,
    user,
    user_with_email,
    setup_opensearch_data,
    search_client,
):
    """Test that verifies notifications are generated when search results change due to index updates"""
    # Create a saved search with initial results
    saved_search = factories.UserSavedSearchFactory.create(
        user=user,
        search_query={"keywords": "test"},
        name="Test Search",
        last_notified_at=datetime_util.utcnow() - timedelta(days=1),
        searched_opportunity_ids=[
            OPPORTUNITIES[0].opportunity_id,
            OPPORTUNITIES[1].opportunity_id,
        ],  # Initial results
    )

    # Update the search index with new data that will change the results
    schema = OpportunityV1Schema()
    new_opportunity = factories.OpportunityFactory.create(
        legacy_opportunity_id=999, opportunity_title="New Test Opportunity", no_current_summary=True
    )
    summary = factories.OpportunitySummaryFactory.build(
        opportunity=new_opportunity,
        summary_description="This should appear in test search results",
    )
    factories.CurrentOpportunitySummaryFactory.create(
        opportunity=new_opportunity, opportunity_summary=summary
    )

    json_record = schema.dump(new_opportunity)
    search_client.bulk_upsert(setup_opensearch_data, [json_record], "opportunity_id")

    # Run the notification task
    task = EmailNotificationTask(db_session, search_client, notification_config)
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
    assert (
        new_opportunity.opportunity_id in saved_search.searched_opportunity_ids
    )  # New opportunity should be in results
    assert saved_search.last_notified_at > datetime_util.utcnow() - timedelta(minutes=1)

    # Run the task again - should not generate new notifications since results haven't changed
    task_rerun = EmailNotificationTask(db_session, search_client, notification_config)
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
    cli_runner, db_session, enable_factory_create, user
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
        searched_opportunity_ids=[OPPORTUNITIES[0].opportunity_id, OPPORTUNITIES[1].opportunity_id],
    )

    params = _strip_pagination_params(saved_search.search_query)
    assert params.keys() == {"query"}


def test_search_notification_email_format_single_opportunity(
    cli_runner,
    db_session,
    setup_opensearch_data,
    enable_factory_create,
    user_with_email,
):
    """Test that verifies the format of search notification emails"""
    # Create test opportunities with known data
    opportunity1 = factories.OpportunityFactory.create(
        opportunity_id=OPPORTUNITIES[1].opportunity_id,
        legacy_opportunity_id=2,
        opportunity_title="2025 Port Infrastructure Development Program",
        no_current_summary=True,
    )
    summary1 = factories.OpportunitySummaryFactory.create(
        opportunity=opportunity1,
        post_date=date.fromisoformat("2025-01-31"),
        close_date=date.fromisoformat("2025-04-30"),
        award_floor=1_000_000,
        award_ceiling=112_500_000,
        expected_number_of_awards=40,
        is_cost_sharing=True,
        is_forecast=False,
    )
    factories.CurrentOpportunitySummaryFactory.create(
        opportunity=opportunity1,
        opportunity_summary=summary1,
        opportunity_status=OpportunityStatus.POSTED,
    )

    # Create saved searches
    factories.UserSavedSearchFactory.create(
        user=user_with_email,
        search_query={"keywords": "test"},
        name="Test Search",
        last_notified_at=datetime_util.utcnow() - timedelta(days=1),
        searched_opportunity_ids=[OPPORTUNITIES[0].opportunity_id],  # Test single opportunity
    )

    _clear_mock_responses()

    # Run notification task
    result = cli_runner.invoke(
        args=["task", "email-notifications"],
        env={"RESET_EMAILS_WITHOUT_SENDING": "false", "SYNC_SUPPRESSED_EMAILS": "false"},
    )
    assert result.exit_code == 0

    # Get the email content from mock responses
    mock_responses = _get_mock_responses()
    assert len(mock_responses) == 1

    assert (
        mock_responses[0][0]["MessageRequest"]["MessageConfiguration"]["EmailMessage"][
            "SimpleEmail"
        ]["Subject"]["Data"]
        == f"New Grant Published on {datetime_util.utcnow().strftime("%-m/%-d/%Y")}"
    )

    email_content = mock_responses[0][0]["MessageRequest"]["MessageConfiguration"]["EmailMessage"][
        "SimpleEmail"
    ]["TextPart"]["Data"]

    # Test single opportunity format
    expected_single = f"""A funding opportunity matching your saved search query was recently published.

<b><a href='http://localhost:8080/opportunity/{opportunity1.opportunity_id}{UTM_TAG}' target='_blank'>2025 Port Infrastructure Development Program</a></b>
Status: Posted
Submission period: 1/31/2025–4/30/2025
Award range: $1,000,000-$112,500,000
Expected awards: 40
Cost sharing: Yes

To unsubscribe from email notifications for this query, delete it from your saved search queries.""".replace(
        "\n", "<br/>"
    )

    assert email_content.strip() == expected_single.strip()


def test_search_notification_email_format_no_close_date(
    cli_runner,
    db_session,
    setup_opensearch_data,
    enable_factory_create,
    user_with_email,
):
    """Test that verifies the format of search notification emails when there's no close date"""
    # Create test opportunity with post date but no close date
    opportunity1 = factories.OpportunityFactory.create(
        opportunity_id=OPPORTUNITIES[2].opportunity_id,
        legacy_opportunity_id=3,
        opportunity_title="Ongoing Research Grant Program",
        no_current_summary=True,
    )
    summary1 = factories.OpportunitySummaryFactory.create(
        opportunity=opportunity1,
        post_date=date.fromisoformat("2025-02-15"),
        close_date=None,  # No close date - indefinite submission period
        award_floor=50_000,
        award_ceiling=500_000,
        expected_number_of_awards=10,
        is_cost_sharing=False,
        is_forecast=False,
    )
    factories.CurrentOpportunitySummaryFactory.create(
        opportunity=opportunity1,
        opportunity_summary=summary1,
        opportunity_status=OpportunityStatus.POSTED,
    )

    # Create saved searches
    factories.UserSavedSearchFactory.create(
        user=user_with_email,
        search_query={"keywords": "research"},
        name="Research Search",
        last_notified_at=datetime_util.utcnow() - timedelta(days=1),
        searched_opportunity_ids=[
            OPPORTUNITIES[0].opportunity_id,
            OPPORTUNITIES[1].opportunity_id,
        ],  # Previous results
    )

    _clear_mock_responses()

    # Run notification task
    result = cli_runner.invoke(
        args=["task", "email-notifications"],
        env={"RESET_EMAILS_WITHOUT_SENDING": "false", "SYNC_SUPPRESSED_EMAILS": "false"},
    )
    assert result.exit_code == 0

    # Get the email content from mock responses
    mock_responses = _get_mock_responses()
    assert len(mock_responses) == 1

    email_content = mock_responses[0][0]["MessageRequest"]["MessageConfiguration"]["EmailMessage"][
        "SimpleEmail"
    ]["TextPart"]["Data"]

    # Test opportunity with no close date format
    expected_content = f"""A funding opportunity matching your saved search query was recently published.

<b><a href='http://localhost:8080/opportunity/{opportunity1.opportunity_id}{UTM_TAG}' target='_blank'>Ongoing Research Grant Program</a></b>
Status: Posted
Submission period: 2/15/2025-(To be determined)
Award range: $50,000-$500,000
Expected awards: 10
Cost sharing: No

To unsubscribe from email notifications for this query, delete it from your saved search queries.""".replace(
        "\n", "<br/>"
    )

    assert email_content.strip() == expected_content.strip()


def test_search_notification_email_format_multiple_opportunities(
    cli_runner,
    db_session,
    setup_opensearch_data,
    enable_factory_create,
    user_with_email,
):
    """Test that verifies the format of search notification emails"""
    # Create test opportunities with known data
    opportunity1 = factories.OpportunityFactory.create(
        opportunity_id=OPPORTUNITIES[0].opportunity_id,
        legacy_opportunity_id=1,
        opportunity_title="2025 Port Infrastructure Development Program",
        no_current_summary=True,
    )
    summary1 = factories.OpportunitySummaryFactory.create(
        opportunity=opportunity1,
        post_date=date.fromisoformat("2025-01-31"),
        close_date=date.fromisoformat("2025-04-30"),
        award_floor=1_000_000,
        award_ceiling=112_500_000,
        expected_number_of_awards=40,
        is_cost_sharing=True,
        is_forecast=False,
    )
    factories.CurrentOpportunitySummaryFactory.create(
        opportunity=opportunity1,
        opportunity_summary=summary1,
        opportunity_status=OpportunityStatus.POSTED,
    )

    # Create a forecasted opportunity
    opportunity2 = factories.OpportunityFactory.create(
        opportunity_id=OPPORTUNITIES[1].opportunity_id,
        legacy_opportunity_id=2,
        opportunity_title="Cooperative Agreement for affiliated Partner with Rocky Mountains Cooperative Ecosystem Studies Unit (CESU)",
        no_current_summary=True,
    )
    summary2 = factories.OpportunitySummaryFactory.create(
        opportunity=opportunity2,
        award_floor=1,
        award_ceiling=30_000,
        expected_number_of_awards=None,
        is_cost_sharing=False,
        is_forecast=True,
    )
    factories.CurrentOpportunitySummaryFactory.create(
        opportunity=opportunity2,
        opportunity_summary=summary2,
        opportunity_status=OpportunityStatus.FORECASTED,
    )

    # Create saved searches
    factories.UserSavedSearchFactory.create(
        user=user_with_email,
        search_query={"keywords": "test"},
        name="Test Search",
        last_notified_at=datetime_util.utcnow() - timedelta(days=1),
        searched_opportunity_ids=[
            OPPORTUNITIES[2].opportunity_id,
        ],  # Test single opportunity
    )

    _clear_mock_responses()

    # Run notification task
    result = cli_runner.invoke(
        args=["task", "email-notifications"],
        env={"RESET_EMAILS_WITHOUT_SENDING": "false", "SYNC_SUPPRESSED_EMAILS": "false"},
    )
    assert result.exit_code == 0

    # Get the email content from mock responses
    mock_responses = _get_mock_responses()
    assert len(mock_responses) == 1

    assert (
        mock_responses[0][0]["MessageRequest"]["MessageConfiguration"]["EmailMessage"][
            "SimpleEmail"
        ]["Subject"]["Data"]
        == f"2 New Grants Published on {datetime_util.utcnow().strftime("%-m/%-d/%Y")}"
    )

    email_content = mock_responses[0][0]["MessageRequest"]["MessageConfiguration"]["EmailMessage"][
        "SimpleEmail"
    ]["TextPart"]["Data"]

    # Test single opportunity format
    expected_single = f"""The following funding opportunities matching your saved search queries were recently published.

<b><a href='http://localhost:8080/opportunity/{opportunity1.opportunity_id}{UTM_TAG}' target='_blank'>2025 Port Infrastructure Development Program</a></b>
Status: Posted
Submission period: 1/31/2025–4/30/2025
Award range: $1,000,000-$112,500,000
Expected awards: 40
Cost sharing: Yes

<b><a href='http://localhost:8080/opportunity/{opportunity2.opportunity_id}{UTM_TAG}' target='_blank'>Cooperative Agreement for affiliated Partner with Rocky Mountains Cooperative Ecosystem Studies Unit (CESU)</a></b>
Status: Forecasted
Submission period: To be announced.
Award range: $1-$30,000
Expected awards: --
Cost sharing: No

To unsubscribe from email notifications for a query, delete it from your saved search queries.""".replace(
        "\n", "<br/>"
    )

    assert email_content.strip() == expected_single.strip()


def test_search_notification_deleted_search(
    cli_runner,
    db_session,
    setup_opensearch_data,
    enable_factory_create,
    user_with_email,
    search_client,
    notification_task,
):
    opp = factories.OpportunityFactory.create(
        opportunity_id=OPPORTUNITIES[0].opportunity_id,
        no_current_summary=True,
        legacy_opportunity_id=5,
        opportunity_title="Grant Program",
    )
    summary = factories.OpportunitySummaryFactory.create(
        opportunity=opp, post_date=date.fromisoformat("2030-01-31")
    )
    factories.CurrentOpportunitySummaryFactory.create(
        opportunity=opp,
        opportunity_summary=summary,
        opportunity_status=OpportunityStatus.POSTED,
    )

    # Create saved searches
    factories.UserSavedSearchFactory.create(
        search_query={"keywords": "test"},
        user=user_with_email,
        searched_opportunity_ids=[OPPORTUNITIES[1].opportunity_id],
        last_notified_at=datetime_util.utcnow() - timedelta(days=1),
        is_deleted=True,
    )

    results = notification_task.collect_email_notifications()

    # assert deleted saved search is not picked up
    assert len(results) == 0


def test_search_notification_suppressed_email(
    cli_runner,
    db_session,
    setup_opensearch_data,
    enable_factory_create,
    user_with_email,
    search_client,
    notification_task,
):
    """Test that the user notification does not pick up users on suppression_list"""
    # create a suppressed email
    suppressed_user = factories.UserFactory.create()
    factories.LinkExternalUserFactory.create(user=suppressed_user, email="testing@example.com")

    factories.SuppressedEmailFactory(email=suppressed_user.email)

    opp = factories.OpportunityFactory.create(
        opportunity_id=OPPORTUNITIES[0].opportunity_id,
        no_current_summary=True,
        legacy_opportunity_id=4,
        opportunity_title="Scholarship Program",
    )
    summary = factories.OpportunitySummaryFactory.create(
        opportunity=opp, post_date=date.fromisoformat("2020-01-01")
    )
    factories.CurrentOpportunitySummaryFactory.create(
        opportunity=opp,
        opportunity_summary=summary,
        opportunity_status=OpportunityStatus.POSTED,
    )

    # Create saved searches for both users
    factories.UserSavedSearchFactory.create(
        search_query={"keywords": "test"},
        user=suppressed_user,
        searched_opportunity_ids=[OPPORTUNITIES[1].opportunity_id],
        last_notified_at=datetime_util.utcnow() - timedelta(days=1),
    )
    # Create a different user with the same saved opportunity
    factories.UserSavedSearchFactory.create(
        search_query={"keywords": "test"},
        user=user_with_email,
        searched_opportunity_ids=[OPPORTUNITIES[1].opportunity_id],
        last_notified_at=datetime_util.utcnow() - timedelta(days=1),
    )

    results = notification_task.collect_email_notifications()

    # assert suppressed user saved search is not picked up
    assert len(results) == 1
    assert results[0].user_id == user_with_email.user_id
