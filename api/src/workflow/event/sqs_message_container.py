import dataclasses

from src.db.models.workflow_models import WorkflowEventHistory
from src.workflow.event.workflow_event import WorkflowEvent
from src.workflow.event.workflow_metric_context import WorkflowMetricContext


@dataclasses.dataclass
class SqsMessageContainer:
    receipt_handle: str
    workflow_event: WorkflowEvent
    history_event: WorkflowEventHistory

    workflow_metric_context: WorkflowMetricContext = dataclasses.field(
        default_factory=WorkflowMetricContext
    )

    def get_log_extra(self) -> dict:
        return self.workflow_event.get_log_extra() | {"receipt_handle": self.receipt_handle}
