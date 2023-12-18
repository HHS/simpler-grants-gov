# Logging Configuration

## Overview

This document describes how logging is configured in the application. The logging functionality is defined in the [src.logging](../../../api/src/logging/) package and leverages Python's built-in [logging](https://docs.python.org/3/library/logging.html) framework.

## Usage
Our logging approach uses a context manager to start up and tear down logging. This is mostly done to prevent tests from
setting up multiple loggers each time we instantiate the logger.

If you wanted to write a simple script that could log, something like this would work

```py
import logging

import src.logging

logger = logging.getLogger(__name__)

def main():
    with src.logging.init(__package__):
        logger.info("Hello")
```

Initializing logging is only necessary once when running an application.
Logging is already initialized automatically for the entire API, so any new
endpoints or features built into the API don't require the above configuration.

If you just want to be able to writes logs, you usually only need to do:

```py
import logging

logger = logging.getLogger(__name__)

def my_function():
    logger.info("hello")
```

## Formatting

We have two separate ways of formatting the logs which are controlled by the `LOG_FORMAT` environment variable.

`json` (default) -> Produces JSON formatted logs which are machine-readable.

```json
{
    "name": "src.api.healthcheck",
    "levelname": "INFO",
    "funcName": "healthcheck_get",
    "created": "1663261542.0465896",
    "thread": "275144058624",
    "threadName": "Thread-2 (process_request_thread)",
    "process": "16",
    "message": "GET /v1/healthcheck",
    "request.method": "GET",
    "request.path": "/v1/healthcheck",
    "request.url_rule": "/v1/healthcheck",
    "request_id": ""
}
```

`human-readable` (set by default in `local.env`) -> Produces color coded logs for local development or for troubleshooting.

![Human readable logs](human-readable-logs.png)

## Logging Extra Data in a Request

The [src.logging.flask_logger](../../../api/src/logging/flask_logger.py) module adds logging functionality to Flask applications. It automatically adds useful data from the Flask request object to logs, logs the start and end of requests, and provides a mechanism for developers to dynamically add extra data to all subsequent logs for the current request.

For example, if you would like to add the `opportunity_id` to every log message during the lifecycle of a request, then you can do:
```py
import logging

from src.logging.flask_logger import add_extra_data_to_current_request_logs

logger = logging.getLogger(__name__)

# Assume API decorators here
def opportunity_get(opportunity_id: int):
    
    add_extra_data_to_current_request_logs({"request.path.opportunity_id": opportunity_id})
    
    logger.info("Example log 1")
    
    # ... some code
    
    logger.info("Example log 2")
```

This would produce two log messages, which would both have `request.path.opportunity_id=<the opportunity_id>` in the extra
information of the log message. This function can be called multiple times, adding more information each time.

NOTE: Be careful where you place the call to this method as it requires you to be in a Flask request context (ie. reached via calling Flask)
If you want to test a piece of code that calls `add_extra_data_to_current_request_logs` without going via Flask, you'll either need to restructure
the code, or 

## Automatic request log details

Several fields are automatically attached to every log message of a request regardless
of what you configure in the [flask_logger](../../../api/src/logging/flask_logger.py). This includes:
* Request ID
* Request method (eg. `POST` or `PATCH`)
* Request path
* Request URL rule
* Cognito ID from the `Cognito-Id` header

Additionally when a request ends, the following will always be logged:
* Status code
* Content length
* Content type
* Mimetype
* Request duration in milliseconds

## PII Masking

The [src.logging.pii](../../../api/src/logging/pii.py) module defines a filter that applies to all logs that automatically masks data fields that look like social security numbers.

## Audit Logging

We have configured [audit logging](../../../api/src/logging/audit.py) which logs
various events related to the process making network, file system and
subprocess calls. This is largely done in the event we need to debug an
issue or to detect if a library we are relying on is potentially doing
something malicious (eg. a string parsing library shouldn't be making network requests).

For more information, please review the [audit events](https://docs.python.org/3/library/audit_events.html)
Python docs, as well as [PEP-578](https://peps.python.org/pep-0578/) which details
the implementation details and thought process behind this feature in Python.

Audit logging can be turned on/off by the `LOG_ENABLE_AUDIT` environment variable
which is defaulted off for local development as audit logs are very verbose

We don't log 100% of audit events as they are very verbose. The first 10 events
of a particular type will all log, but after than only every 10th will log, and
once it has reached 100 occurrences, only every 100th. This count will only
consider the 128 most recently logged scenarios where a scenario is based on the
call + arguments (ie. calls to the request library for different URLs are treated separately)

### Audit Logging Tests

The audit logging unit tests that we have written are run separately
from the rest of the tests as enabling audit logging causes several hundred
log messages to appear when run with everything else, and makes it very difficult
to debug and fix your tests.

## Additional Reading

* [Python's Logging HOWTO](https://docs.python.org/3/howto/logging.html#logging-basic-tutorial)
* [Python's logging module API docs](https://docs.python.org/3/library/logging.html)
* [Formatter objects](https://docs.python.org/3/library/logging.html#formatter-objects)
