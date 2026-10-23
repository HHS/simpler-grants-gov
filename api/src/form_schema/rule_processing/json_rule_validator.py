import logging
import typing
from datetime import date

from src.api.response import ValidationErrorDetail
from src.form_schema.rule_processing.json_rule_context import JsonRule, JsonRuleContext
from src.form_schema.rule_processing.json_rule_util import build_path_str, get_field_values
from src.util.dict_util import get_nested_value
from src.validation.validation_constants import ValidationErrorType

logger = logging.getLogger(__name__)


def _validate_attachment_value(
    context: JsonRuleContext,
    application_attachment_ids: list[str],
    value: typing.Any,
    path: list[str],
    index: int | None = None,
) -> None:
    """Helper function for validating attachment value"""

    # If the attachment ID isn't an expected type
    # then the JSON schema type validation itself
    # should fail anyways, but log a message just
    # in case we need to investigate.
    if not isinstance(value, str):
        logger.info(
            f"Unexpected type found when validating attachment ID: {type(value).__name__}",
            extra={
                "application_form_id": context.application_form.application_form_id,
                "path": build_path_str(path, index=index),
            },
        )
        return

    # Collect the attachment ID regardless of whether it passes validation
    context.attachment_ids.add(value)

    # If the value isn't in the attachment ID list
    # then add a validation error.
    if value not in application_attachment_ids:
        context.validation_issues.append(
            ValidationErrorDetail(
                type=ValidationErrorType.UNKNOWN_APPLICATION_ATTACHMENT,
                message="Field references application_attachment_id not on the application",
                field=build_path_str(path, index=index),
                value=value,
            )
        )


def validate_attachments(context: JsonRuleContext, json_rule: JsonRule) -> None:
    """Validate that the attachment ID field corresponds
    to an actual attachment ID on the application

    Rule is passed in here in case we want to support
    specific configuration, but isn't used at the moment.
    """
    application_attachment_ids = [
        str(application_attachment.application_attachment_id)
        for application_attachment in context.application_form.application.application_attachments
    ]

    # Fetch the value
    value = get_nested_value(context.json_data, json_rule.path)

    # If there is no value currently for an attachment field
    # then we don't do any check, if the field is required, JSON schema
    # validation will handle flagging that where appropriate.
    if value is None:
        return

    # If the value we're validating is a list
    # we need to check each value individually
    if isinstance(value, list):
        for index, v in enumerate(value):
            _validate_attachment_value(
                context=context,
                application_attachment_ids=application_attachment_ids,
                value=v,
                path=json_rule.path,
                index=index,
            )
    else:
        # Otherwise we just need to check the value itself
        _validate_attachment_value(
            context=context,
            application_attachment_ids=application_attachment_ids,
            value=value,
            path=json_rule.path,
            index=None,
        )


def _parse_date(value: typing.Any) -> date | None:
    """Parse an ISO date string, returning None for anything that isn't one.

    Missing or badly formatted dates are left to JSON schema validation
    (required / format), so this rule only compares two real dates.
    """
    if not isinstance(value, str):
        return None

    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def validate_date_after(context: JsonRuleContext, json_rule: JsonRule) -> None:
    """Validate that a date is after another date on the form, for example
    a project end date compared to its start date.

    Config: ``{"rule": "date_after", "field": "<path>"}``, set on the later
    date, where field points at the earlier date. The path can be absolute
    or relative (@THIS.x). The same date on both is flagged, like the legacy form.
    """
    other_field = json_rule.rule.get("field")
    if other_field is None:
        raise ValueError("date_after requires a 'field' path")

    value = get_nested_value(context.json_data, json_rule.path)
    other_values = get_field_values(context.json_data, [other_field], json_rule.path)

    current_date = _parse_date(value)
    other_date = _parse_date(other_values[0]) if other_values else None
    if current_date is None or other_date is None:
        return

    if current_date <= other_date:
        context.validation_issues.append(
            ValidationErrorDetail(
                type=ValidationErrorType.INVALID_DATE_ORDER,
                message="The end date must be after the start date",
                field=build_path_str(json_rule.path),
                value=value,
            )
        )


VALIDATION_RULES = {
    "attachment": validate_attachments,
    "date_after": validate_date_after,
}


def handle_validation(context: JsonRuleContext, json_rule: JsonRule) -> None:
    if not context.config.do_field_validation:
        return

    rule_code: str | None = json_rule.rule.get("rule", None)

    log_extra = context.get_log_context() | json_rule.get_log_context()

    if rule_code is None:
        logger.warning("Rule code is null for configuration", extra=log_extra)
        return
    if rule_code not in VALIDATION_RULES:
        logger.warning("Rule code does not have a defined mapper", extra=log_extra)
        return

    # Run the validation rule, if there are any issues
    # they'll be added to the context
    rule_func = VALIDATION_RULES[rule_code]
    rule_func(context, json_rule)
