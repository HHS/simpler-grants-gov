# pylint: disable=consider-using-f-string,line-too-long
"""
Make JSON logs easier to read when developing or troubleshooting.

Expects JSON log lines or `docker-compose log` output on stdin and outputs plain text lines on
stdout.

This module intentionally has no dependencies outside the standard library so that it can be run
as a script outside the virtual environment if needed.
"""

import datetime
import json
from typing import Mapping  # noqa:  UP035

RED = "\033[31m"
GREEN = "\033[32m"
BLUE = "\033[34m"
ORANGE = "\033[38;5;208m"
RESET = "\033[0m"
NO_COLOUR = ""

DEFAULT_MESSAGE_WIDTH = 50


def process_line(line: str) -> str | None:
    """Process a line of the log and return the reformatted line."""
    line = line.rstrip()
    if line and line[0] == "{":
        # JSON format
        return decode_json_line(line)
    if "| {" in line:
        # `docker-compose logs ...` format
        return decode_json_line(line[line.find("| {") + 2 :])
    # Anything else is left alone
    return line


def decode_json_line(line: str) -> str | None:
    """Decode a JSON log line and return the reformatted line."""
    try:
        data = json.loads(line)
    except json.decoder.JSONDecodeError:
        return line

    name = data.pop("name", "-")
    level = data.pop("levelname", "-")
    func_name = data.pop("funcName", "-")
    created = datetime.datetime.fromtimestamp(
        float(data.pop("created", 0)),
        tz=datetime.timezone.utc,
    )
    message = data.pop("message", "-")

    if level == "AUDIT":
        return None

    return format_line(created, name, func_name, level, message, data)


def format_line(
    created: datetime.datetime,
    logger_name: str,
    func_name: str,
    level: str,
    message: str,
    extra: Mapping[str, str],
    message_width: int = DEFAULT_MESSAGE_WIDTH,
) -> str:
    """Format log fields as a coloured string."""
    logger_name_color = color_for_name(logger_name)
    level_color = color_for_level(level)
    return f"{format_datetime(created)}  {colorize(logger_name.ljust(36), logger_name_color)} {func_name:<28} {colorize(level.ljust(8), level_color)} {colorize(message.ljust(message_width), level_color)} {colorize(format_extra(extra), BLUE)}"  # noqa: E501


def colorize(text: str, color: str) -> str:
    """Util method for adding color to text."""
    return f"{color}{text}{RESET}"


def color_for_name(name: str) -> str:
    """Util method for mapping color of text based on name."""
    if name.startswith("src"):
        return GREEN
    if name.startswith("sqlalchemy"):
        return ORANGE
    return NO_COLOUR


def color_for_level(level: str) -> str:
    """Util method for mapping color of text based on log level severity."""
    if level in ("WARNING", "ERROR", "CRITICAL"):
        return RED
    return NO_COLOUR


def format_datetime(created: datetime.datetime) -> str:
    """Format datetime in output."""
    return created.time().isoformat(timespec="milliseconds")


EXCLUDE_EXTRA = {
    "args",
    "created",
    "entity.guid",
    "entity.name",
    "entity.type",
    "exc_info",
    "filename",
    "funcName",
    "levelname",
    "levelno",
    "lineno",
    "message",
    "module",
    "msecs",
    "msg",
    "name",
    "pathname",
    "process",
    "processName",
    "relativeCreated",
    "span.id",
    "thread",
    "threadName",
    "trace.id",
    "traceId",
}


def format_extra(data: Mapping[str, str]) -> str:
    """Format the extra json into human-readable text."""
    return " ".join(
        f"{key}={value}"
        for key, value in data.items()
        if key not in EXCLUDE_EXTRA and value is not None
    )
