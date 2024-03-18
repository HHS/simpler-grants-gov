"""Tests for analytics/datasets/percent_complete.py."""
from pathlib import Path  # noqa: I001

import pytest

from analytics.datasets.deliverable_tasks import DeliverableTasks
from analytics.metrics.percent_complete import DeliverablePercentComplete, Unit
from tests.conftest import MockSlackbot


def task_row(
    deliverable: int,
    task: int | None,
    deliverable_status: str | None = "In Progress",
    points: int | None = 1,
    status: str | None = "open",
) -> dict:
    """Create a sample row of the DeliverableTasks dataset."""
    return {
        "deliverable_number": deliverable,
        "deliverable_title": f"Deliverable {deliverable}",
        "deliverable_status": deliverable_status,
        "issue_number": task,
        "issue_title": f"Task {task}" if task else None,
        "points": points,
        "status": status,
    }


@pytest.fixture(name="percent_complete", scope="module")
def sample_percent_complete() -> DeliverablePercentComplete:
    """Create a sample burndown to simplify test setup."""
    # setup - create test data
    test_rows = [
        task_row(deliverable=1, task=1, status="open"),
        task_row(deliverable=1, task=2, status="closed"),
        task_row(deliverable=2, task=3, status="open"),
    ]
    test_data = DeliverableTasks.from_dict(test_rows)
    # return sprint burndown by points
    return DeliverablePercentComplete(test_data, unit=Unit.points)


class TestDeliverablePercentComplete:
    """Test the DeliverablePercentComplete metric."""

    def test_percent_complete_based_on_task_count(self):
        """Check that percent completion is correct when tasks are the unit."""
        # setup - create test dataset
        test_rows = [
            task_row(deliverable=1, task=1, status="open"),
            task_row(deliverable=1, task=2, status="closed"),
            task_row(deliverable=2, task=3, status="open"),
        ]
        test_data = DeliverableTasks.from_dict(test_rows)
        # execution
        df = DeliverablePercentComplete(test_data, unit=Unit.issues).results
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
        """Check that percent completion is correct when points are the unit."""
        # setup - create test dataset
        test_rows = [
            task_row(deliverable=1, task=1, points=1, status="open"),
            task_row(deliverable=1, task=2, points=3, status="closed"),
            task_row(deliverable=2, task=3, points=5, status="open"),
        ]
        test_data = DeliverableTasks.from_dict(test_rows)
        # execution
        df = DeliverablePercentComplete(test_data, unit=Unit.points).results
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

    def test_show_0_pct_for_deliverables_without_tasks(self):
        """Deliverables without tasks should show 0% complete instead of throwing an error."""
        # setup - create test dataset where deliverable 2 has no tasks
        test_rows = [
            task_row(deliverable=1, task=2, status="closed"),
            task_row(deliverable=2, task=None, status=None),
        ]
        test_data = DeliverableTasks.from_dict(test_rows)
        # execution - use tasks as the unit
        df = DeliverablePercentComplete(test_data, unit=Unit.issues).results
        df = df.set_index("deliverable_title")
        # validation - check number of rows returned
        assert len(df) == 2
        # validation - check totals
        assert df.loc["Deliverable 1", "total"] == 1
        assert df.loc["Deliverable 2", "total"] == 1
        # validation - check open
        assert df.loc["Deliverable 1", "open"] == 0
        assert df.loc["Deliverable 2", "open"] == 1
        # validation - check closed
        assert df.loc["Deliverable 1", "closed"] == 1
        assert df.loc["Deliverable 2", "closed"] == 0
        # validation - check percent complete
        assert df.loc["Deliverable 1", "percent_complete"] == 1.0
        assert df.loc["Deliverable 2", "percent_complete"] == 0.0

    def test_show_0_pct_for_deliverables_without_points(self):
        """Deliverables without points should show 0% complete instead of throwing an error."""
        # setup - create test dataset where deliverable 2 has no points
        test_rows = [
            task_row(deliverable=1, task=2, points=2, status="closed"),
            task_row(deliverable=2, task=None, points=None, status=None),
        ]
        test_data = DeliverableTasks.from_dict(test_rows)
        # execution - use points as the unit
        df = DeliverablePercentComplete(test_data, unit=Unit.points).results
        df = df.set_index("deliverable_title")
        # validation - check number of rows returned
        assert len(df) == 2
        # validation - check totals
        assert df.loc["Deliverable 1", "total"] == 2
        assert df.loc["Deliverable 2", "total"] == 0
        # validation - check open
        assert df.loc["Deliverable 1", "open"] == 0
        assert df.loc["Deliverable 2", "open"] == 0
        # validation - check closed
        assert df.loc["Deliverable 1", "closed"] == 2
        assert df.loc["Deliverable 2", "closed"] == 0
        # validation - check percent complete
        assert df.loc["Deliverable 1", "percent_complete"] == 1.0
        assert df.loc["Deliverable 2", "percent_complete"] == 0.0


class TestFilteringReportByDeliverableStatus:
    """Test the metric when we limit the set of deliverable statuses to include."""

    TEST_ROWS = [
        task_row(deliverable=1, task=1, status="closed", deliverable_status="Done"),
        task_row(deliverable=2, task=2, status="closed", deliverable_status="Open"),
        task_row(deliverable=2, task=3, status="open", deliverable_status="Open"),
    ]

    def test_filter_out_deliverables_with_excluded_status(self):
        """The results should exclude deliverables with a status that wasn't passed."""
        # setup - create test dataset
        test_data = DeliverableTasks.from_dict(self.TEST_ROWS)
        # execution
        df = DeliverablePercentComplete(
            test_data,
            unit=Unit.issues,
            statuses_to_include=["Open"],
        ).results
        df = df.set_index("deliverable_title")
        # validation
        assert len(df) == 1
        assert "Deliverable 1" not in df.index  # confirm deliverable 1 was dropped
        assert df.loc["Deliverable 2", "percent_complete"] == 0.5

    def test_invert_statuses_selected(self):
        """We should filter out the other deliverable if invert statuses selected."""
        # setup - create test dataset
        test_data = DeliverableTasks.from_dict(self.TEST_ROWS)
        # execution
        df = DeliverablePercentComplete(
            test_data,
            unit=Unit.issues,
            statuses_to_include=["Done"],  # changed
        ).results
        df = df.set_index("deliverable_title")
        # validation
        assert len(df) == 1
        assert "Deliverable 2" not in df.index  # confirm deliverable 2 was dropped
        assert df.loc["Deliverable 1", "percent_complete"] == 1

    def test_list_selected_statuses_in_slack_message(self):
        """If we filter on status, those statuses should be listed in the slack message."""
        # setup - create test dataset
        test_data = DeliverableTasks.from_dict(self.TEST_ROWS)
        # execution
        metric = DeliverablePercentComplete(
            test_data,
            unit=Unit.issues,
            statuses_to_include=["Open"],
        )
        output = metric.format_slack_message()
        # validation
        expected = "Limited to deliverables with these statuses: Open"
        assert expected in output

    def test_stats_also_filter_out_deliverables_with_excluded_status(self):
        """Filtered deliverables should also be excluded from get_stats()."""
        # setup - create test dataset
        test_data = DeliverableTasks.from_dict(self.TEST_ROWS)
        # execution
        metric = DeliverablePercentComplete(
            test_data,
            unit=Unit.issues,
            statuses_to_include=["Open"],  # exclude deliverable 1
        )
        output = metric.get_stats()
        # validation
        assert len(output) == 1
        assert output.get("Deliverable 1") is None


class TestGetStats:
    """Test the DeliverablePercentComplete.get_stats() method."""

    def test_all_issues_are_pointed(self):
        """Test that stats show 100% of issues are pointed if all have points."""
        # setup - create test dataset
        test_rows = [
            task_row(deliverable=1, task=1, points=2, status="open"),
            task_row(deliverable=1, task=2, points=1, status="closed"),
            task_row(deliverable=2, task=3, points=3, status="open"),
            task_row(deliverable=2, task=3, points=1, status="open"),
        ]
        test_data = DeliverableTasks.from_dict(test_rows)
        # execution
        output = DeliverablePercentComplete(test_data, unit=Unit.issues)
        # validation
        assert len(output.stats) == 2
        for deliverable in ["Deliverable 1", "Deliverable 2"]:
            stat = output.stats.get(deliverable)
            assert stat is not None
            assert stat.value == 100
            assert stat.suffix == f"% of {Unit.issues.value} pointed"

    def test_some_issues_are_not_pointed(self):
        """Test that stats are calculated correctly if not all issues are pointed."""
        # setup - create test dataset
        test_rows = [
            task_row(deliverable=1, task=1, points=2, status="open"),
            task_row(deliverable=1, task=2, points=0, status="closed"),
            task_row(deliverable=2, task=3, points=3, status="open"),
            task_row(deliverable=2, task=3, points=None, status="open"),
        ]
        test_data = DeliverableTasks.from_dict(test_rows)
        # execution
        output = DeliverablePercentComplete(test_data, unit=Unit.issues)
        # validation
        assert len(output.stats) == 2
        for deliverable in ["Deliverable 1", "Deliverable 2"]:
            stat = output.stats.get(deliverable)
            assert stat is not None
            assert stat.value == 50
            assert stat.suffix == f"% of {Unit.issues.value} pointed"

    def test_deliverables_without_tasks_have_0_pct_pointed(self):
        """Deliverables without tasks should have 0% pointed in stats."""
        # setup - create test dataset
        test_rows = [
            task_row(deliverable=1, task=1, points=2, status="open"),
            task_row(deliverable=1, task=2, points=1, status="closed"),
            task_row(deliverable=2, task=None, points=None, status=None),
        ]
        test_data = DeliverableTasks.from_dict(test_rows)
        # execution
        output = DeliverablePercentComplete(test_data, unit=Unit.issues)
        # validation
        assert len(output.stats) == 2
        assert output.stats["Deliverable 1"].value == 100
        assert output.stats["Deliverable 2"].value == 0


class TestFormatSlackMessage:
    """Test the DeliverablePercentComplete.format_slack_message()."""

    def test_slack_message_contains_right_number_of_lines(self):
        """Message should contain one line for the title and one for each deliverable."""
        # setup - create test dataset
        test_rows = [
            task_row(deliverable=1, task=1, points=2, status="open"),
            task_row(deliverable=2, task=2, points=1, status="closed"),
            task_row(deliverable=3, task=3, points=3, status="open"),
        ]
        test_data = DeliverableTasks.from_dict(test_rows)
        # execution
        output = DeliverablePercentComplete(test_data, unit=Unit.issues)
        lines = output.format_slack_message().splitlines()
        # validation
        assert len(lines) == 4

    def test_title_includes_issues_when_unit_is_issue(self):
        """Test that the title is formatted correctly when unit is issues."""
        # setup - create test dataset
        test_rows = [
            task_row(deliverable=1, task=1, points=2, status="open"),
            task_row(deliverable=2, task=2, points=1, status=None),
        ]
        test_data = DeliverableTasks.from_dict(test_rows)
        # execution
        output = DeliverablePercentComplete(test_data, unit=Unit.issues)
        title = output.format_slack_message().splitlines()[0]
        # validation
        assert Unit.issues.value in title

    def test_title_includes_points_when_unit_is_points(self):
        """Test that the title is formatted correctly when unit is points."""
        # setup - create test dataset
        test_rows = [
            task_row(deliverable=1, task=1, points=2, status="open"),
            task_row(deliverable=2, task=2, points=1, status=None),
        ]
        test_data = DeliverableTasks.from_dict(test_rows)
        # execution
        output = DeliverablePercentComplete(test_data, unit=Unit.points)
        title = output.format_slack_message().splitlines()[0]
        # validation
        assert Unit.points.value in title


class TestPlotResults:
    """Test the DeliverablePercentComplete.plot_results() method."""

    def test_plot_results_output_stored_in_chart_property(self):
        """SprintBurndown.chart should contain the output of plot_results()."""
        # setup - create test dataset
        test_rows = [
            task_row(deliverable=1, task=1, points=2, status="open"),
            task_row(deliverable=1, task=2, points=0, status="closed"),
            task_row(deliverable=2, task=3, points=3, status="open"),
            task_row(deliverable=2, task=3, points=None, status="open"),
        ]
        test_data = DeliverableTasks.from_dict(test_rows)
        # execution
        output = DeliverablePercentComplete(test_data, unit=Unit.issues)
        # validation - check that the chart attribute matches output of plot_results()
        assert output.chart == output.plot_results()


class TestExportMethods:
    """Test the export methods method for SprintBurndown."""

    @pytest.mark.parametrize(
        ("method", "file_name"),
        [
            ("export_results", "RESULTS_CSV"),
            ("export_chart_to_html", "CHART_HTML"),
            ("export_chart_to_png", "CHART_PNG"),
        ],
    )
    def test_export_results_to_correct_file_path(
        self,
        method: str,
        file_name: str,
        tmp_path: Path,
        percent_complete: DeliverablePercentComplete,
    ):
        """The file should be exported to the correct location."""
        # setup - check that file doesn't exist at output location
        file_name = getattr(percent_complete, file_name)
        expected_path = tmp_path / file_name
        assert expected_path.parent.exists() is True
        assert expected_path.exists() is False
        # execution
        func = getattr(percent_complete, method)
        output = func(output_dir=expected_path.parent)
        # validation - check that output path matches expected and file exists
        assert output == expected_path
        assert expected_path.exists()

    @pytest.mark.parametrize(
        ("method", "file_name"),
        [
            ("export_results", "RESULTS_CSV"),
            ("export_chart_to_html", "CHART_HTML"),
            ("export_chart_to_png", "CHART_PNG"),
        ],
    )
    def test_create_parent_dir_if_it_does_not_exists(
        self,
        method: str,
        file_name: str,
        tmp_path: Path,
        percent_complete: DeliverablePercentComplete,
    ):
        """The parent directory should be created if it doesn't already exist."""
        # setup - check that file and parent directory don't exist
        file_name = getattr(percent_complete, file_name)
        expected_path = tmp_path / "new_folder" / file_name
        assert expected_path.parent.exists() is False  # doesn't yet exist
        assert expected_path.exists() is False
        # execution
        func = getattr(percent_complete, method)
        output = func(output_dir=expected_path.parent)
        # validation - check that output path matches expected and file exists
        assert output == expected_path
        assert expected_path.exists()


def test_post_to_slack(
    mock_slackbot: MockSlackbot,
    tmp_path: Path,
    percent_complete: DeliverablePercentComplete,
):
    """Test the steps required to post the results to slack, without actually posting."""
    # execution
    percent_complete.post_results_to_slack(
        mock_slackbot,  # type: ignore noqa: PGH003
        channel_id="test_channel",
        output_dir=tmp_path,
    )
    # validation - check that output files exist
    for output in ["RESULTS_CSV", "CHART_PNG", "CHART_HTML"]:
        output_path = tmp_path / getattr(percent_complete, output)
        assert output_path.exists() is True
