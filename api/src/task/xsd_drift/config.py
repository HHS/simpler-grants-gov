"""Configuration for the weekly XSD schema drift detection task."""

import json
import logging
import os

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class XsdDriftConfig(PydanticBaseEnvConfig):
    """Configuration for the XSD drift detection task.

    Uses the existing 'security-hub-slack-webhook' secret from Secrets Manager.
    """

    # Link included on the Slack alert button, pointing at the committed XSDs folder
    github_xsds_folder_url: str = (
        "https://github.com/HHS/simpler-grants-gov/tree/main/api/src/services/xml_generation/xsds"
    )

    # Cached webhook URL to avoid repeated AWS API calls
    _cached_webhook_url: str | None = None

    @property
    def slack_webhook_url(self) -> str:
        """Get the Slack webhook URL from AWS Secrets Manager (cached).

        Reuses the existing 'security-hub-slack-webhook' secret instead of
        creating a separate one. Caches the result to minimize AWS API calls.
        """
        if self._cached_webhook_url is not None:
            return self._cached_webhook_url

        secret_name = "security-hub-slack-webhook"
        region = os.environ.get("AWS_REGION", "us-east-1")

        client = boto3.client("secretsmanager", region_name=region)

        try:
            response = client.get_secret_value(SecretId=secret_name)
            secret = json.loads(response["SecretString"])
            webhook_url = secret.get("webhook_url")
            if not webhook_url:
                raise ValueError("Secret is missing 'webhook_url' key")
            self._cached_webhook_url = webhook_url
            return webhook_url
        except (ClientError, BotoCoreError) as e:
            logger.error(f"AWS error retrieving Slack webhook: {e}")
            raise ValueError(
                f"Failed to retrieve Slack webhook from AWS Secrets Manager secret '{secret_name}': {e}"
            ) from e
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Error parsing Slack webhook secret: {e}")
            raise ValueError(
                f"Slack webhook secret is invalid or missing 'webhook_url' field: {e}"
            ) from e


def get_xsd_drift_config() -> XsdDriftConfig:
    """Get the XSD drift detection configuration."""
    return XsdDriftConfig()
