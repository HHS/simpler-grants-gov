from datetime import timedelta

import tests.src.db.models.factories as factories


def test_via_cli(cli_runner, db_session, enable_factory_create, user):
    """Simple test that verifies we can invoke the notification task via CLI"""
    result = cli_runner.invoke(args=["task", "generate-notifications"])

    assert result.exit_code == 0


def test_collect_notifications_cli(cli_runner, db_session, enable_factory_create, user, caplog):
    """Simple test that verifies we can invoke the notification task via CLI"""
    # Create a saved opportunity that needs notification
    opportunity = factories.OpportunityFactory.create()
    factories.UserSavedOpportunityFactory.create(
        user=user,
        opportunity=opportunity,
        last_notified_at=opportunity.updated_at - timedelta(days=1),
    )

    result = cli_runner.invoke(args=["task", "generate-notifications"])

    assert result.exit_code == 0

    # Verify expected log messages
    assert "Collected opportunity notifications" in caplog.text
    assert "Would send notification to user" in caplog.text

    # Verify the log contains the correct metrics
    log_records = [r for r in caplog.records if "Would send notification to user" in r.message]
    assert len(log_records) == 1
    extra = log_records[0].__dict__
    assert extra["user_id"] == user.user_id
    assert extra["opportunity_count"] == 1
    assert extra["search_count"] == 0


def test_last_notified_at_updates(cli_runner, db_session, enable_factory_create, user):
    """Test that last_notified_at gets updated after sending notifications"""
    # Create an opportunity that was updated after the last notification
    opportunity = factories.OpportunityFactory.create()
    saved_opp = factories.UserSavedOpportunityFactory.create(
        user=user,
        opportunity=opportunity,
        last_notified_at=opportunity.updated_at - timedelta(days=1),
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
