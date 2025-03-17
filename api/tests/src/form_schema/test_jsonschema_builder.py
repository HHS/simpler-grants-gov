from enum import StrEnum

import jsonschema

from src.form_schema.jsonschema_builder import JsonSchemaBuilder


class MyTestEnum(StrEnum):
    A = "a"
    B = "b"
    C = "c"


def validate_expected_errors(schema: dict, value: dict, expected_errors: list[str]):
    validator = jsonschema.Draft202012Validator(
        schema, format_checker=jsonschema.Draft202012Validator.FORMAT_CHECKER
    )
    error_messages = [e.message for e in validator.iter_errors(value)]

    assert set(error_messages) == set(expected_errors)


def test_schema_builder_string():
    schema = (
        JsonSchemaBuilder()
        .add_string_property("Field1", is_nullable=False, is_required=True, min_length=3)
        .add_string_property("Field2", is_nullable=True, is_required=False, max_length=4)
        .add_string_property("Field3", is_nullable=True, is_required=False, pattern=r"^\d+$")
        .add_string_property("Field4", is_nullable=True, is_required=False, format="email")
        .add_string_property("Field5", is_nullable=True, is_required=False, enum=["X", "Y", "Z"])
        .add_string_property("Field6", is_nullable=False, is_required=True, enum=MyTestEnum)
        .build()
    )

    # Verify the schema rules work as expected
    validate_expected_errors(
        schema, {}, ["'Field1' is a required property", "'Field6' is a required property"]
    )
    validate_expected_errors(
        schema,
        {
            "Field1": "a",
            "Field2": "too long",
            "Field3": "not the pattern",
            "Field4": "not-an-email",
            "Field5": "x",
            "Field6": "hello",
        },
        [
            "'a' is too short",
            "'hello' is not one of ['a', 'b', 'c']",
            "'not the pattern' does not match '^\\\\d+$'",
            "'not-an-email' is not a 'email'",
            "'too long' is too long",
            "'x' is not one of ['X', 'Y', 'Z']",
        ],
    )

    # Valid cases
    validate_expected_errors(
        schema,
        {
            "Field1": "hello",
            "Field2": "hi",
            "Field3": "4",
            "Field4": "bob@mail.com",
            "Field5": "Y",
            "Field6": "a",
        },
        [],
    )
    validate_expected_errors(schema, {"Field1": "this is text", "Field6": "b"}, [])


def test_schema_builder_bool():
    # Test all the combos of is_nullable/is_required here as bools are pretty simple
    schema = (
        JsonSchemaBuilder()
        .add_bool_property("Field1", is_nullable=True, is_required=True)
        .add_bool_property("Field2", is_nullable=False, is_required=True)
        .add_bool_property("Field3", is_nullable=True, is_required=False)
        .add_bool_property("Field4", is_nullable=False, is_required=False)
        .build()
    )

    # Verify the schema rules work as expected
    validate_expected_errors(
        schema, {}, ["'Field1' is a required property", "'Field2' is a required property"]
    )
    validate_expected_errors(
        schema,
        {"Field1": None, "Field2": None, "Field3": None, "Field4": None},
        ["None is not of type 'boolean'", "None is not of type 'boolean'"],
    )

    # Valid cases
    validate_expected_errors(
        schema, {"Field1": None, "Field2": True, "Field3": None, "Field4": False}, []
    )
    validate_expected_errors(
        schema, {"Field1": False, "Field2": False, "Field3": False, "Field4": True}, []
    )
    validate_expected_errors(schema, {"Field1": True, "Field2": True}, [])


def test_schema_builder_int():
    schema = (
        JsonSchemaBuilder()
        .add_int_property("Field1", is_nullable=True, is_required=False, minimum=5)
        .add_int_property("Field2", is_nullable=True, is_required=False, maximum=100)
        .add_int_property("Field3", is_nullable=False, is_required=False, exclusive_minimum=24)
        .add_int_property("Field4", is_nullable=True, is_required=True, exclusive_maximum=-1)
        .build()
    )

    # Verify the schema rules work as expected
    validate_expected_errors(schema, {}, ["'Field4' is a required property"])
    validate_expected_errors(
        schema,
        {"Field1": None, "Field2": None, "Field3": None, "Field4": None},
        ["None is not of type 'integer'"],
    )
    validate_expected_errors(
        schema,
        {"Field1": 4, "Field2": 101, "Field3": 24, "Field4": -1},
        [
            "4 is less than the minimum of 5",
            "101 is greater than the maximum of 100",
            "24 is less than or equal to the minimum of 24",
            "-1 is greater than or equal to the maximum of -1",
        ],
    )

    # Valid cases
    validate_expected_errors(schema, {"Field1": 5, "Field2": 100, "Field3": 25, "Field4": -2}, [])
    validate_expected_errors(schema, {"Field1": None, "Field2": None, "Field4": None}, [])


def test_schema_builder_float():
    schema = (
        JsonSchemaBuilder()
        .add_float_property("Field1", is_nullable=True, is_required=False, minimum=5.0)
        .add_float_property("Field2", is_nullable=True, is_required=False, maximum=100)
        .add_float_property("Field3", is_nullable=False, is_required=False, exclusive_minimum=24)
        .add_float_property("Field4", is_nullable=True, is_required=True, exclusive_maximum=-1.5)
        .build()
    )

    # Verify the schema rules work as expected
    validate_expected_errors(schema, {}, ["'Field4' is a required property"])
    validate_expected_errors(
        schema,
        {"Field1": None, "Field2": None, "Field3": None, "Field4": None},
        ["None is not of type 'number'"],
    )
    validate_expected_errors(
        schema,
        {"Field1": 4.99, "Field2": 100.1, "Field3": 24.0, "Field4": -1.5},
        [
            "4.99 is less than the minimum of 5.0",
            "100.1 is greater than the maximum of 100",
            "24.0 is less than or equal to the minimum of 24",
            "-1.5 is greater than or equal to the maximum of -1.5",
        ],
    )

    # Valid cases
    validate_expected_errors(
        schema, {"Field1": 5.00, "Field2": 100, "Field3": 24.1, "Field4": -1.6}, []
    )
    validate_expected_errors(
        schema, {"Field1": 55, "Field2": 4.135, "Field3": 101.11, "Field4": -2.345}, []
    )
    validate_expected_errors(schema, {"Field1": None, "Field2": None, "Field4": None}, [])


def test_schema_builder_sub_object():
    inner_schema_builder1 = (
        JsonSchemaBuilder()
        .add_string_property("Field1", is_nullable=True, is_required=False)
        .add_int_property("Field2", is_nullable=True, is_required=True)
    )

    inner_schema_builder2 = (
        JsonSchemaBuilder()
        .add_bool_property("Field3", is_nullable=False, is_required=False)
        .add_float_property("Field4", is_nullable=False, is_required=True)
    )

    schema = (
        JsonSchemaBuilder()
        .add_sub_object("NestedObject1", is_required=True, builder=inner_schema_builder1)
        .add_sub_object("NestedObject2", is_required=False, builder=inner_schema_builder2)
        .build()
    )

    # Verify the schema rules work as expected
    validate_expected_errors(schema, {}, ["'NestedObject1' is a required property"])
    validate_expected_errors(
        schema,
        {"NestedObject1": None, "NestedObject2": None},
        ["None is not of type 'object'", "None is not of type 'object'"],
    )
    validate_expected_errors(
        schema,
        {"NestedObject1": {}, "NestedObject2": {}},
        ["'Field2' is a required property", "'Field4' is a required property"],
    )
    validate_expected_errors(
        schema,
        {
            "NestedObject1": {"Field1": 1, "Field2": "hello"},
            "NestedObject2": {"Field3": 5, "Field4": "words"},
        },
        [
            "'hello' is not of type 'integer', 'null'",
            "'words' is not of type 'number'",
            "1 is not of type 'string', 'null'",
            "5 is not of type 'boolean'",
        ],
    )

    # Valid cases
    validate_expected_errors(
        schema,
        {
            "NestedObject1": {"Field1": "words", "Field2": 4},
            "NestedObject2": {"Field3": True, "Field4": 1.123},
        },
        [],
    )
    validate_expected_errors(
        schema, {"NestedObject1": {"Field2": None}, "NestedObject2": {"Field4": 0}}, []
    )


def test_schema_builder_refs():
    # Note that refs can be much more complex, referencing schemas in other files/schemas
    # for now let's just test referencing things from the $def section on a schema

    schema = (
        JsonSchemaBuilder()
        .add_def_object("DefObj1", {"type": "string"})
        .add_def_object("DefObj2", {"type": ["integer", "null"]})
        .add_ref_property("Field1", ref_path="#/$defs/DefObj1", is_required=True)
        .add_ref_property("Field2", ref_path="#/$defs/DefObj2", is_required=False)
        .build()
    )

    # Verify the schema rules work as expected
    validate_expected_errors(schema, {}, ["'Field1' is a required property"])
    validate_expected_errors(
        schema,
        {"Field1": 4, "Field2": "hello"},
        ["4 is not of type 'string'", "'hello' is not of type 'integer', 'null'"],
    )

    # Valid cases
    validate_expected_errors(schema, {"Field1": "hello", "Field2": 4}, [])
    validate_expected_errors(schema, {"Field1": "words", "Field2": None}, [])
    validate_expected_errors(schema, {"Field1": "text"}, [])
