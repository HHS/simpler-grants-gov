import inspect

import pytest
from marshmallow import ValidationError

from src.api.schemas.extension import fields
from tests.src.schemas.schema_validation_utils import (
    DummySchema,
    EnumA,
    EnumB,
    FieldTestSchema,
    get_expected_validation_errors,
    get_invalid_field_test_schema_req,
    get_valid_field_test_schema_req,
    validate_errors,
)


def test_enum_field():
    schema = DummySchema()

    both_ab_field = schema.declared_fields["both_ab"]

    # Make sure the multi enum can deserialize to both enums and reserialize to a string
    for e in EnumA:
        deserialized_value = both_ab_field._deserialize(str(e), None, None)
        assert deserialized_value == e
        assert isinstance(deserialized_value, EnumA)

        serialized_value = both_ab_field._serialize(e, None, None)
        assert isinstance(serialized_value, str)
    for e in EnumB:
        deserialized_value = both_ab_field._deserialize(str(e), None, None)
        assert deserialized_value == e
        assert isinstance(deserialized_value, EnumB)

        serialized_value = both_ab_field._serialize(e, None, None)
        assert isinstance(serialized_value, str)

    with pytest.raises(
        ValidationError, match="Must be one of: value1, value2, value3, value4, value5, value6."
    ):
        both_ab_field._deserialize("not_a_value", None, None)


@pytest.mark.parametrize(
    "payload,expected_errors",
    [(get_invalid_field_test_schema_req(), get_expected_validation_errors())],
)
def test_fields(payload, expected_errors):
    errors = FieldTestSchema().validate(payload)
    validate_errors(errors, expected_errors)


def test_fields_ignore_unknowns():
    unknown_key = "UNKNOWN"
    payload = {**get_valid_field_test_schema_req(), unknown_key: "EXCLUDED"}
    result = FieldTestSchema().load(payload)
    assert unknown_key not in result


def test_fields_configured_properly():
    """
    This is a sanity-test to verify we have properly
    overriden and defined all the default error codes
    that Marshmallow uses.

    If you see this test failing after updating our
    dependency on Marshmallow, likely just need to add
    a configuration to the relevant class' "error_mapping" object
    """
    relevant_classes = []
    for _, obj in inspect.getmembers(fields):
        if inspect.isclass(obj) and issubclass(obj, fields.MixinField):
            relevant_classes.append(obj)

    for relevant_class in relevant_classes:
        if relevant_class == fields.Enum:
            # We don't derive from the original and made a custom enum field
            # so the default error messages aren't relevant
            assert relevant_class.error_mapping.keys() == {"unknown"}
            continue

        # We want to make sure all keys are configured, but we also may have more
        required_error_message_keys = relevant_class.default_error_messages.keys()
        configured_error_message_keys = relevant_class.error_mapping.keys()
        assert configured_error_message_keys >= required_error_message_keys
