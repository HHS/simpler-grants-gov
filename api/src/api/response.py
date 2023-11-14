import dataclasses
import logging
from typing import Any, Optional, Tuple

import apiflask

from src.api.schemas.extension import MarshmallowErrorContainer
from src.pagination.pagination_models import PaginationInfo
from src.util.dict_util import flatten_dict

logger = logging.getLogger(__name__)


@dataclasses.dataclass
class ValidationErrorDetail:
    type: str
    message: str = ""
    field: Optional[str] = None


class ValidationException(apiflask.exceptions.HTTPError):
    def __init__(
        self,
        errors: list[ValidationErrorDetail],
        message: str = "Invalid request",
        detail: Any = None,
    ):
        super().__init__(
            status_code=422,
            message=message,
            detail=detail,
            extra_data={"validation_issues": errors},
        )
        self.errors = errors


@dataclasses.dataclass
class ApiResponse:
    """Base response model for all API responses."""

    message: str
    data: Optional[Any] = None
    warnings: list[ValidationErrorDetail] = dataclasses.field(default_factory=list)
    errors: list[ValidationErrorDetail] = dataclasses.field(default_factory=list)
    status_code: int = 200

    pagination_info: PaginationInfo | None = None


def process_marshmallow_issues(marshmallow_issues: dict) -> list[ValidationErrorDetail]:
    validation_errors: list[ValidationErrorDetail] = []

    # Marshmallow structures its issues as
    # {"path": {"to": {"value": ["issue1", "issue2"]}}}
    # this flattens that to {"path.to.value": ["issue1", "issue2"]}
    flattened_issues = flatten_dict(marshmallow_issues)

    # Take the flattened issues and create properly formatted
    # error messages by translating the Marshmallow codes
    for field, value in flattened_issues.items():
        if isinstance(value, list):
            for item in value:
                if not isinstance(item, MarshmallowErrorContainer):
                    msg = f"Unconfigured error in Marshmallow validation errors, expected MarshmallowErrorContainer, but got {item.__class__.__name__}"
                    logger.error(msg)
                    raise AssertionError(msg)

                # If marshmallow expects a field to be an object
                # then it adds "._schema", we don't want that so trim it here
                validation_errors.append(
                    ValidationErrorDetail(
                        field=field.removesuffix("._schema"),
                        message=item.message,
                        type=item.key,
                    )
                )
        else:
            logger.error(
                "Error format in json section was not formatted as expected, expected a list, got a %s",
                type(value),
            )

    return validation_errors


def restructure_error_response(error: apiflask.exceptions.HTTPError) -> Tuple[dict, int, Any]:
    # Note that body needs to have the same schema as the ErrorResponseSchema we defined
    # in app.api.route.schemas.response_schema.py
    body = {
        "message": error.message,
        # we rename detail to data so success and error responses are consistent
        "data": error.detail,
        "status_code": error.status_code,
    }
    validation_errors: list[ValidationErrorDetail] = []

    # Process Marshmallow issues and convert them to the proper format
    # Marshmallow issues are put in the json error detail - the body of the request
    if isinstance(error.detail, dict):
        marshmallow_issues = error.detail.get("json")
        if marshmallow_issues:
            validation_errors.extend(process_marshmallow_issues(marshmallow_issues))

            # We don't want to make the response confusing
            # so we remove the now-duplicate error detail
            del body["data"]["json"]

        marshmallow_issues = error.detail.get("headers")
        if marshmallow_issues:
            validation_errors.extend(process_marshmallow_issues(marshmallow_issues))

            del body["data"]["headers"]

    # If we called raise_flask_error with a list of validation_issues
    # then they get appended to the error response here
    additional_validation_issues = error.extra_data.get("validation_issues")
    if additional_validation_issues:
        validation_errors.extend(additional_validation_issues)

    # Attach formatted errors to the error response
    body["errors"] = validation_errors

    return body, error.status_code, error.headers
