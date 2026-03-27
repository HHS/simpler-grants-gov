"""
Unit tests for SearchResponse parsing, specifically verifying the the metrics
required for #9149 (max_score, total_relation, agency_sum_other_doc_count).
"""

from src.adapters.search.opensearch_response import SearchResponse

def _make_raw_response(
    hits: list[dict] | None = None,
    max_score: float | None = None,
    relation: str | None = None,
    agency_sum_other_doc_count: int | None = None,
) -> dict:
    aggregations = {}
    if agency_sum_other_doc_count is not None:
        aggregations["agency"] = {"sum_other_doc_count": agency_sum_other_doc_count}

    return {
        "hits": {
            "total": {"value": len(hits or []), "relation": relation},
            "max_score": max_score,
            "hits": hits or [],
        },
        "aggregations": aggregations,
    }


class TestSearchResponseRelevanceMetrics:
    def test_parses_metrics_when_present(self):
        raw = _make_raw_response(
            max_score=4.25,
            relation="eq",
            agency_sum_other_doc_count=12,
        )
        response = SearchResponse.from_opensearch_response(raw)

        assert response.max_score == 4.25
        assert response.total_relation == "eq"
        assert response.agency_sum_other_doc_count == 12

    def test_parses_metrics_when_missing(self):
        # Empty dict or missing fields should gracefully fall back to None
        raw = {"hits": {"total": {"value": 0}}}
        response = SearchResponse.from_opensearch_response(raw)

        assert response.max_score is None
        assert response.total_relation is None
        assert response.agency_sum_other_doc_count is None

    def test_parses_metrics_when_explicitly_none(self):
        raw = _make_raw_response(
            max_score=None,
            relation=None,
            agency_sum_other_doc_count=None,
        )
        response = SearchResponse.from_opensearch_response(raw)

        assert response.max_score is None
        assert response.total_relation is None
        assert response.agency_sum_other_doc_count is None
