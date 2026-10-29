import pytest

from src.util.dict_util import diff_nested_dicts, flatten_dict, get_nested_value


@pytest.mark.parametrize(
    "data,expected_output",
    [
        # Scenario 1 - routine case
        (
            {"a": {"b": {"c": "value_c", "f": 5}, "d": "value_d"}, "e": "value_e"},
            {"a.b.c": "value_c", "a.b.f": 5, "a.d": "value_d", "e": "value_e"},
        ),
        # Scenario 2 - empty
        ({}, {}),
        # Scenario 3 - no nesting
        (
            {
                "a": "1",
                "b": 2,
                "c": True,
            },
            {
                "a": "1",
                "b": 2,
                "c": True,
            },
        ),
        # Scenario 4 - very nested
        (
            {
                "a": {
                    "b": {
                        "c": {
                            "d": {
                                "e": {
                                    "f": {"g": {"h1": "h1_value", "h2": ["h2_value1", "h2_value2"]}}
                                }
                            }
                        }
                    }
                }
            },
            {"a.b.c.d.e.f.g.h1": "h1_value", "a.b.c.d.e.f.g.h2": ["h2_value1", "h2_value2"]},
        ),
        # Scenario 5 - dictionaries inside non-dictionaries aren't flattened
        ({"a": {"b": [{"list_dict_a": "a"}]}}, {"a.b": [{"list_dict_a": "a"}]}),
        # Scenario 6 - integer keys should be allowed too
        ({"a": {0: {"b": "b_value"}, 1: "c"}}, {"a.0.b": "b_value", "a.1": "c"}),
    ],
)
def test_flatten_dict(data, expected_output):
    assert flatten_dict(data) == expected_output


@pytest.mark.parametrize(
    "dict1,dict2,expected_output",
    [
        (
            # dict1
            {"a": "apple", "b": {"x": 1, "y": 2}, "c": 100},  # additional field a
            # dict2
            {
                "b": {"x": 1, "y": 3},  # changed y
                "c": 200,  # changed c
                "d": "dog",  # new field added
            },
            # expected output
            [
                {"field": "a", "before": "apple", "after": None},
                {"field": "b.y", "before": 2, "after": 3},
                {"field": "c", "before": 100, "after": 200},
                {"field": "d", "before": None, "after": "dog"},
            ],
        ),
        (
            # dict1
            {"a": "ball", "b": {"p": 5, "q": 10}, "e": "elephant"},
            # dict2
            {
                "a": "bat",  # changed a
                "b": {"p": 5, "q": 1.1},  # no change  # changed q
                "e": "elephant",  # no change
            },
            # expected output
            [
                {"field": "a", "before": "ball", "after": "bat"},
                {"field": "b.q", "before": 10, "after": 1.1},
            ],
        ),
        (
            # dict1
            {"x": 10, "y": "yellow", "z": {"m": "mouse", "n": True}},
            # dict2
            {
                "x": 10,  # no change
                "y": "yellow",  # no change
                "z": {"m": "mouse", "n": False},  # no change  # changed n
            },
            # expected output
            [{"field": "z.n", "before": True, "after": False}],
        ),
        (
            # dict1
            {"x": {"x": {"x": [1, 2, True]}}},
            # dict2
            {"x": {"x": {"x": [1, 2, True]}}},  # no change
            # expected output
            [],
        ),
        (
            # dict1
            {"x": {"x": {"x": [1, 2, True]}}},
            # dict2
            {"x": {"x": {"x": [1, True, 2]}}},  # re-ordered list
            # expected output
            [],
        ),
        (
            # dict1
            {"x": {"x": [1, 2], "z": None}},  # missing y
            # dict2
            {"x": {"y": [1, 2], "z": 4}},  # missing x
            # expected output
            [
                {"field": "x.x", "before": [1, 2], "after": None},
                {"field": "x.y", "before": None, "after": [1, 2]},
                {"field": "x.z", "before": None, "after": 4},
            ],
        ),
    ],
)
def test_diff_nested_dicts(dict1, dict2, expected_output):
    result = diff_nested_dicts(dict1, dict2)

    assert len(result) == len(expected_output)

    expected_sorted = sorted(expected_output, key=lambda x: x["field"])
    sorted_result = sorted(result, key=lambda x: x["field"])

    assert expected_sorted == sorted_result


# Test data for get_nested_value tests
COMPLEX_ARRAY_DATA = {
    "array_field": [
        {"x": 1, "y": "hello", "nested_array": [{"a": 10, "b": 4}, {"a": 15}]},
        {"x": 3, "y": "there", "z": "words", "nested_array": [{"a": 5, "b": 6}]},
        {"nested_array": [{"g": 100}]},
        {"e": "text"},
    ]
}


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
    "path,expected_value",
    [
        (["array_field[0]", "x"], 1),
        (["array_field[*]", "x"], [1, 3]),
        (["array_field[*]", "nested_array[*]", "a"], [10, 15, 5]),
        (["array_field[*]", "nested_array[*]", "b"], [4, 6]),
    ],
)
def test_get_nested_value_of_arrays(path, expected_value):
    assert get_nested_value(COMPLEX_ARRAY_DATA, path) == expected_value
