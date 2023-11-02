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
