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
        schema = {"allOf": [{"maxLength": 60}, {"maxLength": 200}]}
        with pytest.raises(ConflictingKeywordsError, match="`maxLength` is declared as"):
            merge_allof(schema)
