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

@pytest.mark.parametrize("path,expected_value", [
    (["array_field[0]", "x"], 1),
    (["array_field[*]", "x"], [1, 3]),
    (["array_field[*]", "nested_array[*]", "a"], [10, 15, 5]),
    (["array_field[*]", "nested_array[*]", "a", "`this`", "a"], [10, 15, 5]),
])
def test_get_nested_value_of_arrays(path, expected_value):
    json_data = {
            "array_field": [
              {
                "x": 1,
                "y": "hello",
                "nested_array": [{"a": 10}, {"a": 15}]
              },
              {
                "x": 3,
                "y": "there",
                "z": "words",
                "nested_array": [{"a": 5}]
              },
                {
                    "nested_array": []
                }
            ]
        }

    assert get_nested_value(json_data, path) == expected_value


@pytest.mark.parametrize(
    "path,index,expected_str",
    [
        (["path", "to", "field"], None, "$.path.to.field"),
        (["my_field"], None, "$.my_field"),
        ([], None, "$"),
        (["a", "b", "c", "d", "e"], None, "$.a.b.c.d.e"),
        # With an index
        (["path", "to", "field"], 4, "$.path.to.field[4]"),
        (["my_field"], 0, "$.my_field[0]"),
        (["hello", "darkness", "my", "old", "friend"], 12, "$.hello.darkness.my.old.friend[12]"),
        (["a", "b", "c", "d", "e", "f"], 6, "$.a.b.c.d.e.f[6]"),
    ],
)
def test_build_path_str(path, index, expected_str):
    assert build_path_str(path, index=index) == expected_str
