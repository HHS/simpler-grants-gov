import logging
from collections.abc import Collection
from enum import StrEnum
from functools import cache

from apiflask import APIFlask
from flask import request
from pydantic import Field

from grants_shared.api.route_utils import raise_flask_error
from grants_shared.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class MaintenanceModeLogEvent(StrEnum):
    """Distinct, queryable event types for maintenance-mode log records."""

    REQUEST_REJECTED = "maintenance_mode_request_rejected"


class MaintenanceModeConfig(PydanticBaseEnvConfig):
    """Configuration for maintenance mode.

    The flag is sourced from SSM Parameter Store and injected into each container
    as the ``ENABLE_MAINTENANCE_MODE`` env var at task launch. Flipping it is an ops
    action (update SSM + force-new-deployment), not a code deploy, so the value is
    fixed for the lifetime of a task and can be read once and cached.
    """

    enable_maintenance_mode: bool = Field(False, alias="ENABLE_MAINTENANCE_MODE")
    retry_after_seconds: int = Field(3600, alias="MAINTENANCE_RETRY_AFTER_SECONDS")


@cache
def get_maintenance_mode_config() -> MaintenanceModeConfig:
    # Cached since the env var is resolved at task launch; changing it requires a
    # new deployment (and therefore a new process) anyway.
    return MaintenanceModeConfig()


def is_maintenance_mode_enabled() -> bool:
    return get_maintenance_mode_config().enable_maintenance_mode


def register_maintenance_mode_handler(app: APIFlask, allowlist: Collection[str]) -> None:
    """Register a ``before_request`` handler that returns a 503 for every request
    while maintenance mode is enabled, except for paths in ``allowlist``.

    Register this after logging is initialized (so rejections still produce the
    normal start/end request logs) and before authentication (so unauthenticated
    clients receive a 503 rather than a 401). ``allowlist`` is the per-system set of
    paths that must keep serving during a maintenance window (e.g. ``{"/health"}``
    so ALB/Docker healthchecks stay green).
    """
    allowed_paths = frozenset(allowlist)

    @app.before_request
    def reject_if_maintenance_mode() -> None:
        if not is_maintenance_mode_enabled():
            return

        if request.path in allowed_paths:
            return

        logger.info(
            "Request rejected due to maintenance mode",
            extra={"maintenance_mode_event": MaintenanceModeLogEvent.REQUEST_REJECTED},
        )
        raise_flask_error(
            503,
            message="API is undergoing scheduled maintenance",
            headers={"Retry-After": str(get_maintenance_mode_config().retry_after_seconds)},
        )
