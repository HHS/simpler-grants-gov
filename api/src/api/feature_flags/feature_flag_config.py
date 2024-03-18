import logging

from pydantic import Field

from src.api.feature_flags.feature_flag import FeatureFlag
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class FeatureFlagConfig(PydanticBaseEnvConfig):
    """
    Configuration for feature flags.

    The values here are defaults loaded from environment variables based
    on the alias field.
    """

    # ENABLE_OPPORTUNITY_LOG_MSG
    enable_opportunity_log_msg: bool = Field(
        False, alias=FeatureFlag.ENABLE_OPPORTUNITY_LOG_MSG.get_env_var_name()
    )


# Global, loaded once at startup by calling initialize
"""
NOTE: This structure of requiring you to initialize the config
is to allow us to expand the feature flag implementation in the future
to allow for updating feature flags while the application is still running.

What we would need to add is a background thread that periodically
checks some external system (the database, S3, AWS app config, etc.)
for the current feature flag value, and load that into this configuration.

By having this structure of initialize() + get_feature_flag_config() - we don't
need to later modify the usage of the feature flag config, just this underlying implementation.
"""
_config: FeatureFlagConfig | None = None


def initialize() -> None:
    global _config

    if not _config:
        _config = FeatureFlagConfig()
        logger.info("Constructed feature flag configuration", extra=_config.model_dump())


def get_feature_flag_config() -> FeatureFlagConfig:
    if not _config:
        raise Exception("Must call initialize() before fetching configuration")

    # Return a copy so the calling code can modify it if desired
    # without altering the global value.
    return _config.model_copy(deep=True)
