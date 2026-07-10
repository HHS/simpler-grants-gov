"""
Unit tests for OpenSearch explanation parsing and New Relic event logging.
"""

from unittest.mock import patch

import pytest

from src.adapters.search.opensearch_explain import (
    EXPLAIN_TOP_N,
    FieldExplanation,
    log_search_result_explanations,
    parse_field_scores,
)

# ---------------------------------------------------------------------------
# parse_field_scores
# ---------------------------------------------------------------------------


def _make_explanation(details: list[dict]) -> dict:
    return {
        "value": sum(d["value"] for d in details),
        "description": "sum of:",
        "details": details,
    }


def _make_weight_detail(field: str, boost: float, score: float) -> dict:
    description = f"weight({field}^{boost}:some_term in 0) [PerFieldSimilarity], result of:"
    return {
        "value": score,
        "description": description,
        "details": [],
    }


def _make_weight_detail_no_boost(field: str, score: float) -> dict:
    description = f"weight({field}:some_term in 0) [PerFieldSimilarity], result of:"
    return {"value": score, "description": description, "details": []}


class TestParseFieldScores:
    def test_single_field(self):
        explanation = _make_explanation([_make_weight_detail("agency_code", 16, 16.0)])
        result = parse_field_scores(explanation)
        assert result == {"agency_code": FieldExplanation(score=16.0, boost=16.0)}

    def test_multiple_fields(self):
        explanation = _make_explanation(
            [
                _make_weight_detail("agency_code", 16, 16.0),
                _make_weight_detail("opportunity_number", 12, 12.0),
                _make_weight_detail("opportunity_title", 2, 2.0),
            ]
        )
        result = parse_field_scores(explanation)
        assert result == {
            "agency_code": FieldExplanation(score=16.0, boost=16.0),
            "opportunity_number": FieldExplanation(score=12.0, boost=12.0),
            "opportunity_title": FieldExplanation(score=2.0, boost=2.0),
        }

    def test_field_with_keyword_suffix(self):
        explanation = _make_explanation([_make_weight_detail("agency_code.keyword", 16, 16.0)])
        result = parse_field_scores(explanation)
        assert result == {"agency_code.keyword": FieldExplanation(score=16.0, boost=16.0)}

    def test_duplicate_field_scores_are_summed(self):
        # The same field can appear more than once in a bool query (multiple should clauses)
        explanation = _make_explanation(
            [
                _make_weight_detail("agency_code", 16, 8.0),
                _make_weight_detail("agency_code", 16, 4.0),
            ]
        )
        result = parse_field_scores(explanation)
        assert result == {"agency_code": FieldExplanation(score=12.0, boost=16.0)}

    def test_field_without_boost(self):
        explanation = _make_explanation([_make_weight_detail_no_boost("summary_description", 5.0)])
        result = parse_field_scores(explanation)
        assert result == {"summary_description": FieldExplanation(score=5.0, boost=None)}

    def test_nested_explanation(self):
        # OpenSearch sometimes nests weight nodes under intermediate sum nodes
        inner_detail = _make_weight_detail("opportunity_number", 12, 12.0)
        outer_sum = {
            "value": 12.0,
            "description": "sum of:",
            "details": [inner_detail],
        }
        explanation = _make_explanation([outer_sum])
        result = parse_field_scores(explanation)
        assert result == {"opportunity_number": FieldExplanation(score=12.0, boost=12.0)}

    def test_empty_explanation(self):
        result = parse_field_scores({})
        assert result == {}

    def test_explanation_with_no_weight_nodes(self):
        explanation = {
            "value": 1.0,
            "description": "ConstantScore(*:*)",
            "details": [],
        }
        result = parse_field_scores(explanation)
        assert result == {}


# ---------------------------------------------------------------------------
# log_search_result_explanations
# ---------------------------------------------------------------------------


def _make_hit(
    opportunity_id: str,
    opportunity_number: str,
    agency_code: str,
    score: float,
    explanation: dict | None = None,
    position: int = 1,
) -> dict:
    hit: dict = {
        "_score": score,
        "_source": {
            "opportunity_id": opportunity_id,
            "opportunity_number": opportunity_number,
            "agency_code": agency_code,
        },
    }
    if explanation is not None:
        hit["_explanation"] = explanation
    return hit


class TestLogSearchResultExplanations:
    @patch("src.adapters.search.opensearch_explain.record_custom_event")
    def test_logs_events_for_each_hit(self, mock_record_event):
        hits = [_make_hit(f"opp-{i}", f"NUM-{i}", "DOC", float(i)) for i in range(3)]
        log_search_result_explanations(hits, query="climate", scoring_rule="default")

        assert mock_record_event.call_count == 3

        # Verify first event params
        first_call_args = mock_record_event.call_args_list[0]
        event_type, params = first_call_args[0]
        assert event_type == "SearchResultExplanation"
        assert params["query"] == "climate"
        assert params["scoring_rule"] == "default"
        assert params["position"] == 1
        assert params["opportunity_id"] == "opp-0"
        assert params["opportunity_number"] == "NUM-0"
        assert params["agency_code"] == "DOC"

    @patch("src.adapters.search.opensearch_explain.record_custom_event")
    def test_positions_are_1_indexed(self, mock_record_event):
        hits = [_make_hit(f"opp-{i}", f"NUM-{i}", "DOC", float(10 - i)) for i in range(3)]
        log_search_result_explanations(hits, query="test", scoring_rule="default")

        positions = [call[0][1]["position"] for call in mock_record_event.call_args_list]
        assert positions == [1, 2, 3]

    @patch("src.adapters.search.opensearch_explain.record_custom_event")
    def test_caps_at_top_n_results(self, mock_record_event):
        hits = [_make_hit(f"opp-{i}", f"NUM-{i}", "DOC", float(i)) for i in range(20)]
        log_search_result_explanations(hits, query="test", scoring_rule="default")

        assert mock_record_event.call_count == EXPLAIN_TOP_N

    @patch("src.adapters.search.opensearch_explain.record_custom_event")
    def test_includes_field_scores_and_boosts_when_explanation_present(self, mock_record_event):
        explanation = _make_explanation(
            [
                _make_weight_detail("agency_code", 16, 16.0),
                _make_weight_detail("opportunity_number", 12, 12.0),
            ]
        )
        hits = [_make_hit("opp-1", "NUM-1", "USAID", 28.0, explanation=explanation)]
        log_search_result_explanations(hits, query="usaid", scoring_rule="default")

        _, params = mock_record_event.call_args_list[0][0]
        assert params["total_score"] == pytest.approx(28.0)
        assert params["field_score.agency_code"] == pytest.approx(16.0)
        assert params["field_boost.agency_code"] == pytest.approx(16.0)
        assert params["field_score.opportunity_number"] == pytest.approx(12.0)
        assert params["field_boost.opportunity_number"] == pytest.approx(12.0)

    @patch("src.adapters.search.opensearch_explain.record_custom_event")
    def test_no_boost_when_field_has_no_boost(self, mock_record_event):
        explanation = _make_explanation([_make_weight_detail_no_boost("summary_description", 5.0)])
        hits = [_make_hit("opp-1", "NUM-1", "DOC", 5.0, explanation=explanation)]
        log_search_result_explanations(hits, query="test", scoring_rule="default")

        _, params = mock_record_event.call_args_list[0][0]
        assert params["field_score.summary_description"] == pytest.approx(5.0)
        assert "field_boost.summary_description" not in params

    @patch("src.adapters.search.opensearch_explain.record_custom_event")
    def test_no_field_scores_when_no_explanation(self, mock_record_event):
        hits = [_make_hit("opp-1", "NUM-1", "DOC", 5.0, explanation=None)]
        log_search_result_explanations(hits, query="test", scoring_rule="default")

        _, params = mock_record_event.call_args_list[0][0]
        assert not any(k.startswith("field_score.") for k in params)
        assert not any(k.startswith("field_boost.") for k in params)

    @patch("src.adapters.search.opensearch_explain.record_custom_event")
    def test_empty_hits_logs_no_events(self, mock_record_event):
        log_search_result_explanations([], query="test", scoring_rule="default")
        mock_record_event.assert_not_called()

    @patch("src.adapters.search.opensearch_explain.record_custom_event")
    def test_none_query_is_passed_through(self, mock_record_event):
        hits = [_make_hit("opp-1", "NUM-1", "DOC", 1.0)]
        log_search_result_explanations(hits, query=None, scoring_rule="default")

        _, params = mock_record_event.call_args_list[0][0]
        assert params["query"] is None

    @patch("src.adapters.search.opensearch_explain.record_custom_event")
    def test_correlation_id_set_from_flask_context(self, mock_record_event, app):
        """correlation_id should be taken from flask.g.internal_request_id when available."""
        with app.test_request_context():
            import flask

            flask.g.internal_request_id = "test-request-id-123"

            hits = [_make_hit("opp-1", "NUM-1", "DOC", 5.0)]
            log_search_result_explanations(hits, query="test", scoring_rule="default")

        _, params = mock_record_event.call_args_list[0][0]
        assert params["correlation_id"] == "test-request-id-123"

    @patch("src.adapters.search.opensearch_explain.record_custom_event")
    def test_correlation_id_none_outside_request_context(self, mock_record_event):
        hits = [_make_hit("opp-1", "NUM-1", "DOC", 5.0)]
        log_search_result_explanations(hits, query="test", scoring_rule="default")

        _, params = mock_record_event.call_args_list[0][0]
        assert params["correlation_id"] is None
