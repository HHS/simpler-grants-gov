import logging
import sys
from types import TracebackType
from typing import Any

import newrelic.agent

logger = logging.getLogger(__name__)

AGENT_ATTRIBUTE_LIMIT = 128
EVENT_API_ATTRIBUTE_LIMIT = 255


def record_custom_event(event_type: str, params: dict[Any, Any]) -> None:
    # legacy aliases
    params["request.uri"] = params.get("request.path")
    params["request.headers.x-amzn-requestid"] = params.get("request_id")

    params["api.request.method"] = params.get("request.method")
    params["api.request.uri"] = params.get("request.path")

    # If there are more custom attributes than the limit, the agent will upload
    # a partial payload, dropping keys after hitting its limit
    attribute_count = len(params)
    if attribute_count > AGENT_ATTRIBUTE_LIMIT:
        logger.warning(
            "Payload exceeds New Relic Agent event attribute limit. Partial data likely present. Check CloudWatch for complete event data.",
            extra={
                "event_type": event_type,
                "total_attribute_count": attribute_count,
            },
        )
        logger.info(event_type, extra=params)

    # https://docs.newrelic.com/docs/apm/agents/python-agent/python-agent-api/recordcustomevent-python-agent-api/
    newrelic.agent.record_custom_event(
        event_type,
        params,
    )


def log_and_capture_exception(msg: str, extra: dict | None = None, only_warn: bool = False) -> None:
    """
    Sometimes we want to record custom messages that do not match an exception message. For example, when a ValidationError contains
    multiple issues, we want to log and record each one individually in New Relic. Injecting a new exception with a
    human-readable error message is the only way for errors to receive custom messages.
    This does not affect the traceback or any other visible attribute in New Relic. Everything else, including
    the original exception class name, is retained and displayed.
    """

    info = sys.exc_info()
    info_with_readable_msg: BaseException | tuple[type, BaseException, TracebackType | None]

    if info[0] is None:
        exc = Exception(msg)
        info_with_readable_msg = (type(exc), exc, exc.__traceback__)
    else:
        info_with_readable_msg = (info[0], Exception(msg), info[2])

    if only_warn:
        logger.warning(msg, extra=extra, exc_info=info_with_readable_msg)
    else:
        logger.error(msg, extra=extra, exc_info=info_with_readable_msg)

    newrelic.agent.notice_error(
        error=info_with_readable_msg,
        attributes=extra,
    )
