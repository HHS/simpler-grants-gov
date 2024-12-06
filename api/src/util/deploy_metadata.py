import re
import typing
from datetime import datetime

from pydantic_settings import SettingsConfigDict

import src.util.datetime_util as datetime_util
from src.util.env_config import PydanticBaseEnvConfig

# We expect release notes to be formatted as:
# YYYY-MM-DD-#
# However we don't always put leading zeroes, so all of the following
# would be valid release versions:
# 2024.11.27-1
# 2024.11.5-1
# 2024.4.30-1
RELEASE_NOTE_REGEX = re.compile(
    r"""
    ^[0-9]{4}         # Exactly 4 leading digits
    (?:\.[0-9]{1,2})  # Period followed by 1-2 digits
    (?:\.[0-9]{1,2})  # Period followed by 1-2 digits
    (?:\-[0-9]{1,2})$ # Ends with a dash and 1-2 digits
    """,
    re.ASCII | re.VERBOSE,
)


class DeployMetadataConfig(PydanticBaseEnvConfig):
    model_config = SettingsConfigDict(extra="allow")

    deploy_github_ref: str  # DEPLOY_GITHUB_REF
    deploy_github_sha: str  # DEPLOY_GITHUB_SHA
    deploy_timestamp: datetime  # DEPLOY_TIMESTAMP

    def model_post_init(self, _context: typing.Any) -> None:
        """Run after __init__ sets above values from env vars"""

        if RELEASE_NOTE_REGEX.match(self.deploy_github_ref):
            self.release_notes = (
                f"https://github.com/HHS/simpler-grants-gov/releases/tag/{self.deploy_github_ref}"
            )
        else:
            self.release_notes = "https://github.com/HHS/simpler-grants-gov/releases"

        self.deploy_commit = (
            f"https://github.com/HHS/simpler-grants-gov/commit/{self.deploy_github_sha}"
        )

        self.deploy_datetime_est = datetime_util.adjust_timezone(
            self.deploy_timestamp, "US/Eastern"
        )


_deploy_metadata_config: DeployMetadataConfig | None = None


def get_deploy_metadata_config() -> DeployMetadataConfig:
    global _deploy_metadata_config
    if _deploy_metadata_config is None:
        _deploy_metadata_config = DeployMetadataConfig()

    return _deploy_metadata_config
