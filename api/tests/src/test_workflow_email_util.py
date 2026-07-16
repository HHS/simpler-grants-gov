from unittest.mock import Mock

import src.workflow.util.workflow_util as workflow_util
from src.workflow.event.workflow_metric_context import WorkflowMetricContext


def test_send_workflow_email_uses_local_capture(monkeypatch):
    state_machine_event = Mock()
    state_machine_event.get_log_extra.return_value = {}
    user = Mock()
    user.email = "recipient@example.com"
    user.user_id = "user-123"

    local_sender = Mock(return_value="<local-message-id>")
    ses_sender = Mock()
    monkeypatch.setattr(workflow_util, "send_local_email_if_enabled", local_sender)
    monkeypatch.setattr(workflow_util, "send_email", ses_sender)

    workflow_util.send_workflow_email(
        state_machine_event,
        user,
        subject="Workflow approval needed",
        message="<p>Please review this workflow.</p>",
    )

    local_sender.assert_called_once()
    local_call = local_sender.call_args.kwargs
    assert local_call["to_address"] == "recipient@example.com"
    assert local_call["subject"] == "Workflow approval needed"
    assert local_call["message"] == "<p>Please review this workflow.</p>"
    assert local_call["trace_id"]
    ses_sender.assert_not_called()
    state_machine_event.increment.assert_called_once_with(
        WorkflowMetricContext.Metrics.EMAIL_SENT_COUNT
    )


def test_send_workflow_email_uses_ses_when_local_capture_is_disabled(monkeypatch):
    state_machine_event = Mock()
    state_machine_event.get_log_extra.return_value = {}
    user = Mock()
    user.email = "recipient@example.com"
    user.user_id = "user-456"

    local_sender = Mock(return_value=None)
    ses_sender = Mock()
    monkeypatch.setattr(workflow_util, "send_local_email_if_enabled", local_sender)
    monkeypatch.setattr(workflow_util, "send_email", ses_sender)

    workflow_util.send_workflow_email(
        state_machine_event,
        user,
        subject="Workflow update",
        message="The workflow changed.",
    )

    local_sender.assert_called_once()
    ses_sender.assert_called_once_with(
        to_address="recipient@example.com",
        subject="Workflow update",
        message="The workflow changed.",
    )
