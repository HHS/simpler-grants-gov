import pytest

from analytics.datasets.deliverable_tasks import DeliverableTasks
from analytics.metrics.percent_complete import DeliverablePercentComplete


def task_row(
    deliverable: int,
    task: int,
    points: int = 1,
    status: str = "open",
) -> dict:
    """Create a sample row of the DeliverableTasks dataset"""
    return {
        "deliverable_number": deliverable,
        "deliverable_title": f"Deliverable {deliverable}",
        "task_number": task,
        "task_title": f"Task {task}",
        "points": points,
        "status": status,
    }


class TestDeliverablePercentComplete:
    """Tests the DeliverablePercentComplete metric"""

    def test_percent_complete_based_on_task_count(self):
        """Check that percent completion is correct when tasks are the unit"""
        # setup - create test dataset
        test_rows = [
            task_row(deliverable=1, task=1, status="open"),
            task_row(deliverable=1, task=2, status="closed"),
            task_row(deliverable=2, task=3, status="open"),
        ]
        test_data = DeliverableTasks.from_dict(test_rows)
        # execution
        df = DeliverablePercentComplete(test_data, unit="tasks").result
        df = df.set_index("deliverable_title")
        # validation - check number of rows returned
        assert len(df) == 2
        # validation - check totals
        assert df.loc["Deliverable 1", "total"] == 2
        assert df.loc["Deliverable 2", "total"] == 1
        # validation - check open
        assert df.loc["Deliverable 1", "open"] == 1
        assert df.loc["Deliverable 2", "open"] == 1
        # validation - check closed
        assert df.loc["Deliverable 1", "closed"] == 1
        assert df.loc["Deliverable 2", "closed"] == 0
        # validation - check percent complete
        assert df.loc["Deliverable 1", "percent_complete"] == 0.5
        assert df.loc["Deliverable 2", "percent_complete"] == 0.0

    def test_percent_complete_based_on_points(self):
        """"""
        # setup - create test dataset
        test_rows = [
            task_row(deliverable=1, task=1, points=1, status="open"),
            task_row(deliverable=1, task=2, points=3, status="closed"),
            task_row(deliverable=2, task=3, points=5, status="open"),
        ]
        test_data = DeliverableTasks.from_dict(test_rows)
        # execution
        df = DeliverablePercentComplete(test_data, unit="points").result
        df = df.set_index("deliverable_title")
        # validation - check number of rows returned
        assert len(df) == 2
        # validation - check totals
        assert df.loc["Deliverable 1", "total"] == 4
        assert df.loc["Deliverable 2", "total"] == 5
        # validation - check open
        assert df.loc["Deliverable 1", "open"] == 1
        assert df.loc["Deliverable 2", "open"] == 5
        # validation - check closed
        assert df.loc["Deliverable 1", "closed"] == 3
        assert df.loc["Deliverable 2", "closed"] == 0
        # validation - check percent complete
        assert df.loc["Deliverable 1", "percent_complete"] == 0.75
        assert df.loc["Deliverable 2", "percent_complete"] == 0.0
