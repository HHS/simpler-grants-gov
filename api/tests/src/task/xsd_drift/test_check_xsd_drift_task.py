"""Tests for the XSD drift detection task."""

from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from src.task.xsd_drift.check_xsd_drift_task import CheckXsdDriftTask
from src.task.xsd_drift.config import XsdDriftConfig
from tests.conftest import BaseTestClass


@pytest.fixture
def xsd_drift_config():
    """Create config with mocked webhook URL retrieval."""
    config = XsdDriftConfig(
        grants_gov_schema_base_url="https://apply07.grants.gov/apply/system/schemas",
    )
    # Directly set cached URL to avoid AWS calls in tests
    config._cached_webhook_url = "https://hooks.slack.com/services/TEST/WEBHOOK/URL"
    return config


@pytest.fixture
def committed_xsd_dir(tmp_path):
    """A fake 'committed xsds' dir with two schema files."""
    d = tmp_path / "committed"
    d.mkdir()
    (d / "Global-V1.0.xsd").write_text("<xsd>original global</xsd>")
    (d / "SF424A-V1.0.xsd").write_text("<xsd>original sf424a</xsd>")
    return d


class TestCheckXsdDriftTask(BaseTestClass):
    """Tests for CheckXsdDriftTask."""

    @pytest.fixture
    def task(self, db_session, xsd_drift_config, committed_xsd_dir):
        task = CheckXsdDriftTask(
            db_session,
            xsd_drift_config=xsd_drift_config,
            committed_xsd_dir=committed_xsd_dir,
        )
        task.increment = MagicMock(wraps=task.increment)
        return task

    def _mock_fetcher_writes_identical_files(self, tmp_dir, committed_dir):
        """Helper: make fetch_xsd_with_dependencies copy the committed file
        byte-for-byte into tmp_dir, simulating 'no drift'."""

        def fake_fetch(xsd_url, visited=None):
            filename = xsd_url.split("/")[-1]
            src = committed_dir / filename
            dst = Path(tmp_dir) / filename
            dst.write_bytes(src.read_bytes())
            return {"fetched": [xsd_url], "stored": [], "errors": []}

        return fake_fetch

    def _mock_fetcher_writes_changed_files(self, tmp_dir):
        """Helper: make fetch_xsd_with_dependencies write different content,
        simulating drift on every schema."""

        def fake_fetch(xsd_url, visited=None):
            filename = xsd_url.split("/")[-1]
            dst = Path(tmp_dir) / filename
            dst.write_text("<xsd>changed upstream content</xsd>")
            return {"fetched": [xsd_url], "stored": [], "errors": []}

        return fake_fetch

    @patch("src.task.xsd_drift.check_xsd_drift_task.requests.post")
    @patch("src.task.xsd_drift.check_xsd_drift_task.tempfile.TemporaryDirectory")
    @patch("src.task.xsd_drift.check_xsd_drift_task.XSDFetcher")
    def test_no_drift_does_not_alert_slack(
        self,
        mock_fetcher_cls,
        mock_tempdir_cls,
        mock_post,
        task,
        committed_xsd_dir,
        tmp_path,
    ):
        """When live XSDs match committed copies, no Slack alert is sent."""
        work_dir = tmp_path / "work"
        work_dir.mkdir()
        mock_tempdir_cls.return_value.__enter__.return_value = str(work_dir)

        mock_fetcher = MagicMock()
        mock_fetcher.fetch_xsd_with_dependencies.side_effect = (
            self._mock_fetcher_writes_identical_files(work_dir, committed_xsd_dir)
        )
        mock_fetcher_cls.return_value = mock_fetcher

        task.run_task()

        mock_post.assert_not_called()
        assert task.metrics[CheckXsdDriftTask.Metrics.XSDS_CHECKED] == 2
        assert task.metrics[CheckXsdDriftTask.Metrics.XSDS_DRIFTED] == 0

    @patch("src.task.xsd_drift.check_xsd_drift_task.requests.post")
    @patch("src.task.xsd_drift.check_xsd_drift_task.tempfile.TemporaryDirectory")
    @patch("src.task.xsd_drift.check_xsd_drift_task.XSDFetcher")
    def test_drift_detected_posts_slack_alert_with_schema_names(
        self,
        mock_fetcher_cls,
        mock_tempdir_cls,
        mock_post,
        task,
        tmp_path,
    ):
        """When live XSDs differ, a Slack alert naming the schemas is sent."""
        work_dir = tmp_path / "work"
        work_dir.mkdir()
        mock_tempdir_cls.return_value.__enter__.return_value = str(work_dir)

        mock_fetcher = MagicMock()
        mock_fetcher.fetch_xsd_with_dependencies.side_effect = (
            self._mock_fetcher_writes_changed_files(work_dir)
        )
        mock_fetcher_cls.return_value = mock_fetcher

        mock_post.return_value = MagicMock(status_code=200)
        mock_post.return_value.raise_for_status = MagicMock()

        task.run_task()

        mock_post.assert_called_once()
        _, kwargs = mock_post.call_args
        payload = kwargs["json"]
        blocks = payload["attachments"][0]["blocks"]
        schema_section_text = blocks[1]["text"]["text"]
        assert "Global-V1.0.xsd" in schema_section_text
        assert "SF424A-V1.0.xsd" in schema_section_text

        assert task.metrics[CheckXsdDriftTask.Metrics.XSDS_DRIFTED] == 2
        assert task.increment.call_count == 1

    @patch("src.task.xsd_drift.check_xsd_drift_task.requests.post")
    @patch("src.task.xsd_drift.check_xsd_drift_task.tempfile.TemporaryDirectory")
    @patch("src.task.xsd_drift.check_xsd_drift_task.XSDFetcher")
    def test_fetch_errors_are_tracked_and_do_not_crash_task(
        self,
        mock_fetcher_cls,
        mock_tempdir_cls,
        mock_post,
        task,
        tmp_path,
    ):
        """If grants.gov fetch fails for a schema, it's counted as an error
        and skipped, rather than blowing up the whole weekly run."""
        work_dir = tmp_path / "work"
        work_dir.mkdir()
        mock_tempdir_cls.return_value.__enter__.return_value = str(work_dir)

        mock_fetcher = MagicMock()
        mock_fetcher.fetch_xsd_with_dependencies.return_value = {
            "fetched": [],
            "stored": [],
            "errors": [{"url": "https://example.com/x.xsd", "error": "timeout"}],
        }
        mock_fetcher_cls.return_value = mock_fetcher

        task.run_task()

        mock_post.assert_not_called()
        assert task.metrics[CheckXsdDriftTask.Metrics.FETCH_ERRORS] == 2

    @patch("src.task.xsd_drift.check_xsd_drift_task.requests.post")
    @patch("src.task.xsd_drift.check_xsd_drift_task.tempfile.TemporaryDirectory")
    @patch("src.task.xsd_drift.check_xsd_drift_task.XSDFetcher")
    def test_slack_failure_raises_and_task_marked_failed(
        self,
        mock_fetcher_cls,
        mock_tempdir_cls,
        mock_post,
        task,
        tmp_path,
    ):
        """If the Slack webhook call fails, the exception should propagate
        so the job is marked failed (visible in New Relic / job log)."""
        work_dir = tmp_path / "work"
        work_dir.mkdir()
        mock_tempdir_cls.return_value.__enter__.return_value = str(work_dir)

        mock_fetcher = MagicMock()
        mock_fetcher.fetch_xsd_with_dependencies.side_effect = (
            self._mock_fetcher_writes_changed_files(work_dir)
        )
        mock_fetcher_cls.return_value = mock_fetcher

        mock_post.side_effect = Exception("slack unreachable")

        with pytest.raises(Exception, match="slack unreachable"):
            task.run_task()

    def test_format_slack_message_contains_schema_names(self, task):
        """Slack message formatting includes all schema names and proper structure."""
        schemas = ["Global-V1.0.xsd", "SF424A-V1.0.xsd", "NACI-V1.0.xsd"]
        payload = task._format_slack_message(schemas, schemas_checked=24, fetch_errors=0)

        blocks = payload["attachments"][0]["blocks"]

        header_block = blocks[0]
        assert header_block["type"] == "header"
        assert "XSD schema drift detected" in header_block["text"]["text"]

        schema_section_text = blocks[1]["text"]["text"]
        assert "Global-V1.0.xsd" in schema_section_text
        assert "SF424A-V1.0.xsd" in schema_section_text
        assert "NACI-V1.0.xsd" in schema_section_text
        assert "grants.gov" in schema_section_text
        assert "XML validation" in schema_section_text

        fields_block = blocks[2]
        field_texts = [f["text"] for f in fields_block["fields"]]
        assert any("*Schemas checked:*\n24" in t for t in field_texts)
        assert any("*Schemas drifted:*\n3" in t for t in field_texts)
        assert any("*Fetch errors:*\n0" in t for t in field_texts)

        actions_block = blocks[3]
        assert actions_block["elements"][0]["url"] == task.config.github_xsds_folder_url

        context_block = blocks[4]
        assert context_block["elements"][0]["text"] == "Weekly XSD Drift Check"

    def test_format_slack_message_sorted_alphabetically(self, task):
        """Slack message lists schemas in alphabetical order."""
        schemas = ["SF424A-V1.0.xsd", "Global-V1.0.xsd", "NACI-V1.0.xsd"]
        payload = task._format_slack_message(schemas, schemas_checked=24, fetch_errors=0)

        schema_section_text = payload["attachments"][0]["blocks"][1]["text"]["text"]
        lines = [line for line in schema_section_text.split("\n") if line.startswith("\u2022")]

        # Verify they're sorted
        assert "Global-V1.0.xsd" in lines[0]
        assert "NACI-V1.0.xsd" in lines[1]
        assert "SF424A-V1.0.xsd" in lines[2]
