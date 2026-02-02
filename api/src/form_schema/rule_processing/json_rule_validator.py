import logging
import typing

from src.api.response import ValidationErrorDetail
from src.form_schema.rule_processing.json_rule_context import JsonRule, JsonRuleContext
from src.form_schema.rule_processing.json_rule_util import build_path_str
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


VALIDATION_RULES = {"attachment": validate_attachments}


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
