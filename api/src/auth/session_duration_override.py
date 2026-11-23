import logging

from pydantic import Field

from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)

SESSION_DURATION_OVERRIDE_ENVIRONMENTS = frozenset({"local", "dev", "staging"})
MIN_SESSION_DURATION_OVERRIDE_SECONDS = 30
MAX_SESSION_DURATION_OVERRIDE_SECONDS = 15 * 60


class _EnvironmentConfig(PydanticBaseEnvConfig):
    environment: str | None = Field(default=None, alias="ENVIRONMENT")


def get_session_duration_override(requested_seconds: int | None) -> int | None:
    """Return the requested session duration if it is allowed in this environment, else None."""
    if requested_seconds is None:
        return None

    environment = _EnvironmentConfig().environment
    if environment not in SESSION_DURATION_OVERRIDE_ENVIRONMENTS or not (
        MIN_SESSION_DURATION_OVERRIDE_SECONDS
        <= requested_seconds
        <= MAX_SESSION_DURATION_OVERRIDE_SECONDS
    ):
        logger.warning(
            "Session duration override ignored",
            extra={"environment": environment, "session_duration_seconds": requested_seconds},
        )
        return None

    return requested_seconds
