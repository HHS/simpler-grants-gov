"""Task to detect drift between committed XSDs and the live grants.gov copies.

Runs weekly. Downloads the latest XSDs from grants.gov into a temp directory,
compares them (by content hash) against the copies committed in
``src/services/xml_generation/xsds``, and posts a Slack alert naming any
schemas that changed so the team can refresh the committed copies and
re-run XML validation.
"""

import hashlib
import logging
import tempfile
from enum import StrEnum
from pathlib import Path
from typing import Any

import requests
from grants_shared.adapters import db
from grants_shared.adapters.db import flask_db
from grants_shared.task.ecs_background_task import ecs_background_task

from src.constants.lookup_constants import JobType
from src.services.xml_generation.validation.xsd_fetcher import XSDFetcher
from src.task.task import Task
from src.task.task_blueprint import task_blueprint
from src.task.xsd_drift.config import XsdDriftConfig, get_xsd_drift_config

logger = logging.getLogger(__name__)

# Directory containing the XSDs committed to the repo (source of truth
# used for XML validation elsewhere in the codebase).
COMMITTED_XSD_DIR = Path(__file__).parent.parent.parent / "services" / "xml_generation" / "xsds"

# Slack attachment sidebar color for the drift alert (matches the existing
# Security Hub alert styling on the shared webhook).
SLACK_ALERT_COLOR = "#E01E5A"


@task_blueprint.cli.command(
    "check-xsd-drift", help="Check for drift between committed XSDs and grants.gov"
)
@ecs_background_task(JobType.CHECK_XSD_DRIFT)
@flask_db.with_db_session()
def run_check_xsd_drift_task(db_session: db.Session) -> None:
    """Run the weekly XSD drift detection task."""
    task = CheckXsdDriftTask(db_session)
    task.run()


class CheckXsdDriftTask(Task):
    """Weekly task that detects drift between committed and live grants.gov XSDs."""

    class Metrics(StrEnum):
        XSDS_CHECKED = "xsds_checked"
        XSDS_DRIFTED = "xsds_drifted"
        FETCH_ERRORS = "fetch_errors"
        SLACK_ALERT_SENT = "slack_alert_sent"

    def __init__(
        self,
        db_session: db.Session,
        xsd_drift_config: XsdDriftConfig | None = None,
        committed_xsd_dir: Path | None = None,
    ) -> None:
        super().__init__(db_session)
        self.config = xsd_drift_config or get_xsd_drift_config()
        self.committed_xsd_dir = committed_xsd_dir or COMMITTED_XSD_DIR

    def run_task(self) -> None:
        drifted_schemas: list[str] = []
        fetch_errors: set[str] = set()

        with tempfile.TemporaryDirectory() as tmp_dir:
            fetcher = XSDFetcher(tmp_dir)

            committed_files = sorted(self.committed_xsd_dir.glob("*.xsd"))
            schemas_checked = len(committed_files)
            self.set_metrics({self.Metrics.XSDS_CHECKED: schemas_checked})

            for committed_path in committed_files:
                filename = committed_path.name
                source_url = f"{self.config.grants_gov_schema_base_url}/{filename}"

                result = fetcher.fetch_xsd_with_dependencies(source_url)
                if result["errors"]:
                    for err in result["errors"]:
                        logger.warning(
                            "Failed to fetch XSD for drift check",
                            extra={"url": err["url"], "error": err["error"]},
                        )

                    fetch_errors.add(filename)
                    continue

                fetched_path = Path(tmp_dir) / filename
                if not fetched_path.exists():
                    logger.warning(
                        "Fetched XSD file not found in temp directory",
                        extra={"filename": filename, "path": str(fetched_path)},
                    )
                    fetch_errors.add(filename)
                    continue

                if self._hash_file(fetched_path) != self._hash_file(committed_path):
                    logger.info("Detected XSD drift", extra={"schema": filename})
                    drifted_schemas.append(filename)

        self.set_metrics(
            {
                self.Metrics.XSDS_DRIFTED: len(drifted_schemas),
                self.Metrics.FETCH_ERRORS: len(fetch_errors),
            }
        )

        if drifted_schemas:
            self._send_slack_alert(
                drifted_schemas,
                schemas_checked=schemas_checked,
                fetch_errors=len(fetch_errors),
            )
            self.increment(self.Metrics.SLACK_ALERT_SENT)
        else:
            logger.info("No XSD drift detected this week")

    @staticmethod
    def _hash_file(path: Path, chunk_size: int = 8192) -> str:
        """Calculate SHA256 hash of file with streaming for large files.

        Args:
            path: Path to file to hash
            chunk_size: Size of chunks to read (default 8KB)

        Returns:
            Hexadecimal hash string
        """
        sha256_hash = hashlib.sha256()
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(chunk_size), b""):
                sha256_hash.update(chunk)
        return sha256_hash.hexdigest()

    def _format_slack_message(
        self, drifted_schemas: list[str], schemas_checked: int, fetch_errors: int
    ) -> dict[str, Any]:
        """Format the XSD drift alert message as a Slack Block Kit payload.

        Args:
            drifted_schemas: List of schema filenames that have drifted
            schemas_checked: Total number of committed schemas checked
            fetch_errors: Number of schemas that failed to fetch

        Returns:
            Slack message payload (``text`` fallback plus rich ``attachments``)
        """
        schema_links = "\n".join(
            f"\u2022 <{self.config.grants_gov_schema_base_url}/{name}|{name}>"
            for name in sorted(drifted_schemas)
        )

        return {
            "text": "XSD schema drift detected",
            "attachments": [
                {
                    "color": SLACK_ALERT_COLOR,
                    "blocks": [
                        {
                            "type": "header",
                            "text": {
                                "type": "plain_text",
                                "text": "\u2757 XSD schema drift detected",
                                "emoji": True,
                            },
                        },
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": (
                                    "The following schemas differ from the live copies "
                                    "on grants.gov and need to be refreshed in the repo, "
                                    "followed by a re-run of XML validation:\n"
                                    f"{schema_links}"
                                ),
                            },
                        },
                        {
                            "type": "section",
                            "fields": [
                                {
                                    "type": "mrkdwn",
                                    "text": f"*Schemas checked:*\n{schemas_checked}",
                                },
                                {
                                    "type": "mrkdwn",
                                    "text": f"*Schemas drifted:*\n{len(drifted_schemas)}",
                                },
                                {
                                    "type": "mrkdwn",
                                    "text": f"*Fetch errors:*\n{fetch_errors}",
                                },
                            ],
                        },
                        {
                            "type": "actions",
                            "elements": [
                                {
                                    "type": "button",
                                    "text": {
                                        "type": "plain_text",
                                        "text": "View xsds folder on GitHub",
                                    },
                                    "url": self.config.github_xsds_folder_url,
                                }
                            ],
                        },
                        {
                            "type": "context",
                            "elements": [
                                {
                                    "type": "mrkdwn",
                                    "text": "Weekly XSD Drift Check",
                                }
                            ],
                        },
                    ],
                }
            ],
        }

    def _send_slack_alert(
        self, drifted_schemas: list[str], schemas_checked: int, fetch_errors: int
    ) -> None:
        """Send alert to Slack about detected XSD drift.

        Args:
            drifted_schemas: List of schema filenames that have drifted
            schemas_checked: Total number of committed schemas checked
            fetch_errors: Number of schemas that failed to fetch

        Raises:
            requests.RequestException: If Slack API call fails
        """
        payload = self._format_slack_message(drifted_schemas, schemas_checked, fetch_errors)

        try:
            logger.info(
                "Posting XSD drift alert to Slack",
                extra={"schemas_count": len(drifted_schemas)},
            )
            response = requests.post(self.config.slack_webhook_url, json=payload, timeout=10)
            response.raise_for_status()
        except requests.RequestException as e:
            logger.exception(
                "Failed to post XSD drift alert to Slack",
                extra={"error": str(e)},
            )
            raise
