from datetime import date

import pytest
from freezegun import freeze_time

from src.constants.lookup_constants import OpportunityStatus, WorkflowType
from src.workflow.handler.event_handler import EventHandler
from src.workflow.state_machine.opportunity_publish_state_machine import OpportunityPublishState
from src.workflow.workflow_errors import InvalidEventError
from tests.src.db.models.factories import (
    OpportunityFactory,
    OpportunitySummaryFactory,
    UserFactory,
    WorkflowFactory,
)
from tests.workflow.workflow_test_util import build_start_workflow_event, send_process_event


@pytest.fixture(scope="module", autouse=True)
def setup_index(
    search_client, opportunity_index, opportunity_index_alias, workflow_client_registry
):
    """Setup the index - making sure the alias is set"""
    search_client.swap_alias_index(opportunity_index, opportunity_index_alias)


@pytest.mark.parametrize("is_draft", [True, False])
def test_opportunity_publish_happy_path(
    db_session, enable_factory_create, is_draft, caplog, search_client, opportunity_index_alias
):
    """Verify that sending a start_workflow event will go through the whole state machine"""
    user = UserFactory.create()
    # We verify it's the same regardless of the is_draft flag
    opportunity = OpportunityFactory.create(is_draft=is_draft)

    sqs_container = build_start_workflow_event(
        workflow_type=WorkflowType.OPPORTUNITY_PUBLISH,
        user=user,
        entity=opportunity,
    )

    # commit so the opportunity in the DB is updated
    with db_session.begin():
        state_machine = EventHandler(db_session, sqs_container).process()

    db_session.refresh(opportunity)
    assert opportunity.is_draft is False

    if is_draft is False:
        assert (
            "Opportunity that isn't currently a draft going through publishing flow."
            in caplog.messages
        )

    workflow = state_machine.workflow
    assert workflow.current_workflow_state == OpportunityPublishState.END

    # No approvals
    assert len(workflow.workflow_approvals) == 0

    # Just one event
    assert len(workflow.workflow_event_history) == 1
    assert workflow.workflow_event_history[0].is_successfully_processed is True

    # Several event transitions automatically fire in sequence
    assert len(workflow.workflow_audits) == 5
    audits = sorted(workflow.workflow_audits, key=lambda audit: audit.created_at)

    assert audits[0].source_state == OpportunityPublishState.START
    assert audits[0].target_state == OpportunityPublishState.PENDING_PUBLISH

    assert audits[1].source_state == OpportunityPublishState.PENDING_PUBLISH
    assert audits[1].target_state == OpportunityPublishState.DRAFT_FLAG_FLIPPED

    assert audits[2].source_state == OpportunityPublishState.DRAFT_FLAG_FLIPPED
    assert audits[2].target_state == OpportunityPublishState.CURRENT_OPPORTUNITY_SUMMARY_CALCULATED

    assert audits[3].source_state == OpportunityPublishState.CURRENT_OPPORTUNITY_SUMMARY_CALCULATED
    assert audits[3].target_state == OpportunityPublishState.OPPORTUNITY_WRITTEN_TO_SEARCH

    assert audits[4].source_state == OpportunityPublishState.OPPORTUNITY_WRITTEN_TO_SEARCH
    assert audits[4].target_state == OpportunityPublishState.END

    # Verify the opportunity is in the search index
    result = search_client.get(opportunity_index_alias, opportunity.opportunity_id)
    assert result is not None
    assert result["opportunity_id"] == str(opportunity.opportunity_id)
    assert result["opportunity_title"] == opportunity.opportunity_title


@pytest.mark.parametrize(
    "forecast_post_date,non_forecast_post_date,expected_is_forecast",
    [
        # Note we freeze the time to 2026-03-25 below
        #
        # No forecast / non-forecast
        (None, None, None),
        # No forecast, before post-date for non-forecast
        (None, date(2026, 4, 1), None),
        # No forecast, on post-date for non-forecast
        (None, date(2026, 3, 25), False),
        # Forecast before post-date, non-forecast after
        (date(2026, 3, 30), date(2026, 3, 15), False),
        # Forecast on post date, non-forecast on post date
        (date(2026, 3, 25), date(2026, 3, 25), False),
        # Forecast after post date, non-forecast before
        (date(2026, 3, 24), date(2026, 3, 30), True),
        # Forecast after post date, no non-forecast
        (date(2026, 3, 16), None, True),
    ],
)
@freeze_time("2026-03-25 12:00:00", tz_offset=0)
def test_opportunity_publish_calculate_current_opportunity_summary(
    db_session,
    enable_factory_create,
    forecast_post_date,
    non_forecast_post_date,
    expected_is_forecast,
    search_client,
    opportunity_index_alias,
):
    """Test that the opportunity status/current summary is calculated as expected."""
    user = UserFactory.create()
    # The is_draft flag will be flipped, if it weren't then the changes wouldn't work
    opportunity = OpportunityFactory.create(is_draft=True, no_current_summary=True)

    if forecast_post_date:
        OpportunitySummaryFactory.create(
            opportunity=opportunity,
            post_date=forecast_post_date,
            archive_date=date(2027, 1, 1),
            is_forecast=True,
        )

    if non_forecast_post_date:
        OpportunitySummaryFactory.create(
            opportunity=opportunity,
            post_date=non_forecast_post_date,
            close_date=date(2026, 6, 1),
            archive_date=date(2027, 1, 1),
            is_forecast=False,
        )

    sqs_container = build_start_workflow_event(
        workflow_type=WorkflowType.OPPORTUNITY_PUBLISH,
        user=user,
        entity=opportunity,
    )

    with db_session.begin():
        EventHandler(db_session, sqs_container).process()

    db_session.refresh(opportunity)
    assert opportunity.is_draft is False

    search_result = search_client.get(opportunity_index_alias, opportunity.opportunity_id)
    if expected_is_forecast is None:
        assert opportunity.current_opportunity_summary is None
        assert search_result is None
    else:
        assert opportunity.current_opportunity_summary is not None

        assert (
            opportunity.current_opportunity_summary.opportunity_summary.is_forecast
            == expected_is_forecast
        )
        assert opportunity.current_opportunity_summary.opportunity_status == (
            OpportunityStatus.FORECASTED if expected_is_forecast else OpportunityStatus.POSTED
        )

        assert search_result is not None
        assert search_result["opportunity_id"] == str(opportunity.opportunity_id)
        assert search_result["opportunity_title"] == opportunity.opportunity_title


@pytest.mark.parametrize(
    "current_workflow_state,event_to_send",
    [
        (OpportunityPublishState.START, "not-a-real-event"),
        (OpportunityPublishState.START, "finish_publish"),
        (OpportunityPublishState.END, "start_workflow"),
        (OpportunityPublishState.CURRENT_OPPORTUNITY_SUMMARY_CALCULATED, "flip_is_draft"),
    ],
)
def test_opportunity_publish_state_machine_invalid_events(
    db_session,
    enable_factory_create,
    current_workflow_state,
    event_to_send,
    search_client,
    opportunity_index_alias,
):
    user = UserFactory.create()
    opportunity = OpportunityFactory.create(is_draft=True)

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.OPPORTUNITY_PUBLISH,
        current_workflow_state=current_workflow_state,
        opportunity=opportunity,
    )

    with pytest.raises(InvalidEventError, match="Event is not valid for workflow"):
        send_process_event(
            db_session=db_session,
            event_to_send=event_to_send,
            workflow_id=workflow.workflow_id,
            user=user,
            # This won't matter as we won't check it due to the error
            expected_state=OpportunityPublishState.START,
        )

    search_result = search_client.get(opportunity_index_alias, opportunity.opportunity_id)
    assert search_result is None
