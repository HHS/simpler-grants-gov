from datetime import date

import pytest
from freezegun import freeze_time
from sqlalchemy import select

from src.constants.lookup_constants import OpportunityStatus, WorkflowType
from src.db.models.opportunity_models import (
    OpportunityChangeAudit,
    OpportunityIndexDeleteQueue,
    OpportunityVersion,
)
from src.workflow.handler.event_handler import EventHandler
from src.workflow.registry.workflow_client_registry import get_workflow_client_registry
from src.workflow.state_machine.opportunity_publish_state_machine import OpportunityPublishState
from src.workflow.workflow_errors import InvalidEventError
from tests.src.db.models.factories import (
    CurrentOpportunitySummaryFactory,
    OpportunityChangeAuditFactory,
    OpportunityFactory,
    OpportunitySummaryFactory,
    UserFactory,
    WorkflowFactory,
)
from tests.src.workflow.workflow_test_util import build_start_workflow_event, send_process_event


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
    assert len(workflow.workflow_audits) == 6
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
    assert audits[4].target_state == OpportunityPublishState.OPPORTUNITY_VERSION_STORED

    assert audits[5].source_state == OpportunityPublishState.OPPORTUNITY_VERSION_STORED
    assert audits[5].target_state == OpportunityPublishState.END

    # Verify the opportunity is in the search index
    result = search_client.get(opportunity_index_alias, opportunity.opportunity_id)
    assert result is not None
    assert result["opportunity_id"] == str(opportunity.opportunity_id)
    assert result["opportunity_title"] == opportunity.opportunity_title

    # Verify a version was created immediately at publish time
    # a grantee saving the opportunity right now already has a version to
    # diff against, rather than waiting for the next hourly batch run.
    versions = db_session.scalars(
        select(OpportunityVersion).where(
            OpportunityVersion.opportunity_id == opportunity.opportunity_id
        )
    ).all()
    assert len(versions) == 1


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


def _get_change_audit(db_session, opportunity_id):
    return db_session.scalars(
        select(OpportunityChangeAudit).where(
            OpportunityChangeAudit.opportunity_id == opportunity_id
        )
    ).one_or_none()


def test_opportunity_publish_marks_loaded_to_search(
    db_session, enable_factory_create, search_client, opportunity_index_alias
):
    """A successful publish flags the change-audit record as already loaded to search."""
    user = UserFactory.create()
    opportunity = OpportunityFactory.create(is_draft=True)

    # In production the DB trigger queues the opportunity for indexing whenever it
    # changes. The test schema is built from the models without triggers, so we
    # create the queued change-audit record explicitly.
    OpportunityChangeAuditFactory.create(opportunity=opportunity, is_loaded_to_search=False)

    sqs_container = build_start_workflow_event(
        workflow_type=WorkflowType.OPPORTUNITY_PUBLISH,
        user=user,
        entity=opportunity,
    )

    with db_session.begin():
        EventHandler(db_session, sqs_container).process()

    db_session.expire_all()
    change_audit = _get_change_audit(db_session, opportunity.opportunity_id)
    assert change_audit.is_loaded_to_search is True


def test_opportunity_publish_search_failure_leaves_not_loaded(
    db_session, enable_factory_create, monkeypatch, search_client, opportunity_index_alias
):
    """When the search write fails, the workflow still completes and the opportunity stays queued for indexing."""
    user = UserFactory.create()
    opportunity = OpportunityFactory.create(is_draft=True)

    # Simulate the DB trigger having queued the opportunity for indexing (the test
    # schema is built from models without triggers).
    OpportunityChangeAuditFactory.create(opportunity=opportunity, is_loaded_to_search=False)

    def _raise_on_upsert(*args, **kwargs):
        raise Exception("simulated bulk_upsert failure")

    monkeypatch.setattr(
        get_workflow_client_registry().search_client, "bulk_upsert", _raise_on_upsert
    )

    sqs_container = build_start_workflow_event(
        workflow_type=WorkflowType.OPPORTUNITY_PUBLISH,
        user=user,
        entity=opportunity,
    )

    with db_session.begin():
        state_machine = EventHandler(db_session, sqs_container).process()

    # The failed search write doesn't error the workflow - it runs to completion
    assert state_machine.workflow.current_workflow_state == OpportunityPublishState.END

    # The opportunity was never written to the search index
    assert search_client.get(opportunity_index_alias, opportunity.opportunity_id) is None

    # is_loaded_to_search stays FALSE so the incremental job picks it up later
    db_session.expire_all()
    change_audit = _get_change_audit(db_session, opportunity.opportunity_id)
    assert change_audit.is_loaded_to_search is False


@freeze_time("2026-03-25 12:00:00", tz_offset=0)
def test_opportunity_publish_queues_for_search_removal_when_summary_dropped(
    db_session, enable_factory_create, search_client, opportunity_index_alias
):
    """When the publish state machine drops an existing current_opportunity_summary
    (e.g. post_date is in the future), it queues the opportunity for index removal.

    Covers the case where an opportunity was previously searchable but its summary
    can no longer be made public — e.g. post_date was moved to a future date before
    the publish workflow re-runs.
    """
    user = UserFactory.create()
    opportunity = OpportunityFactory.create(is_draft=True, no_current_summary=True)

    # Create a summary with a future post_date — can_summary_be_public() will return False
    summary = OpportunitySummaryFactory.create(
        opportunity=opportunity,
        post_date=date(2026, 4, 1),
        close_date=date(2026, 6, 1),
        archive_date=date(2027, 1, 1),
        is_forecast=False,
    )

    # Simulate a stale current_opportunity_summary (opportunity was previously in search)
    CurrentOpportunitySummaryFactory.create(opportunity=opportunity, opportunity_summary=summary)

    sqs_container = build_start_workflow_event(
        workflow_type=WorkflowType.OPPORTUNITY_PUBLISH,
        user=user,
        entity=opportunity,
    )

    with db_session.begin():
        EventHandler(db_session, sqs_container).process()

    db_session.expire_all()
    db_session.refresh(opportunity)

    # Post date is in the future → no current summary after publish
    assert opportunity.current_opportunity_summary is None

    # Opportunity should be queued for removal from the search index
    entry = db_session.scalar(
        select(OpportunityIndexDeleteQueue).where(
            OpportunityIndexDeleteQueue.opportunity_id == opportunity.opportunity_id
        )
    )
    assert entry is not None


def test_opportunity_publish_mark_loaded_failure_is_isolated(
    db_session, enable_factory_create, monkeypatch, caplog, search_client, opportunity_index_alias
):
    """A failure while marking the change-audit record is swallowed after a successful write.

    The write already succeeded, so publish completes and the failure is logged as a
    marking failure - not misattributed as a search-index write failure.
    """
    user = UserFactory.create()
    opportunity = OpportunityFactory.create(is_draft=True)
    OpportunityChangeAuditFactory.create(opportunity=opportunity, is_loaded_to_search=False)

    def _raise_on_select(*args, **kwargs):
        raise Exception("simulated change-audit lookup failure")

    # `select` is used only inside mark_loaded_to_search in this module
    monkeypatch.setattr(
        "src.workflow.state_machine.opportunity_publish_state_machine.select", _raise_on_select
    )

    sqs_container = build_start_workflow_event(
        workflow_type=WorkflowType.OPPORTUNITY_PUBLISH,
        user=user,
        entity=opportunity,
    )

    with db_session.begin():
        state_machine = EventHandler(db_session, sqs_container).process()

    # The marking failure doesn't error the workflow
    assert state_machine.workflow.current_workflow_state == OpportunityPublishState.END

    # The opportunity was still written to the search index before marking failed
    assert search_client.get(opportunity_index_alias, opportunity.opportunity_id) is not None

    # Logged as a marking failure, not a search-write failure
    assert "Failed to mark opportunity as loaded to search" in caplog.text
    assert "Failed to write opportunity to search index" not in caplog.text

    # Marking never took effect
    db_session.expire_all()
    change_audit = _get_change_audit(db_session, opportunity.opportunity_id)
    assert change_audit.is_loaded_to_search is False
