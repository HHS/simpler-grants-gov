from enum import StrEnum
from functools import cache

from pydantic import Field

from src.util.env_config import PydanticBaseEnvConfig


class MaintenanceModeLogEvent(StrEnum):
    """Distinct, queryable event types for maintenance-mode log records."""

    REQUEST_REJECTED = "maintenance_mode_request_rejected"


class MaintenanceModeConfig(PydanticBaseEnvConfig):
    """Configuration for maintenance mode.

    The flag is sourced from SSM Parameter Store and injected into each ECS
    container as the ``ENABLE_MAINTENANCE_MODE`` env var at task launch. Flipping
    it is an ops action (update SSM + force-new-deployment), not a code deploy, so
    the value is fixed for the lifetime of a task and can be read once and cached.
    """

    enable_maintenance_mode: bool = Field(False, alias="ENABLE_MAINTENANCE_MODE")
    retry_after_seconds: int = Field(3600, alias="MAINTENANCE_RETRY_AFTER_SECONDS")


@cache
def get_maintenance_mode_config() -> MaintenanceModeConfig:
    return MaintenanceModeConfig()


def is_maintenance_mode_enabled() -> bool:
    return get_maintenance_mode_config().enable_maintenance_mode
