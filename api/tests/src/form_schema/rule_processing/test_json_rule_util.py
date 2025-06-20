import pytest

from src.form_schema.rule_processing.json_rule_util import (
    build_path_str,
    get_nested_value,
    populate_nested_value,
)


@pytest.mark.parametrize(
    "existing_json,path,value,expected_json",
    [
        ({}, ["my_name"], "Bob", {"my_name": "Bob"}),
        ({}, ["nested", "my_name"], "Sally", {"nested": {"my_name": "Sally"}}),
        # Other values aren't affected, just new one is added
        (
            {"other_name": "Joe", "nested": {"color": "Blue"}},
            ["nested", "path", "to", "my_name"],
            "Steve",
            {
                "other_name": "Joe",
                "nested": {"color": "Blue", "path": {"to": {"my_name": "Steve"}}},
            },
        ),
        (
            {"some_field": 5, "another_field": True},
            ["nested", "field"],
            10,
            {"some_field": 5, "another_field": True, "nested": {"field": 10}},
        ),
        # Values can be replaced
        ({"my_name": "Sam"}, ["my_name"], "Samuel", {"my_name": "Samuel"}),
    ],
)
def test_populate_nested_value(existing_json, path, value, expected_json):
    assert populate_nested_value(existing_json, path, value) == expected_json


def test_populate_nested_value_non_dict_in_path():
    with pytest.raises(
        ValueError,
        match="Unable to populate nested value, value in path is not a dictionary: my_field.nested",
    ):
        populate_nested_value({"my_field": 10}, ["my_field", "nested"], "hello")


def test_populate_nested_value_empty_path():
    with pytest.raises(
        ValueError,
        match="Unable to populate nested value, empty path given",
    ):
        populate_nested_value({"my_field": 10}, [], "hello")


@pytest.mark.parametrize(
    "json_data,path,expected_value",
    [
        ({"my_field": 5}, ["my_field"], 5),
        ({"nested": {"path": {"to": {"value": 10}}}}, ["nested", "path", "to", "value"], 10),
        # Path doesn't fully exist
        ({}, ["whatever", "path"], None),
        ({"whatever": {}}, ["whatever", "path"], None),
        # Can fetch a whole chunk
        (
            {"nested": {"path": {"to": {"value": "hello"}}}},
            ["nested"],
            {"path": {"to": {"value": "hello"}}},
        ),
        (
            {"nested": {"path": ["hello", "there", "this is a text"]}},
            ["nested", "path"],
            ["hello", "there", "this is a text"],
        ),
        # Passing in an empty path returns itself
        ({"example": 5, "nested": {"field": 100}}, [], {"example": 5, "nested": {"field": 100}}),
    ],
)
def test_get_nested_value(json_data, path, expected_value):
    assert get_nested_value(json_data, path) == expected_value


@pytest.mark.parametrize(
    "path,expected_str",
    [
        (["path", "to", "field"], "$.path.to.field"),
        (["my_field"], "$.my_field"),
        ([], "$"),
        (["a", "b", "c", "d", "e"], "$.a.b.c.d.e"),
    ],
)
def test_build_path_str(path, expected_str):
    assert build_path_str(path) == expected_str
