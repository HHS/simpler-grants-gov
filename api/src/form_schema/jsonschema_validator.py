import logging
import typing

import jsonschema

from src.api.response import ValidationErrorDetail
from src.db.models.competition_models import Form
from src.util.input_sanitizer import InputValidationError, validate_json_safe_dict

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


def _get_validator(json_schema: dict) -> jsonschema.Draft202012Validator:
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
        OUR_VALIDATOR.check_schema(json_schema)
    except jsonschema.exceptions.SchemaError:
        logger.exception("Invalid json schema found, cannot validate")
        raise

    validator = OUR_VALIDATOR(
        json_schema, format_checker=jsonschema.Draft202012Validator.FORMAT_CHECKER
    )

    return validator


def validate_json_schema(data: dict, json_schema: dict) -> list[ValidationErrorDetail]:
    """Validate data against a given json schema"""
    # First, validate that the data structure is safe for processing
    try:
        validate_json_safe_dict(data, max_depth=20, max_keys=10000)
        validate_json_safe_dict(json_schema, max_depth=20, max_keys=1000)
    except InputValidationError as e:
        logger.warning(f"Input structure validation failed: {e}")
        return [ValidationErrorDetail(
            message=f"Invalid input structure: {e}",
            type="structure_validation",
            field="$"
        )]
    
    validator = _get_validator(json_schema)

    validation_issues = []

    for e in validator.iter_errors(data):
        validation_issues.append(
            ValidationErrorDetail(message=e.message, type=e.validator, field=e.json_path)
        )

    return validation_issues


def validate_json_schema_for_form(data: dict, form: Form) -> list[ValidationErrorDetail]:
    """Validate data against json schema from a given form"""
    return validate_json_schema(data, form.form_json_schema)
