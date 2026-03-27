"""
Unit tests for SearchResponse parsing, including took_ms and raw_hits fields
added to support query explanation logging.
"""

import pytest

from src.adapters.search.opensearch_response import SearchResponse


def _make_raw_response(
    hits: list[dict] | None = None,
    took: int | None = None,
    aggregations: dict | None = None,
) -> dict:
    return {
        "took": took,
        "timed_out": False,
        "hits": {
            "total": {"value": len(hits or []), "relation": "eq"},
            "max_score": 1.0,
            "hits": hits or [],
        },
        **({"aggregations": aggregations} if aggregations else {}),
    }


def _make_hit(
    doc_id: str, source: dict, score: float = 1.0, explanation: dict | None = None
) -> dict:
    hit: dict = {"_id": doc_id, "_score": score, "_source": source}
    if explanation is not None:
        hit["_explanation"] = explanation
    return hit


class TestSearchResponseTookMs:
    def test_took_ms_is_parsed(self):
        raw = _make_raw_response(took=145)
        response = SearchResponse.from_opensearch_response(raw)
        assert response.took_ms == 145

    def test_took_ms_is_none_when_missing(self):
        raw = _make_raw_response()
        del raw["took"]
        response = SearchResponse.from_opensearch_response(raw)
        assert response.took_ms is None

    def test_took_ms_zero(self):
        raw = _make_raw_response(took=0)
        response = SearchResponse.from_opensearch_response(raw)
        assert response.took_ms == 0


class TestSearchResponseRawHits:
    def test_raw_hits_preserved(self):
        hit = _make_hit("1", {"opportunity_id": "abc", "title": "Test"}, score=5.0)
        raw = _make_raw_response(hits=[hit])
        response = SearchResponse.from_opensearch_response(raw)

        assert len(response.raw_hits) == 1
        assert response.raw_hits[0]["_id"] == "1"
        assert response.raw_hits[0]["_score"] == pytest.approx(5.0)
        assert response.raw_hits[0]["_source"]["opportunity_id"] == "abc"

    def test_raw_hits_include_explanation_when_present(self):
        explanation = {
            "value": 5.0,
            "description": "sum of:",
            "details": [
                {
                    "value": 5.0,
                    "description": "weight(agency_code^16:usaid in 0) [PerFieldSimilarity]",
                    "details": [],
                }
            ],
        }
        hit = _make_hit("1", {"opportunity_id": "abc"}, explanation=explanation)
        raw = _make_raw_response(hits=[hit])
        response = SearchResponse.from_opensearch_response(raw)

        assert response.raw_hits[0]["_explanation"] == explanation

    def test_raw_hits_empty_when_no_hits(self):
        raw = _make_raw_response(hits=[])
        response = SearchResponse.from_opensearch_response(raw)
        assert response.raw_hits == []

    def test_raw_hits_do_not_affect_records(self):
        """records should still contain only _source data with relevancy_score."""
        source = {"opportunity_id": "abc", "title": "Test"}
        hit = _make_hit("1", source, score=7.5)
        raw = _make_raw_response(hits=[hit])
        response = SearchResponse.from_opensearch_response(raw, include_scores=True)

        assert response.records == [
            {"opportunity_id": "abc", "title": "Test", "relevancy_score": 7.5}
        ]

    def test_multiple_raw_hits_order_preserved(self):
        hits = [
            _make_hit(str(i), {"opportunity_id": str(i)}, score=float(10 - i)) for i in range(5)
        ]
        raw = _make_raw_response(hits=hits)
        response = SearchResponse.from_opensearch_response(raw)

        assert len(response.raw_hits) == 5
        for i, raw_hit in enumerate(response.raw_hits):
            assert raw_hit["_id"] == str(i)
