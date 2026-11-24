"""Tests for `merge_schema.merge_allof()` over hand-built schemas."""

import pytest

from tests.src.form_schema.parity.json_schema.harness.merge_schema import (
    ConflictingKeywordsError,
    merge_allof,
)


class TestMergeAllof:
    def test_merges_branches_into_one_schema(self):
        schema = {"allOf": [{"type": "string"}, {"maxLength": 60}]}
        assert merge_allof(schema) == {"type": "string", "maxLength": 60}

    def test_combines_required_and_properties(self):
        schema = {
            "allOf": [
                {"properties": {"a": {"type": "string"}}, "required": ["a"]},
                {"properties": {"b": {"type": "string"}}, "required": ["b"]},
            ]
        }
        assert merge_allof(schema) == {
            "properties": {"a": {"type": "string"}, "b": {"type": "string"}},
            "required": ["a", "b"],
        }

    def test_keeps_node_title_over_branch_title(self):
        schema = {"title": "Work email", "allOf": [{"type": "string", "title": "Email"}]}
        assert merge_allof(schema) == {"title": "Work email", "type": "string"}

    def test_leaves_conditional_branches_in_allof(self):
        conditional = {"if": {"required": ["a"]}, "then": {"required": ["b"]}}
        schema = {"allOf": [{"type": "object"}, conditional]}
        assert merge_allof(schema) == {"type": "object", "allOf": [conditional]}

    def test_raises_on_conflicting_validation_keywords(self):
        schema = {"allOf": [{"pattern": "^a$"}, {"pattern": "^b$"}]}
        with pytest.raises(ConflictingKeywordsError, match="`pattern` is declared as"):
            merge_allof(schema)

    @pytest.mark.parametrize(
        ("branches", "expected"),
        [
            ([{"maxLength": 100}, {"maxLength": 30}], {"maxLength": 30}),
            ([{"minLength": 1}, {"minLength": 6}], {"minLength": 6}),
            ([{"minimum": 0}, {"minimum": 1}], {"minimum": 1}),
            ([{"maxItems": 3}, {"maxItems": 1}], {"maxItems": 1}),
        ],
    )
    def test_keeps_the_strictest_bound_when_branches_set_different_bounds(self, branches, expected):
        assert merge_allof({"allOf": branches}) == expected

    def test_keeps_the_strictest_bound_when_a_node_narrows_its_branch(self):
        schema = {"allOf": [{"$ref": "#/$defs/x", "maxLength": 100}], "maxLength": 30}
        assert merge_allof(schema) == {"$ref": "#/$defs/x", "maxLength": 30}
