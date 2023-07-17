#
# Make JSON logs easier to read when developing or troubleshooting.
#
# Expects JSON log lines or `docker-compose log` output on stdin and outputs plain text lines on
# stdout.
#
# This module intentionally has no dependencies outside the standard library so that it can be run
# as a script outside the virtual environment if needed.
#
# mypy: disallow-untyped-defs

import datetime
import json
import sys
from typing import Mapping, Optional

RED = "\033[31m"
GREEN = "\033[32m"
BLUE = "\033[34m"
ORANGE = "\033[38;5;208m"
RESET = "\033[0m"
NO_COLOUR = ""

DEFAULT_MESSAGE_WIDTH = 50

output_dates = None


def main() -> None:
    """Main entry point when used as a script."""
    for line in sys.stdin:
        processed = process_line(line)
        if processed is not None:
            sys.stdout.write(processed)
            sys.stdout.write("\r\n")


def process_line(line: str) -> Optional[str]:
    """Process a line of the log and return the reformatted line."""
    line = line.rstrip()
    if line and line[0] == "{":
        # JSON format
        return decode_json_line(line)
    elif "| {" in line:
        # `docker-compose logs ...` format
        return decode_json_line(line[line.find("| {") + 2 :])
    # Anything else is left alone
    return line


def decode_json_line(line: str) -> Optional[str]:
    """Decode a JSON log line and return the reformatted line."""
    try:
        data = json.loads(line)
    except json.decoder.JSONDecodeError:
        return line

    name = data.pop("name", "-")
    level = data.pop("levelname", "-")
    func_name = data.pop("funcName", "-")
    created = datetime.datetime.utcfromtimestamp(float(data.pop("created", 0)))
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
    return "{created}  {logger_name} {func_name:<28} {level} {message} {extra}".format(
        created=format_datetime(created),
        logger_name=colorize(logger_name.ljust(36), logger_name_color),
        func_name=func_name,
        level=colorize(level.ljust(8), level_color),
        message=colorize(message.ljust(message_width), level_color),
        extra=colorize(format_extra(extra), BLUE),
    )


def colorize(text: str, color: str) -> str:
    return f"{color}{text}{RESET}"


def color_for_name(name: str) -> str:
    if name.startswith("src"):
        return GREEN
    elif name.startswith("sqlalchemy"):
        return ORANGE
    return NO_COLOUR


def color_for_level(level: str) -> str:
    if level in ("WARNING", "ERROR", "CRITICAL"):
        return RED
    return NO_COLOUR


def format_datetime(created: datetime.datetime) -> str:
    global output_dates
    if output_dates is None:
        # Check first line - if over 10h ago, output dates as well as time.
        output_dates = 36000 < (datetime.datetime.now() - created).total_seconds()
    if output_dates:
        return created.isoformat(timespec="milliseconds")
    else:
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
    return " ".join(
        "%s=%s" % (key, value)
        for key, value in data.items()
        if key not in EXCLUDE_EXTRA and value is not None
    )


if __name__ == "__main__":
    main()
