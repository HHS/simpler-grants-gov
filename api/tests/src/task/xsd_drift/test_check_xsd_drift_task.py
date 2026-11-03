"""Tests for the XSD drift detection task."""

from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from src.task.xsd_drift.check_xsd_drift_task import CheckXsdDriftTask
from src.task.xsd_drift.config import XsdDriftConfig
from tests.conftest import BaseTestClass

SCHEMA_BASE_URL = "https://apply07.grants.gov/apply/forms/schemas"


@pytest.fixture
def committed_xsd_dir(tmp_path):
    committed_dir = tmp_path / "committed"
    committed_dir.mkdir()
    (committed_dir / "Global-V1.0.xsd").write_bytes(b"original global")
    (committed_dir / "SF424A-V1.0.xsd").write_bytes(b"original sf424a")
    return committed_dir


@pytest.fixture
def form_xsd_urls():
    return {
        f"{SCHEMA_BASE_URL}/Global-V1.0.xsd",
        f"{SCHEMA_BASE_URL}/SF424A-V1.0.xsd",
    }


@pytest.fixture
def task(db_session, committed_xsd_dir, form_xsd_urls):
    task = CheckXsdDriftTask(
        db_session,
        xsd_drift_config=XsdDriftConfig(),
        committed_xsd_dir=committed_xsd_dir,
        xsd_urls=form_xsd_urls,
    )
    task.increment = MagicMock(wraps=task.increment)
    return task


class TestCheckXsdDriftTaskInit(BaseTestClass):
    @patch("src.task.xsd_drift.check_xsd_drift_task._build_xml_form_xsd_url_map")
    @patch("src.task.xsd_drift.check_xsd_drift_task.init_form_registry")
    def test_constructor_resolves_xsd_urls_when_not_provided(
        self, mock_init_form_registry, mock_build_url_map, db_session, committed_xsd_dir
    ):
        mock_build_url_map.return_value = {
            "global": f"{SCHEMA_BASE_URL}/Global-V1.0.xsd",
            "sf424a": f"{SCHEMA_BASE_URL}/SF424A-V1.0.xsd",
        }

        task = CheckXsdDriftTask(
            db_session,
            xsd_drift_config=XsdDriftConfig(),
            committed_xsd_dir=committed_xsd_dir,
        )

        mock_init_form_registry.assert_called_once()
        mock_build_url_map.assert_called_once()
        assert task.xsd_urls == {
            f"{SCHEMA_BASE_URL}/Global-V1.0.xsd",
            f"{SCHEMA_BASE_URL}/SF424A-V1.0.xsd",
        }

    @patch("src.task.xsd_drift.check_xsd_drift_task._build_xml_form_xsd_url_map")
    @patch("src.task.xsd_drift.check_xsd_drift_task.init_form_registry")
    def test_constructor_uses_provided_xsd_urls_without_resolving(
        self,
        mock_init_form_registry,
        mock_build_url_map,
        db_session,
        committed_xsd_dir,
        form_xsd_urls,
    ):
        task = CheckXsdDriftTask(
            db_session,
            xsd_drift_config=XsdDriftConfig(),
            committed_xsd_dir=committed_xsd_dir,
            xsd_urls=form_xsd_urls,
        )

        mock_init_form_registry.assert_not_called()
        mock_build_url_map.assert_not_called()
        assert task.xsd_urls == form_xsd_urls


class TestCheckXsdDriftTask(BaseTestClass):
    def _mock_fetcher(self, work_dir, committed_xsd_dir, changed_files=()):
        def fake_fetch(xsd_url):
            filename = Path(xsd_url).name
            destination = Path(work_dir) / filename
            if filename in changed_files:
                destination.write_bytes(b"changed upstream content")
            else:
                destination.write_bytes((committed_xsd_dir / filename).read_bytes())
            return {"fetched": [xsd_url], "stored": [], "errors": []}

        return fake_fetch

    @patch("src.task.xsd_drift.check_xsd_drift_task.tempfile.TemporaryDirectory")
    @patch("src.task.xsd_drift.check_xsd_drift_task.XSDFetcher")
    def test_matching_xsds_do_not_log_alert(
        self, mock_fetcher_cls, mock_tempdir_cls, task, committed_xsd_dir, tmp_path, caplog
    ):
        work_dir = tmp_path / "work"
        work_dir.mkdir()
        mock_tempdir_cls.return_value.__enter__.return_value = str(work_dir)
        mock_fetcher_cls.return_value.fetch_xsd_with_dependencies.side_effect = self._mock_fetcher(
            work_dir, committed_xsd_dir
        )

        task.run_task()

        assert task.metrics[CheckXsdDriftTask.Metrics.XSDS_CHECKED] == 2
        assert task.metrics[CheckXsdDriftTask.Metrics.XSDS_DRIFTED] == 0
        assert "XSD schema drift detected" not in caplog.text
        task.increment.assert_not_called()

    @patch("src.task.xsd_drift.check_xsd_drift_task.tempfile.TemporaryDirectory")
    @patch("src.task.xsd_drift.check_xsd_drift_task.XSDFetcher")
    def test_changed_xsd_logs_schema_details_for_new_relic(
        self, mock_fetcher_cls, mock_tempdir_cls, task, committed_xsd_dir, tmp_path, caplog
    ):
        work_dir = tmp_path / "work"
        work_dir.mkdir()
        mock_tempdir_cls.return_value.__enter__.return_value = str(work_dir)
        mock_fetcher_cls.return_value.fetch_xsd_with_dependencies.side_effect = self._mock_fetcher(
            work_dir, committed_xsd_dir, {"Global-V1.0.xsd"}
        )

        task.run_task()

        alert = next(record for record in caplog.records if record.levelname == "ERROR")
        assert alert.message.startswith("XSD schema drift detected")
        assert alert.alert_type == "xsd_schema_drift"
        assert alert.drifted_schemas == ["Global-V1.0.xsd"]
        assert alert.drifted_schema_urls == {
            "Global-V1.0.xsd": f"{SCHEMA_BASE_URL}/Global-V1.0.xsd"
        }
        assert task.metrics[CheckXsdDriftTask.Metrics.XSDS_DRIFTED] == 1
        task.increment.assert_called_once_with(CheckXsdDriftTask.Metrics.DRIFT_ALERT_LOGGED)

    @patch("src.task.xsd_drift.check_xsd_drift_task.tempfile.TemporaryDirectory")
    @patch("src.task.xsd_drift.check_xsd_drift_task.XSDFetcher")
    def test_fetch_error_is_logged_for_new_relic(
        self, mock_fetcher_cls, mock_tempdir_cls, task, tmp_path, caplog
    ):
        work_dir = tmp_path / "work"
        work_dir.mkdir()
        mock_tempdir_cls.return_value.__enter__.return_value = str(work_dir)
        mock_fetcher_cls.return_value.fetch_xsd_with_dependencies.return_value = {
            "fetched": [],
            "stored": [],
            "errors": [{"url": "https://example.com/broken.xsd", "error": "timeout"}],
        }

        task.run_task()

        alert = next(record for record in caplog.records if record.levelname == "ERROR")
        assert alert.fetch_error_count == 1
        assert alert.fetch_error_urls == ["https://example.com/broken.xsd"]
        assert task.metrics[CheckXsdDriftTask.Metrics.FETCH_ERRORS] == 1

    @patch("src.task.xsd_drift.check_xsd_drift_task.tempfile.TemporaryDirectory")
    @patch("src.task.xsd_drift.check_xsd_drift_task.XSDFetcher")
    def test_missing_committed_counterpart_logs_alert(
        self, mock_fetcher_cls, mock_tempdir_cls, db_session, committed_xsd_dir, tmp_path, caplog
    ):
        """A schema fetched from grants.gov with no committed counterpart
        (i.e. only present in the temp dir, dircmp's ``left_only``) should
        be reported as missing rather than silently skipped."""
        work_dir = tmp_path / "work"
        work_dir.mkdir()
        mock_tempdir_cls.return_value.__enter__.return_value = str(work_dir)

        new_schema_url = f"{SCHEMA_BASE_URL}/NewSchema-V1.0.xsd"
        xsd_urls = {
            f"{SCHEMA_BASE_URL}/Global-V1.0.xsd",
            f"{SCHEMA_BASE_URL}/SF424A-V1.0.xsd",
            new_schema_url,
        }
        task = CheckXsdDriftTask(
            db_session,
            xsd_drift_config=XsdDriftConfig(),
            committed_xsd_dir=committed_xsd_dir,
            xsd_urls=xsd_urls,
        )
        task.increment = MagicMock(wraps=task.increment)

        def fake_fetch(xsd_url):
            filename = Path(xsd_url).name
            destination = Path(work_dir) / filename
            if filename == "NewSchema-V1.0.xsd":
                destination.write_bytes(b"brand new schema content")
            else:
                destination.write_bytes((committed_xsd_dir / filename).read_bytes())
            return {"fetched": [xsd_url], "stored": [], "errors": []}

        mock_fetcher_cls.return_value.fetch_xsd_with_dependencies.side_effect = fake_fetch

        task.run_task()

        alert = next(record for record in caplog.records if record.levelname == "ERROR")
        assert alert.missing_schemas == ["NewSchema-V1.0.xsd"]
        assert alert.missing_schema_urls == {"NewSchema-V1.0.xsd": new_schema_url}
        assert task.metrics[CheckXsdDriftTask.Metrics.XSDS_MISSING] == 1
        assert task.metrics[CheckXsdDriftTask.Metrics.XSDS_CHECKED] == 3
        task.increment.assert_called_once_with(CheckXsdDriftTask.Metrics.DRIFT_ALERT_LOGGED)
