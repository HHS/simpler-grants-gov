import logging
import typing

import jsonschema
from grants_shared.api.response import ValidationErrorDetail

from src.constants.lookup_constants import FormType
from src.db.models.competition_models import Form

logger = logging.getLogger(__name__)


def _required(
    validator: jsonschema.Draft202012Validator,
    required: typing.Any,
    instance: typing.Any,
    _: typing.Any,
) -> typing.Generator[jsonschema.ValidationError]:
    """Handle a required field in the JSON schema validation

    This is an almost exact copy of the base implementation,
    but we add the field to the path so that we know what
    field is missing in the path.
    """

    if not validator.is_type(instance, "object"):
        return

    for field_name in required:
        if field_name not in instance:
            yield jsonschema.ValidationError(
                f"{field_name!r} is a required property", path=[field_name]
            )


def _required_with_title(
    validator: jsonschema.Draft202012Validator,
    required: typing.Any,
    instance: typing.Any,
    schema: typing.Any,
) -> typing.Generator[jsonschema.ValidationError]:
    """Same as `_required`, but table-row forms use this instead so a missing
    field can be reported with its row's `title` for context (e.g. "Construction
    Total Cost is required"). Kept as a separate validator - used only
    for forms that opt in - so it can't change required-message behavior for
    every other form.
    """

    if not validator.is_type(instance, "object"):
        return

    for field_name in required:
        if field_name not in instance:
            title = schema.get("title")
            message = (
                f"{title} {field_name.replace('_', ' ').title()} is required"
                if title
                else f"{field_name!r} is a required property"
            )
            yield jsonschema.ValidationError(message, path=[field_name])


def _maxItems(
    validator: jsonschema.Draft202012Validator, mI: typing.Any, instance: typing.Any, _: typing.Any
) -> typing.Generator[jsonschema.ValidationError]:
    """Handle a maxItems field validator in the JSON Schema validation

    This is identical to the maxItems validator, but we adjusted the message
    to not contain the entire array that is too long. In some cases this was
    an incredibly large list of objects which was not helpful.
    """
    if validator.is_type(instance, "array") and len(instance) > mI:
        message = "is expected to be empty" if mI == 0 else "is too long"
        yield jsonschema.ValidationError(f"The array {message}, expected a maximum length of {mI}")


OUR_VALIDATOR = jsonschema.validators.extend(
    validator=jsonschema.Draft202012Validator,
    validators={
        "required": _required,
        "maxItems": _maxItems,
    },
)

TABLE_VALIDATOR = jsonschema.validators.extend(
    validator=jsonschema.Draft202012Validator,
    validators={
        "required": _required_with_title,
        "maxItems": _maxItems,
    },
)

FORM_TYPES_USING_TABLE_VALIDATOR = {FormType.SF424C}


def _get_validator_class(form: Form | None) -> type[jsonschema.Draft202012Validator]:
    if form is not None and form.form_type in FORM_TYPES_USING_TABLE_VALIDATOR:
        return TABLE_VALIDATOR
    return OUR_VALIDATOR


def _get_validator(
    json_schema: dict, validator_class: type[jsonschema.Draft202012Validator] = OUR_VALIDATOR
) -> jsonschema.Draft202012Validator:
    """Get a validator for your json schema

    See: https://python-jsonschema.readthedocs.io/en/stable/

    Note that we will likely want to expand this behavior over time
    as there are a lot of configuration options we'll want to consider.

    For now the main thing is that we enable format validation
        For example: if you say a field should be "emaiL" format it'll raise an error if it is
        Format validation is NOT enabled by default in the JSON Schema specification:
        https://python-jsonschema.readthedocs.io/en/stable/faq/#my-schema-specifies-format-validation-why-do-invalid-instances-seem-valid
    """

    # Validate that the schema passed in is actually valid
    # as an invalid schema can produce unknown results
    try:
        validator_class.check_schema(json_schema)
    except jsonschema.exceptions.SchemaError:
        logger.exception("Invalid json schema found, cannot validate")
        raise

    validator = validator_class(
        json_schema, format_checker=jsonschema.Draft202012Validator.FORMAT_CHECKER
    )

    return validator


def validate_json_schema(
    data: dict,
    json_schema: dict,
    validator_class: type[jsonschema.Draft202012Validator] = OUR_VALIDATOR,
) -> list[ValidationErrorDetail]:
    """Validate data against a given json schema"""
    validator = _get_validator(json_schema, validator_class)

    validation_issues = []

    for e in validator.iter_errors(data):
        validation_issues.append(
            ValidationErrorDetail(message=e.message, type=e.validator, field=e.json_path)
        )

    return validation_issues


def validate_json_schema_for_form(data: dict, form: Form) -> list[ValidationErrorDetail]:
    """Validate data against json schema from a given form"""
    return validate_json_schema(data, form.form_json_schema, _get_validator_class(form))
