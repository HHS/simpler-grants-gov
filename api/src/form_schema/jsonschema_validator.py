import logging

import jsonschema

from src.api.response import ValidationErrorDetail
from src.db.models.competition_models import Form

logger = logging.getLogger(__name__)


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
        jsonschema.Draft202012Validator.check_schema(json_schema)
    except jsonschema.exceptions.SchemaError:
        logger.exception("Invalid json schema found, cannot validate")
        raise

    validator = jsonschema.Draft202012Validator(
        json_schema, format_checker=jsonschema.Draft202012Validator.FORMAT_CHECKER
    )

    return validator


def validate_json_schema(data: dict, json_schema: dict) -> list[ValidationErrorDetail]:
    """Validate data against a given json schema"""
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
