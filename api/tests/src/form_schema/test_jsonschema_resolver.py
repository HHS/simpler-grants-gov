import copy

import jsonref
import pytest

from src.form_schema.jsonschema_resolver import resolve_jsonschema
from src.form_schema.jsonschema_validator import validate_json_schema
from src.form_schema.shared import ADDRESS_SHARED_V1, COMMON_SHARED_V1


def test_resolver_nothing_to_resolve():
    # A schema with varying types and validations, but no $ref
    schema = {
        "type": "object",
        "required": ["field_a", "field_b", "field_c"],
        "properties": {
            "field_a": {
                "type": "string",
                "title": "Field A",
                "description": "The field associated with A",
            },
            "field_b": {"type": "array", "minItems": 1, "items": {"type": "string"}},
            "field_c": {"type": "integer", "enum": [1, 2, 3]},
            "field_d": {
                "type": "object",
                "required": ["field_d_a"],
                "properties": {"field_d_a": {"type": "string"}},
            },
            "field_e": {"type": "string", "minLength": 10, "maxLength": 50},
            "field_f": {"allOf": [{"type": "string"}]},
        },
    }

    # Resolving this schema should do nothing
    assert resolve_jsonschema(schema) == schema


def test_resolve_jsonschema_defs():
    schema = {
        "type": "object",
        "properties": {
            "field_a": {"$ref": "#/$defs/my_def_a"},
            "field_a_allof": {"allOf": [{"$ref": "#/$defs/my_def_a"}]},
            "field_b": {"$ref": "#/$defs/my_def_b"},
            "field_b_allof": {"allOf": [{"$ref": "#/$defs/my_def_b"}]},
        },
        "$defs": {
            "my_def_a": {"type": "string"},
            "my_def_b": {
                "type": "object",
                "properties": {
                    "nested_a": {"$ref": "#/$defs/my_def_a"},
                    "nested_a_allof": {"allOf": [{"$ref": "#/$defs/my_def_a"}]},
                },
            },
        },
    }

    expected_schema = copy.deepcopy(schema)
    # The defs get resolved first
    expected_schema["$defs"]["my_def_b"]["properties"]["nested_a"] = expected_schema["$defs"][
        "my_def_a"
    ]
    expected_schema["$defs"]["my_def_b"]["properties"]["nested_a_allof"]["allOf"][0] = (
        expected_schema["$defs"]["my_def_a"]
    )

    expected_schema["properties"]["field_a"] = expected_schema["$defs"]["my_def_a"]
    expected_schema["properties"]["field_a_allof"]["allOf"][0] = expected_schema["$defs"][
        "my_def_a"
    ]

    # Note this works because we changed the defs above
    # these are the resolved values
    expected_schema["properties"]["field_b"] = expected_schema["$defs"]["my_def_b"]
    expected_schema["properties"]["field_b_allof"]["allOf"][0] = expected_schema["$defs"][
        "my_def_b"
    ]

    resolved_schema = resolve_jsonschema(schema)
    assert resolved_schema == expected_schema

    # Verify the JSON schema itself is valid, this errors if it isn't
    validate_json_schema({}, resolved_schema)


def test_resolve_jsonschema_shared_schema():
    schema = {
        "type": "object",
        "properties": {
            "address": {"$ref": ADDRESS_SHARED_V1.field_ref("address")},
            "simple_address": {"allOf": [{"$ref": ADDRESS_SHARED_V1.field_ref("simple_address")}]},
            "attachment": {
                "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("attachment")}],
                "title": "Attachment",
                "description": "Attach it!",
            },
            "person_name": {"allOf": [{"$ref": COMMON_SHARED_V1.field_ref("person_name")}]},
        },
    }

    expected_schema = copy.deepcopy(schema)
    resolved_address = ADDRESS_SHARED_V1.json_schema["address"]
    resolved_address["properties"]["state"]["allOf"][0] = ADDRESS_SHARED_V1.json_schema[
        "state_code"
    ]
    resolved_address["properties"]["country"]["allOf"][0] = ADDRESS_SHARED_V1.json_schema[
        "country_code"
    ]
    expected_schema["properties"]["address"] = resolved_address

    resolved_simple_address = ADDRESS_SHARED_V1.json_schema["simple_address"]
    resolved_simple_address["properties"]["state"]["allOf"][0] = ADDRESS_SHARED_V1.json_schema[
        "state_code"
    ]
    expected_schema["properties"]["simple_address"]["allOf"][0] = resolved_simple_address

    expected_schema["properties"]["attachment"]["allOf"][0] = COMMON_SHARED_V1.json_schema[
        "attachment"
    ]
    expected_schema["properties"]["person_name"]["allOf"][0] = COMMON_SHARED_V1.json_schema[
        "person_name"
    ]

    resolved_schema = resolve_jsonschema(schema)
    assert resolved_schema == expected_schema

    # Verify the JSON schema itself is valid, this errors if it isn't
    validate_json_schema({}, resolved_schema)


def test_resolve_jsonschema_invalid_ref():
    """Verify that if there is an invalid ref, it'll error"""
    schema = {
        "type": "object",
        "properties": {
            "my_field": {"$ref": "#/$defs/not_a_field"},
        },
    }

    with pytest.raises(jsonref.JsonRefError, match="Unresolvable JSON pointer"):
        resolve_jsonschema(schema)
