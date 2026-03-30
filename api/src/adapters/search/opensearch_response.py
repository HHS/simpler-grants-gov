import dataclasses
import statistics
import typing


@dataclasses.dataclass
class SearchResponse:
    total_records: int

    records: list[dict[str, typing.Any]]

    aggregations: dict[str, dict[str, int]]

    scroll_id: str | None

    took_ms: int | None = None
    timed_out: bool | None = None
    shards_failed: int | None = None
    score_stats: dict[str, float | None] = dataclasses.field(default_factory=dict)

    # Top-level score of the best matching result; None when no query is run (browse mode).
    max_score: float | None = None

    # "eq" when the total hit count is exact, "gte" when it is a lower bound.
    # See: https://opensearch.org/docs/latest/api-reference/search/#the-hits-object
    total_relation: str | None = None

    # Per-aggregation sum_other_doc_count values. Non-zero means the aggregation
    # is silently truncating buckets due to the size cap.
    # e.g. {"agency": 12, "applicant_type": 0}
    agg_overflow: dict[str, int] = dataclasses.field(default_factory=dict)

    @classmethod
    def from_opensearch_response(
        cls, raw_json: dict[str, typing.Any], include_scores: bool = True
    ) -> typing.Self:
        """
        Convert a raw search response into something a bit more manageable
        by un-nesting and restructuring a few of they key fields.
        """

        """
        The hits object looks like:
        {
            "total": {
              "value": 3,
              "relation": "eq"
            },
            "max_score": 22.180708,
            "hits": [
                {
                    "_index": "opportunity-index-2024-05-21_15-49-24",
                    "_id": "4",
                    "_score": 22.180708,
                    "_source": {
                        "opportunity_id": 4,
                        "opportunity_number": "ABC123-XYZ",
                    }
                }
            ]
        }
        """
        scroll_id = raw_json.get("_scroll_id", None)
        took = raw_json.get("took")
        timed_out = raw_json.get("timed_out")
        shards_failed = raw_json.get("_shards", {}).get("failed")

        hits = raw_json.get("hits", {})
        hits_total = hits.get("total", {})
        total_records = hits_total.get("value", 0)
        total_relation: str | None = hits_total.get("relation", None)
        max_score: float | None = hits.get("max_score", None)

        raw_records: list[dict[str, typing.Any]] = hits.get("hits", [])

        records = []
        for raw_record in raw_records:
            record = raw_record.get("_source", {})

            if include_scores:
                score: int | None = raw_record.get("_score", None)
                record["relevancy_score"] = score

            records.append(record)

        raw_aggs: dict[str, dict[str, typing.Any]] = raw_json.get("aggregations", {})
        aggregations = _parse_aggregations(raw_aggs)
        score_stats = _compute_score_stats(records) if include_scores else {}
        agg_overflow = _extract_agg_overflow(raw_aggs)

        return cls(
            total_records=total_records,
            records=records,
            aggregations=aggregations,
            scroll_id=scroll_id,
            took_ms=took,
            timed_out=timed_out,
            shards_failed=shards_failed,
            score_stats=score_stats,
            max_score=max_score,
            total_relation=total_relation,
            agg_overflow=agg_overflow,
        )


def _parse_aggregations(
    raw_aggs: dict[str, dict[str, typing.Any]] | None
) -> dict[str, dict[str, int]]:
    # Note that this is assuming the response from a terms aggregation
    # https://opensearch.org/docs/latest/aggregations/bucket/terms/
    if raw_aggs is None:
        return {}

    """
    Terms aggregations look like:

    "aggregations": {
        "applicant_types": {
          "doc_count_error_upper_bound": 0,
          "sum_other_doc_count": 0,
          "buckets": [
            {
              "key": "for_profit_organizations_other_than_small_businesses",
              "doc_count": 1
            },
            {
              "key": "other",
              "doc_count": 1
            },
            {
              "key": "state_governments",
              "doc_count": 1
            }
          ]
        },
        "agencies": {
          "doc_count_error_upper_bound": 0,
          "sum_other_doc_count": 0,
          "buckets": [
            {
              "key": "USAID",
              "doc_count": 3
            }
          ]
        },
        "close_date": {
            {'buckets': [{'key': '7', 'from': 1753119560446.0, 'from_as_string': '2025-07-21', 'to': 1753660800000.0, 'to_as_string': '2025-07-28', 'doc_count': 0}
        }
    }
    """

    aggregations: dict[str, dict[str, int]] = {}
    for field, raw_agg_value in raw_aggs.items():
        buckets: list[dict[str, typing.Any]] = raw_agg_value.get("buckets", [])
        field_aggregation: dict[str, int] = {}
        for bucket in buckets:
            key = bucket.get("key")
            count = bucket.get("doc_count", 0)

            if key is None:
                raise ValueError("Unable to parse aggregation, null key for %s" % field)

            field_aggregation[key] = count

        aggregations[field] = field_aggregation

    return aggregations


def _extract_agg_overflow(
    raw_aggs: dict[str, dict[str, typing.Any]] | None,
) -> dict[str, int]:
    """Extract sum_other_doc_count from each aggregation that has it."""
    if not raw_aggs:
        return {}

    overflow: dict[str, int] = {}
    for field, agg_value in raw_aggs.items():
        count = agg_value.get("sum_other_doc_count")
        if count is not None:
            overflow[field] = count
    return overflow


def _compute_score_stats(records: list[dict]) -> dict:

    scores: list[float] = [
        r["relevancy_score"] for r in records if isinstance(r.get("relevancy_score"), (int, float))
    ]
    if scores:
        return {
            "search.score_min": min(scores),
            "search.score_max": max(scores),
            "search.score_mean": statistics.mean(scores),
            "search.score_stdev": statistics.pstdev(scores) if len(scores) > 1 else 0.0,
        }
    # No valid scores
    return {
        "search.score_min": None,
        "search.score_max": None,
        "search.score_mean": None,
        "search.score_stdev": None,
    }
