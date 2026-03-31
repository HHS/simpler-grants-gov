"""
Unit tests for SearchResponse parsing edge cases — missing and None fields
that can't easily be exercised via integration tests against a real OpenSearch instance.
"""

import pytest

from src.adapters.search.opensearch_response import SearchResponse


def _make_raw_response(
    hits: list[dict] | None = None,
    max_score: float | None = None,
    relation: str | None = None,
    aggregations: dict | None = None,
    took: int | None = None,
    timed_out: bool | None = None,
    shards_failed: int | None = None,
) -> dict:
    response: dict = {
        "hits": {
            "total": {"value": len(hits or []), "relation": relation},
            "max_score": max_score,
            "hits": hits or [],
        },
        "aggregations": aggregations or {},
    }
    if took is not None:
        response["took"] = took
    if timed_out is not None:
        response["timed_out"] = timed_out
    if shards_failed is not None:
        response["_shards"] = {"failed": shards_failed}

    return response


class TestSearchResponseParsing:
    def test_parses_all_fields_when_present(self):
        raw = _make_raw_response(
            max_score=4.25,
            relation="eq",
            aggregations={
                "agency": {"sum_other_doc_count": 12, "buckets": []},
                "applicant_type": {"sum_other_doc_count": 0, "buckets": []},
            },
            took=5,
            timed_out=False,
            shards_failed=0,
        )
        response = SearchResponse.from_opensearch_response(raw)

        assert response.max_score == pytest.approx(4.25)
        assert response.total_relation == "eq"
        assert response.took_ms == 5
        assert response.timed_out is False
        assert response.shards_failed == 0
        assert response.agg_overflow == {"agency": 12, "applicant_type": 0}

    def test_parses_fields_when_missing(self):
        raw = {"hits": {"total": {"value": 0}}}
        response = SearchResponse.from_opensearch_response(raw)

        assert response.max_score is None
        assert response.total_relation is None
        assert response.took_ms is None
        assert response.timed_out is None
        assert response.shards_failed is None
        assert response.score_stats == {
            "search.score_min": None,
            "search.score_max": None,
            "search.score_mean": None,
            "search.score_stdev": None,
        }
        assert response.agg_overflow == {}

    def test_parses_fields_when_explicitly_none(self):
        raw = _make_raw_response(
            max_score=None,
            relation=None,
        )
        response = SearchResponse.from_opensearch_response(raw)

        assert response.max_score is None
        assert response.total_relation is None

    def test_score_stats_skipped_when_include_scores_false(self):
        raw = _make_raw_response()
        response = SearchResponse.from_opensearch_response(raw, include_scores=False)

        assert response.score_stats == {}

    def test_agg_overflow_skips_aggregations_without_sum_other_doc_count(self):
        raw = _make_raw_response(
            aggregations={
                "agency": {"sum_other_doc_count": 5, "buckets": []},
                "close_date": {"buckets": []},
            },
        )
        response = SearchResponse.from_opensearch_response(raw)

        assert response.agg_overflow == {"agency": 5}
