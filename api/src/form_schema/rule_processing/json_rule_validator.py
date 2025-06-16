import logging

from src.api.response import ValidationErrorDetail
from src.form_schema.rule_processing.json_rule_context import JsonRuleContext
from src.form_schema.rule_processing.json_rule_util import build_path_str, get_nested_value
from src.validation.validation_constants import ValidationErrorType

logger = logging.getLogger(__name__)


def validate_attachments(context: JsonRuleContext, rule: dict, path: list[str]) -> None:
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
    value = get_nested_value(context.json_data, path)

    # If there is no value currently for an attachment field
    # then we don't do any check, if the field is required, JSON schema
    # validation will handle flagging that where appropriate.
    if value is None:
        return

    # If the value isn't a string, we can skip doing any checks
    # because the type checking from the JSON schema should flag the field.
    # TODO - when we figure out how we're handling list fields, we'll
    # want to add something here as well to allow a list of strings.
    if isinstance(value, str) and value not in application_attachment_ids:
        context.validation_issues.append(
            ValidationErrorDetail(
                type=ValidationErrorType.UNKNOWN_APPLICATION_ATTACHMENT,
                message="Field references application_attachment_id not on the application",
                field=build_path_str(path),
                value=value,
            )
        )


VALIDATION_RULES = {"attachment": validate_attachments}


def handle_validation(context: JsonRuleContext, rule: dict, path: list[str]) -> None:
    if not context.config.do_field_validation:
        return

    rule_code: str | None = rule.get("rule", None)

    log_extra = context.get_log_context() | {"validation_rule": rule_code, "path": ".".join(path)}

    if rule_code is None:
        logger.warning("Rule code is null for configuration", extra=log_extra)
        return
    if rule_code not in VALIDATION_RULES:
        logger.warning("Rule code does not have a defined mapper", extra=log_extra)
        return

    # Run the validation rule, if there are any issues
    # they'll be added to the context
    rule_func = VALIDATION_RULES[rule_code]
    rule_func(context, rule, path)
