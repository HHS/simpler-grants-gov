import pytest

from src.form_schema.rule_processing.json_rule_util import (
    _get_index_from_str,
    build_path_str,
    get_field_values,
    make_relative_path_absolute,
    populate_nested_value,
)

COMPLEX_ARRAY_DATA = {
    "array_field": [
        {"x": 1, "y": "hello", "nested_array": [{"a": 10, "b": 4}, {"a": 15}]},
        {"x": 3, "y": "there", "z": "words", "nested_array": [{"a": 5, "b": 6}]},
        {"nested_array": [{"g": 100}]},
        {"e": "text"},
    ]
}


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
        # Arrays can be updated
        ({"my_array": [1, 2, 3]}, ["my_array[1]"], 25, {"my_array": [1, 25, 3]}),
        (
            {"my_array": [{"x": 1}, {"x": 2}, {"x": 3}]},
            ["my_array[1]", "x"],
            25,
            {"my_array": [{"x": 1}, {"x": 25}, {"x": 3}]},
        ),
        (
            {"my_array": [{"x": 1}, {"x": 2}, {"x": 3}]},
            ["my_array[1]", "y", "z"],
            25,
            {"my_array": [{"x": 1}, {"x": 2, "y": {"z": 25}}, {"x": 3}]},
        ),
        # All values in an array can be updated
        ({"my_array": [1, 2, 3]}, ["my_array[*]"], 25, {"my_array": [25, 25, 25]}),
        (
            {"my_array": [{"x": 1}, {"x": 2}, {"x": 3}]},
            ["my_array[*]", "x"],
            25,
            {"my_array": [{"x": 25}, {"x": 25}, {"x": 25}]},
        ),
        (
            {"my_array": [{"x": 1}, {"x": 2}, {"x": 3}]},
            ["my_array[*]", "y", "z"],
            25,
            {
                "my_array": [
                    {"x": 1, "y": {"z": 25}},
                    {"x": 2, "y": {"z": 25}},
                    {"x": 3, "y": {"z": 25}},
                ]
            },
        ),
        # Nested arrays work
        (
            {
                "my_array": [
                    {"x": {"inner_array": [{"y": 3}]}},
                    {"x": {"inner_array": [{"y": 100}]}},
                ]
            },
            ["my_array[*]", "x", "inner_array[*]", "y"],
            10,
            {
                "my_array": [
                    {"x": {"inner_array": [{"y": 10}]}},
                    {"x": {"inner_array": [{"y": 10}]}},
                ]
            },
        ),
        (
            {
                "my_array": [
                    {"x": {"inner_array": [{"y": 3}]}},
                    {"x": {"inner_array": [{"y": 100}]}},
                ]
            },
            ["my_array[1]", "x", "inner_array[0]", "y"],
            10,
            {"my_array": [{"x": {"inner_array": [{"y": 3}]}}, {"x": {"inner_array": [{"y": 10}]}}]},
        ),
        # If an array field doesn't already exist, it won't be created
        ({}, ["my_array[*]"], 25, {}),
        ({}, ["my_array[1]"], 25, {}),
    ],
)
def test_populate_nested_value(existing_json, path, value, expected_json):
    assert populate_nested_value(existing_json, path, value) == expected_json


@pytest.mark.parametrize(
    "existing_json,path,expected_json",
    [
        ({"my_field": {"x": 4}}, ["my_field", "x"], {"my_field": {}}),
        ({}, ["my_field", "x"], {}),
        ({}, ["x", "y", "z"], {}),
        ({}, ["my_field"], {}),
        (
            {"my_field": [{"a": 1, "x": 10}, {"x": 4}]},
            ["my_field[*]", "x"],
            {"my_field": [{"a": 1}, {}]},
        ),
        (
            {"my_field": [{"a": 1, "x": 10}, {"x": 4}]},
            ["my_field[0]", "x"],
            {"my_field": [{"a": 1}, {"x": 4}]},
        ),
        # Deleting values in an array is not supported at this time
        # so these cases will just be changed to None unlike the above cases
        # See the README.md in the rule_processing folder for further details
        ({"my_field": [1, 2, 3]}, ["my_field[*]"], {"my_field": [None, None, None]}),
        ({"my_field": [1, 2, 3]}, ["my_field[1]"], {"my_field": [1, None, 3]}),
    ],
)
def test_populate_nested_value_null_exclude_value(existing_json, path, expected_json):
    assert populate_nested_value(existing_json, path, None) == expected_json


@pytest.mark.parametrize(
    "existing_json,path,expected_json",
    [
        ({"my_field": {"x": 4}}, ["my_field", "x"], {"my_field": {"x": None}}),
        ({}, ["my_field", "x"], {"my_field": {"x": None}}),
        ({}, ["x", "y", "z"], {"x": {"y": {"z": None}}}),
        ({}, ["my_field"], {"my_field": None}),
        (
            {"my_field": [{"a": 1, "x": 10}, {"x": 4}]},
            ["my_field[*]", "x"],
            {"my_field": [{"a": 1, "x": None}, {"x": None}]},
        ),
        ({"my_field": [1, 2, 3]}, ["my_field[*]"], {"my_field": [None, None, None]}),
        ({"my_field": [1, 2, 3]}, ["my_field[1]"], {"my_field": [1, None, 3]}),
    ],
)
def test_populate_nested_value_null_set_as_null(existing_json, path, expected_json):
    assert (
        populate_nested_value(existing_json, path, None, remove_null_fields=False) == expected_json
    )


def test_populate_nested_value_non_dict_in_path():
    with pytest.raises(
        ValueError,
        match="Unable to populate nested value, value in path is not a dictionary: my_field",
    ):
        populate_nested_value({"my_field": 10}, ["my_field", "nested"], "hello")


def test_populate_nested_value_empty_path():
    with pytest.raises(
        ValueError,
        match="Unable to populate nested value, empty path given",
    ):
        populate_nested_value({"my_field": 10}, [], "hello")


def test_populate_nested_value_value_is_not_array():
    with pytest.raises(
        ValueError, match="Unable to populate nested value, value in path is not a list"
    ):
        populate_nested_value({"my_field": 10}, ["my_field[*]"], "hello")


@pytest.mark.parametrize(
    "path,relative_path,expected_value",
    [
        (["x", "y"], "@THIS.a.b", ["x", "a", "b"]),
        (["x"], "@THIS.a.b", ["a", "b"]),
        (["m[0]", "n[*]", "o"], "@THIS.x[1].z[0]", ["m[0]", "n[*]", "x[1]", "z[0]"]),
    ],
)
def test_make_relative_path_absolute(path, relative_path, expected_value):
    assert make_relative_path_absolute(path, relative_path) == expected_value


@pytest.mark.parametrize(
    "fields,path,expected_value",
    [
        ### Absolute paths
        ### These don't use the path param
        (["array_field[*].x"], [], [1, 3]),
        (["array_field[*].y"], [], ["hello", "there"]),
        (["array_field[*].z"], [], ["words"]),
        (["array_field[*].e"], [], ["text"]),
        (["array_field[3]"], [], [{"e": "text"}]),
        (["array_field[*].nested_array[*].g"], [], [100]),
        (["array_field[0].nested_array[*].a"], [], [10, 15]),
        (["array_field[100]"], [], []),
        ### Relative paths
        (["@THIS.y"], ["array_field[*]", "y"], ["hello", "there"]),
        (["@THIS.y"], ["array_field[*]", "x"], ["hello", "there"]),
        (["@THIS.e"], ["array_field[*]", "x"], ["text"]),
        (["@THIS.nested_array[*].b"], ["array_field[*]", "y"], [4, 6]),
        (["@THIS.a"], ["array_field[*]", "nested_array[*]", "b"], [10, 15, 5]),
        (["@THIS.nested_array[0].a"], ["array_field[*]", "x"], [10, 5]),
    ],
)
def test_get_field_values(fields, path, expected_value):
    assert get_field_values(COMPLEX_ARRAY_DATA, fields, path) == expected_value


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


def test_get_index_from_str():
    assert _get_index_from_str("text[0]") == "0"
    assert _get_index_from_str("m[0].text[123]") == "123"
    assert _get_index_from_str("a.b.c.text[*]") == "*"

    assert _get_index_from_str("text") is None
    assert _get_index_from_str("my_text[-1]") is None
    assert _get_index_from_str("[1]my_text") is None
    assert _get_index_from_str("my_text[**]") is None
