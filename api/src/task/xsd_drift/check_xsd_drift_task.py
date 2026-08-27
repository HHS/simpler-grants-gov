"""Task to detect drift between committed XSDs and the live grants.gov copies.


Runs daily. Downloads the latest XSDs from grants.gov into a temp directory,
compares them (by content hash) against the copies committed in
``src/services/xml_generation/xsds``, and logs an actionable ERROR-level
alert naming any schemas that changed so the team can refresh the committed
copies and re-run XML validation. New Relic is configured to watch for that
log line and notify the team's Slack channel from there - this task does not
call Slack directly.
"""

import filecmp
import logging
import tempfile
from enum import StrEnum
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from grants_shared.adapters import db
from grants_shared.adapters.db import flask_db
from grants_shared.task.ecs_background_task import ecs_background_task

from src.constants.lookup_constants import JobType
from src.form_schema.forms import init_form_registry
from src.services.xml_generation.config import _build_xml_form_xsd_url_map
from src.services.xml_generation.validation.xsd_fetcher import XSDFetcher
from src.task.task import Task
from src.task.task_blueprint import task_blueprint
from src.task.xsd_drift.config import XsdDriftConfig, get_xsd_drift_config

logger = logging.getLogger(__name__)


# Directory containing the XSDs committed to the repo (source of truth
# used for XML validation elsewhere in the codebase).
COMMITTED_XSD_DIR = Path(__file__).parent.parent.parent / "services" / "xml_generation" / "xsds"


@task_blueprint.cli.command(
    "check-xsd-drift", help="Check for drift between committed XSDs and grants.gov"
)
@ecs_background_task(JobType.CHECK_XSD_DRIFT)
@flask_db.with_db_session()
def run_check_xsd_drift_task(db_session: db.Session) -> None:
    """Run the daily XSD drift detection task."""
    task = CheckXsdDriftTask(db_session)
    task.run()


class CheckXsdDriftTask(Task):
    """Daily task that detects drift between committed and live grants.gov XSDs."""

    class Metrics(StrEnum):
        XSDS_CHECKED = "xsds_checked"
        XSDS_DRIFTED = "xsds_drifted"
        XSDS_MISSING = "xsds_missing"
        FETCH_ERRORS = "fetch_errors"
        DRIFT_ALERT_LOGGED = "drift_alert_logged"

    def __init__(
        self,
        db_session: db.Session,
        xsd_drift_config: XsdDriftConfig | None = None,
        committed_xsd_dir: Path | None = None,
        xsd_urls: set[str] | None = None,
    ) -> None:
        super().__init__(db_session)
        self.config = xsd_drift_config or get_xsd_drift_config()
        self.committed_xsd_dir = committed_xsd_dir or COMMITTED_XSD_DIR
        if xsd_urls is None:
            init_form_registry()
            xsd_urls = set(_build_xml_form_xsd_url_map().values())
        self.xsd_urls = xsd_urls

    def run_task(self) -> None:
        drifted_schemas: dict[str, str] = {}
        missing_schemas: dict[str, str] = {}
        fetch_errors: set[str] = set()

        with tempfile.TemporaryDirectory() as tmp_dir:
            fetcher = XSDFetcher(tmp_dir)

            downloaded_urls: set[str] = set()
            for source_url in sorted(self.xsd_urls):
                result = fetcher.fetch_xsd_with_dependencies(source_url)
                downloaded_urls.update(result["fetched"])
                downloaded_urls.update(result["stored"])
                if result["errors"]:
                    for err in result["errors"]:
                        logger.warning(
                            "Failed to fetch XSD for drift check",
                            extra={"url": err["url"], "error": err["error"]},
                        )
                        fetch_errors.add(err["url"])

            # Map filenames back to their source URLs so we can log the live
            # URL alongside each drifted/missing schema below.
            url_by_filename = {Path(urlparse(url).path).name: url for url in downloaded_urls}

            comparison = filecmp.dircmp(tmp_dir, self.committed_xsd_dir, shallow=False)

            for filename in sorted(comparison.left_only):
                url = url_by_filename.get(filename)
                if url is None:
                    continue
                logger.info(
                    "Downloaded XSD has no committed counterpart",
                    extra={"url": url, "schema_filename": filename},
                )
                missing_schemas[filename] = url

            for filename in sorted(comparison.diff_files):
                url = url_by_filename.get(filename)
                if url is None:
                    continue
                logger.info("Detected XSD drift", extra={"schema": filename})
                drifted_schemas[filename] = url

            schemas_checked = len(comparison.left_only) + len(comparison.common_files)

            self.set_metrics({self.Metrics.XSDS_CHECKED: schemas_checked})

        self.set_metrics(
            {
                self.Metrics.XSDS_DRIFTED: len(drifted_schemas),
                self.Metrics.XSDS_MISSING: len(missing_schemas),
                self.Metrics.FETCH_ERRORS: len(fetch_errors),
            }
        )

        if drifted_schemas or missing_schemas or fetch_errors:
            logger.info(
                "XSD drift summary",
                extra={
                    "drifted_schema_count": len(drifted_schemas),
                    "missing_schema_count": len(missing_schemas),
                    "fetch_error_count": len(fetch_errors),
                    "drifted_schemas": sorted(drifted_schemas.keys()),
                    "missing_schemas": sorted(missing_schemas.keys()),
                    "schemas_checked": schemas_checked,
                },
            )
            self._log_drift_alert(
                drifted_schemas,
                missing_schemas,
                schemas_checked=schemas_checked,
                fetch_errors=fetch_errors,
            )
            self.increment(self.Metrics.DRIFT_ALERT_LOGGED)
        else:
            logger.info("No XSD drift detected today")

    def _log_drift_alert(
        self,
        drifted_schemas: dict[str, str],
        missing_schemas: dict[str, str],
        schemas_checked: int,
        fetch_errors: set[str],
    ) -> dict[str, Any]:
        """Emit an actionable, ERROR-level log for New Relic to alert on.

        New Relic is configured to watch for this log message on the
        existing alerting list and notify the team's Slack channel from
        there, so the changed/missing schema names need to be present in
        the log line's ``extra`` payload rather than posted to Slack
        directly from this task.


        Args:
            drifted_schemas: Mapping of drifted schema filenames to their live URLs
            missing_schemas: Mapping of schema filenames with no committed copy to their live URLs
            schemas_checked: Total number of committed schemas checked
            fetch_errors: Set of schema URLs that failed to fetch


        Returns:
            The ``extra`` payload that was logged (useful for tests/inspection)
        """
        extra = {
            "alert_type": "xsd_schema_drift",
            "drifted_schema_count": len(drifted_schemas),
            "drifted_schemas": sorted(drifted_schemas.keys()),
            "drifted_schema_urls": drifted_schemas,
            "missing_schema_count": len(missing_schemas),
            "missing_schemas": sorted(missing_schemas.keys()),
            "missing_schema_urls": missing_schemas,
            "schemas_checked": schemas_checked,
            "fetch_error_count": len(fetch_errors),
            "fetch_error_urls": sorted(fetch_errors),
            "github_xsds_folder_url": self.config.github_xsds_folder_url,
        }

        logger.error(
            "XSD schema drift detected - committed XSDs need to be refreshed and "
            "XML validation re-run",
            extra=extra,
        )

        return extra
