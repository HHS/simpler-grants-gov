"""Configuration for the daily XSD schema drift detection task."""

from src.util.env_config import PydanticBaseEnvConfig


class XsdDriftConfig(PydanticBaseEnvConfig):
    """Configuration for the XSD drift detection task.

    Drift is reported via an actionable ERROR-level log line rather than a
    direct Slack call. New Relic watches for that log line and handles
    alerting (including the Slack notification) from there, so this task
    no longer needs its own Slack webhook secret.
    """

    # Link included in the drift alert log, pointing at the committed XSDs folder
    github_xsds_folder_url: str = (
        "https://github.com/HHS/simpler-grants-gov/tree/main/api/src/services/xml_generation/xsds"
    )


def get_xsd_drift_config() -> XsdDriftConfig:
    """Get the XSD drift detection configuration."""
    return XsdDriftConfig()
