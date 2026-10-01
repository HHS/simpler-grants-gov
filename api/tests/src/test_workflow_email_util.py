from unittest.mock import Mock

import src.workflow.util.workflow_util as workflow_util
from src.workflow.event.workflow_metric_context import WorkflowMetricContext


def test_send_workflow_email_uses_email_router(monkeypatch):
    state_machine_event = Mock()
    state_machine_event.get_log_extra.return_value = {}
    user = Mock()
    user.email = "recipient@example.com"
    user.user_id = "user-123"

    email_sender = Mock(return_value="<message-id>")
    monkeypatch.setattr(workflow_util, "send_email_to_address", email_sender)

    workflow_util.send_workflow_email(
        state_machine_event,
        user,
        subject="Workflow approval needed",
        message="<p>Please review this workflow.</p>",
    )

    email_sender.assert_called_once()
    email_call = email_sender.call_args.kwargs
    assert email_call["to_address"] == "recipient@example.com"
    assert email_call["subject"] == "Workflow approval needed"
    assert email_call["message"] == "<p>Please review this workflow.</p>"
    assert email_call["trace_id"]
    state_machine_event.increment.assert_called_once_with(
        WorkflowMetricContext.Metrics.EMAIL_SENT_COUNT
    )
