import dataclasses
import typing


@dataclasses.dataclass
class SearchResponse:
    total_records: int

    records: list[dict[str, typing.Any]]

    aggregations: dict[str, dict[str, int]]

    scroll_id: str | None

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

        hits = raw_json.get("hits", {})
        hits_total = hits.get("total", {})
        total_records = hits_total.get("value", 0)

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

        return cls(total_records, records, aggregations, scroll_id)


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
