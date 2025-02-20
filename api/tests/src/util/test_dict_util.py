import pytest

from src.util.dict_util import flatten_dict, diff_nested_dicts


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

def test_diff_nested_dicts() -> []:
    dict_a = {
        "name": "bob",
        "nested": {
            "sub_value1": [1, 2, 3, 4],
            "sub_value2": "hello",
            "sub_value3": "initial value",
        }
    }

    dict_b = {
        "name": "steve",
        "nested": {
            "sub_value1": [1, 2, 5],
            "sub_value2": "hello",
            "sub_value3": "new value"
        },
        "new_field": "yay"
    }

    expected = [
        {'field': 'nested.sub_value3',
         'before': 'initial value',
         'after': 'new value'},
        {'field': 'name', 'before': 'bob', 'after': 'steve'},
        {'field': 'new_field', 'before': None, 'after': 'yay'},
        {'field': 'nested.sub_value1', 'before': [1, 2, 3, 4], 'after': [1, 2, 5]}
    ]
    diffs = diff_nested_dicts(dict_a, dict_b)

    assert diffs == expected


