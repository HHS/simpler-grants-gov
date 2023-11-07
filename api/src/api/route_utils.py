from typing import Any, Never
from apiflask.types import ResponseHeaderType
from apiflask import abort
def raise_flask_error(
        status_code: int,
        message: str | None = None,
        detail: Any = None,
        headers: ResponseHeaderType | None = None,
        # TODO - when we work on validation error responses, we'll want to take in those here
) -> Never:
    # Wrapper around the abort method which makes an error during API processing
    # work properly when APIFlask generates a response.
    # mypy doesn't realize this method never returns, so we define the same method
    # with a return type of Never.
    abort(status_code, message, detail, headers)