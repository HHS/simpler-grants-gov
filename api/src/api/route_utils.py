from typing import Any, Never

from apiflask import abort
from apiflask.types import ResponseHeaderType

from src.api.response import ValidationErrorDetail


def raise_flask_error(  # type: ignore
    status_code: int,
    message: str | None = None,
    detail: Any = None,
    headers: ResponseHeaderType | None = None,
    validation_issues: list[ValidationErrorDetail] | None = None,
) -> Never:
    # Wrapper around the abort method which makes an error during API processing
    # work properly when APIFlask generates a response.
    # mypy doesn't realize this method never returns, so we define the same method
    # with a return type of Never.
    abort(
        status_code, message, detail, headers, extra_data={"validation_issues": validation_issues}
    )
