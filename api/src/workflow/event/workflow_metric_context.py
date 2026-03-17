import time
from enum import StrEnum
from typing import Any


class WorkflowMetricContext:

    class Metrics(StrEnum):

        # This only counts the event handling time
        # and does not factor in time the SQS message
        # was sitting in the queue.
        EVENT_HANDLER_DURATION_SEC = "event_handler_duration_sec"

        APPROVAL_COUNT = "approval_count"
        EMAIL_SENT_COUNT = "email_sent_count"

        WORKFLOW_TRANSITION_COUNT = "workflow_transition_count"
        WORKFLOW_EVENT_COUNT = "workflow_event_count"

    metrics: dict[str, Any]

    def __init__(self) -> None:
        self.metrics = {metric: 0 for metric in self.Metrics}
        self.log_extra: dict[str, Any] = {}
        self.start_time = time.perf_counter()

    def increment(self, name: str, value: int = 1) -> None:
        if name not in self.metrics:
            self.metrics[name] = 0

        self.metrics[name] += value

    def set_metrics(self, metrics: dict[str, Any]) -> None:
        self.metrics |= metrics

    def set_metric(self, metric: str, value: Any) -> None:
        self.metrics[metric] = value

    def calc_duration(self) -> None:
        now = time.perf_counter()
        duration = round(now - self.start_time, 3)
        self.set_metric(self.Metrics.EVENT_HANDLER_DURATION_SEC, duration)

    def add_log_extra(self, log_extra: dict[str, Any]) -> None:
        self.log_extra |= log_extra
