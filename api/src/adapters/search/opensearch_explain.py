"""
OpenSearch query explanation parsing and New Relic event logging.

When OPENSEARCH_EXPLAIN_ENABLED=true, search queries include explain=True which
causes OpenSearch to return per-field scoring details in each hit's _explanation
field. This module parses those explanations and logs them as SearchResultExplanation
custom events in New Relic for debugging search ranking issues.
"""

import logging
import re
import typing

import flask

from src.adapters.newrelic.events import record_custom_event

logger = logging.getLogger(__name__)

# Only log explanations for the top N results to limit event volume
EXPLAIN_TOP_N = 10


def parse_field_scores(explanation: dict[str, typing.Any]) -> dict[str, float]:
    """
    Parse an OpenSearch _explanation object and return a field_name -> score mapping.

    Traverses the explanation tree looking for "weight(...)" leaf nodes, which
    represent individual field contributions to the total score. For example:

        weight(agency_code^16:usaid in 0) [PerFieldSimilarity], result of:

    yields {"agency_code": 16.0}.

    Fields that appear multiple times (e.g. from multiple query clauses) have
    their scores summed.
    """
    scores: dict[str, float] = {}
    _collect_field_scores(explanation, scores)
    return scores


def _collect_field_scores(node: dict[str, typing.Any], scores: dict[str, float]) -> None:
    description: str = node.get("description", "")
    value: float = float(node.get("value", 0.0))

    # Match descriptions like: weight(FIELD_NAME^BOOST:term ...) or weight(FIELD_NAME:term ...)
    match = re.match(r"^weight\(([^:^]+?)(?:\^[\d.]+)?:", description)
    if match:
        field_name = match.group(1)
        scores[field_name] = scores.get(field_name, 0.0) + value
        # Don't recurse into weight sub-details; they are sub-computations, not additional fields
        return

    for detail in node.get("details", []):
        _collect_field_scores(detail, scores)


def log_search_result_explanations(
    raw_hits: list[dict[str, typing.Any]],
    query: str | None,
    scoring_rule: str,
) -> None:
    """
    Emit a SearchResultExplanation New Relic custom event for each of the top
    EXPLAIN_TOP_N hits. Each event includes:

      - correlation_id   – internal_request_id from the Flask request context
      - query            – the search query string
      - scoring_rule     – which scoring profile was active (default/expanded/agency)
      - opportunity_id   – the opportunity's UUID
      - opportunity_number – the opportunity number string
      - agency_code      – the agency code
      - position         – 1-based rank in the result set
      - total_score      – the overall _score from OpenSearch
      - field_score.*    – one attribute per scored field (e.g. field_score.agency_code)
    """
    correlation_id: str | None = None
    if flask.has_request_context():
        correlation_id = getattr(flask.g, "internal_request_id", None)

    for position, hit in enumerate(raw_hits[:EXPLAIN_TOP_N], start=1):
        source: dict[str, typing.Any] = hit.get("_source", {})
        opportunity_id = source.get("opportunity_id")
        total_score: float | None = hit.get("_score")
        explanation: dict[str, typing.Any] = hit.get("_explanation", {})

        params: dict[str, typing.Any] = {
            "correlation_id": correlation_id,
            "query": query,
            "scoring_rule": scoring_rule,
            "opportunity_id": str(opportunity_id) if opportunity_id is not None else None,
            "opportunity_number": source.get("opportunity_number"),
            "agency_code": source.get("agency_code"),
            "position": position,
            "total_score": total_score,
        }

        if explanation:
            field_scores = parse_field_scores(explanation)
            for field_name, score in field_scores.items():
                params[f"field_score.{field_name}"] = score

        record_custom_event("SearchResultExplanation", params)
