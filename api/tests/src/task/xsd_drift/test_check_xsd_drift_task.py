"""Tests for the XSD drift detection task."""

from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from src.task.xsd_drift.check_xsd_drift_task import CheckXsdDriftTask
from src.task.xsd_drift.config import XsdDriftConfig
from tests.conftest import BaseTestClass

SCHEMA_BASE_URL = "https://apply07.grants.gov/apply/forms/schemas"


@pytest.fixture
def xsd_drift_config():
    """Create config with cached Slack webhook URL to avoid AWS calls in tests."""
    config = XsdDriftConfig()
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


@pytest.fixture
def form_xsd_urls():
    """Fake form xsd_url values matching the committed test schemas."""
    return {
        f"{SCHEMA_BASE_URL}/Global-V1.0.xsd",
        f"{SCHEMA_BASE_URL}/SF424A-V1.0.xsd",
    }


class TestCheckXsdDriftTask(BaseTestClass):
    """Tests for CheckXsdDriftTask."""

    @pytest.fixture
    def task(self, db_session, xsd_drift_config, committed_xsd_dir, form_xsd_urls):
        task = CheckXsdDriftTask(
            db_session,
            xsd_drift_config=xsd_drift_config,
            committed_xsd_dir=committed_xsd_dir,
            xsd_urls=form_xsd_urls,
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
        assert task.metrics[CheckXsdDriftTask.Metrics.XSDS_MISSING] == 0

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
        assert task.metrics[CheckXsdDriftTask.Metrics.XSDS_MISSING] == 0
        assert task.increment.call_count == 1

    @patch("src.task.xsd_drift.check_xsd_drift_task.requests.post")
    @patch("src.task.xsd_drift.check_xsd_drift_task.tempfile.TemporaryDirectory")
    @patch("src.task.xsd_drift.check_xsd_drift_task.XSDFetcher")
    def test_missing_committed_xsd_is_reported_separately(
        self,
        mock_fetcher_cls,
        mock_tempdir_cls,
        mock_post,
        task,
        committed_xsd_dir,
        form_xsd_urls,
        tmp_path,
    ):
        """A downloaded XSD without a committed copy is reported as missing."""
        missing_url = f"{SCHEMA_BASE_URL}/NACI-V1.0.xsd"
        task.xsd_urls = form_xsd_urls | {missing_url}

        work_dir = tmp_path / "work"
        work_dir.mkdir()
        mock_tempdir_cls.return_value.__enter__.return_value = str(work_dir)

        def fake_fetch(xsd_url, visited=None):
            filename = xsd_url.split("/")[-1]
            destination = Path(work_dir) / filename
            if filename == "NACI-V1.0.xsd":
                destination.write_text("<xsd>new schema</xsd>")
            else:
                destination.write_bytes((committed_xsd_dir / filename).read_bytes())
            return {"fetched": [xsd_url], "stored": [], "errors": []}

        mock_fetcher = MagicMock()
        mock_fetcher.fetch_xsd_with_dependencies.side_effect = fake_fetch
        mock_fetcher_cls.return_value = mock_fetcher
        mock_post.return_value = MagicMock(status_code=200)
        mock_post.return_value.raise_for_status = MagicMock()

        task.run_task()

        assert task.metrics[CheckXsdDriftTask.Metrics.XSDS_CHECKED] == 3
        assert task.metrics[CheckXsdDriftTask.Metrics.XSDS_DRIFTED] == 0
        assert task.metrics[CheckXsdDriftTask.Metrics.XSDS_MISSING] == 1

        payload = mock_post.call_args.kwargs["json"]
        blocks = payload["attachments"][0]["blocks"]
        missing_section = next(
            block
            for block in blocks
            if block.get("type") == "section" and "no committed copy" in block["text"]["text"]
        )
        assert "NACI-V1.0.xsd" in missing_section["text"]["text"]

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
        assert task.metrics[CheckXsdDriftTask.Metrics.FETCH_ERRORS] == 1

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
        schemas = {
            "Global-V1.0.xsd": "https://apply07.grants.gov/apply/system/schemas/Global-V1.0.xsd",
            "SF424A-V1.0.xsd": "https://apply07.grants.gov/apply/forms/schemas/SF424A-V1.0.xsd",
            "NACI-V1.0.xsd": "https://apply07.grants.gov/apply/forms/schemas/NACI-V1.0.xsd",
        }
        payload = task._format_slack_message(schemas, {}, schemas_checked=24, fetch_errors=0)

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
        schemas = {
            "SF424A-V1.0.xsd": "https://apply07.grants.gov/apply/forms/schemas/SF424A-V1.0.xsd",
            "Global-V1.0.xsd": "https://apply07.grants.gov/apply/system/schemas/Global-V1.0.xsd",
            "NACI-V1.0.xsd": "https://apply07.grants.gov/apply/forms/schemas/NACI-V1.0.xsd",
        }
        payload = task._format_slack_message(schemas, {}, schemas_checked=24, fetch_errors=0)

        schema_section_text = payload["attachments"][0]["blocks"][1]["text"]["text"]
        lines = [line for line in schema_section_text.split("\n") if line.startswith("\u2022")]

        # Verify they're sorted
        assert "Global-V1.0.xsd" in lines[0]
        assert "NACI-V1.0.xsd" in lines[1]
        assert "SF424A-V1.0.xsd" in lines[2]

    def test_format_slack_message_reports_missing_schemas(self, task):
        """Missing committed XSDs get their own Slack section and metric."""
        missing = {
            "NewForm-V1.0.xsd": "https://apply07.grants.gov/apply/forms/schemas/NewForm-V1.0.xsd"
        }

        payload = task._format_slack_message({}, missing, schemas_checked=24, fetch_errors=0)
        blocks = payload["attachments"][0]["blocks"]
        section_texts = [
            block["text"]["text"]
            for block in blocks
            if block["type"] == "section" and "text" in block
        ]

        assert any("no committed copy" in text for text in section_texts)
        assert any("NewForm-V1.0.xsd" in text for text in section_texts)
        field_texts = [field["text"] for field in blocks[2]["fields"]]
        assert any("*Schemas missing:*\n1" in text for text in field_texts)


@patch("src.task.xsd_drift.config.boto3.client")
def test_xsd_drift_config_fetches_webhook_from_aws_when_not_cached(mock_boto_client, monkeypatch):
    """When not cached, webhook URL is retrieved from AWS Secrets Manager."""
    monkeypatch.delenv("AWS_REGION", raising=False)

    mock_sm_client = MagicMock()
    mock_sm_client.get_secret_value.return_value = {
        "SecretString": '{"webhook_url":"https://hooks.slack.com/services/AWS/WEBHOOK/URL"}'
    }
    mock_boto_client.return_value = mock_sm_client

    config = XsdDriftConfig()

    assert config.slack_webhook_url == "https://hooks.slack.com/services/AWS/WEBHOOK/URL"
    mock_boto_client.assert_called_once_with("secretsmanager", region_name="us-east-1")
    mock_sm_client.get_secret_value.assert_called_once_with(SecretId="security-hub-slack-webhook")


@patch("src.task.xsd_drift.config.boto3.client")
def test_xsd_drift_config_uses_cached_webhook_without_aws_call(mock_boto_client):
    """When cached webhook exists, AWS should not be called."""
    config = XsdDriftConfig()
    config._cached_webhook_url = "https://hooks.slack.com/services/CACHED/WEBHOOK/URL"

    assert config.slack_webhook_url == "https://hooks.slack.com/services/CACHED/WEBHOOK/URL"
    mock_boto_client.assert_not_called()
