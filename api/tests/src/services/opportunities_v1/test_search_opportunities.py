"""
Unit tests for the relevance and data completeness metrics logging in search_opportunities.
"""

from unittest.mock import MagicMock, patch

from src.adapters.search.opensearch_response import SearchResponse
from src.services.opportunities_v1.search_opportunities import search_opportunities


def _make_search_response(
    max_score: float | None = None,
    total_relation: str | None = None,
    agency_sum_other_doc_count: int | None = None,
) -> SearchResponse:
    # We create a SearchResponse mimicking what's returned by opensearch client
    response = SearchResponse(
        total_records=0,
        records=[],
        aggregations={},
        scroll_id=None,
    )
    response.max_score = max_score
    response.total_relation = total_relation
    response.agency_sum_other_doc_count = agency_sum_other_doc_count
    return response


def _base_params(query: str | None = "climate") -> dict:
    return {
        "pagination": {"page_offset": 1, "page_size": 10},
        "query": query,
    }


class TestSearchOpportunitiesMetricsLogging:
    @patch("src.services.opportunities_v1.search_opportunities.newrelic.agent")
    @patch("src.services.opportunities_v1.search_opportunities.logger")
    def test_logs_metrics_when_present(self, mock_logger, mock_newrelic):
        search_client = MagicMock()
        search_client.search.return_value = _make_search_response(
            max_score=4.2,
            total_relation="eq",
            agency_sum_other_doc_count=5,
        )

        search_opportunities(search_client, _base_params())

        # Verify NewRelic attributes were explicitly added
        mock_newrelic.add_custom_attribute.assert_any_call("search.max_score", 4.2)
        mock_newrelic.add_custom_attribute.assert_any_call("search.total_relation", "eq")
        mock_newrelic.add_custom_attribute.assert_any_call("search.scoring_rule", "default")
        mock_newrelic.add_custom_attribute("search.agency_sum_other_doc_count", 5)

        # Verify logger.info included the expected extra dictionary attributes
        mock_logger.info.assert_called_with(
            "OpenSearch query completed",
            extra={
                "search.max_score": 4.2,
                "search.total_relation": "eq",
                "search.scoring_rule": "default",
                "search.agency_sum_other_doc_count": 5,
            },
        )

    @patch("src.services.opportunities_v1.search_opportunities.newrelic.agent")
    @patch("src.services.opportunities_v1.search_opportunities.logger")
    def test_logs_metrics_gracefully_when_missing(self, mock_logger, mock_newrelic):
        search_client = MagicMock()
        # Make a response where all metrics are missing/None
        search_client.search.return_value = _make_search_response(
            max_score=None,
            total_relation=None,
            agency_sum_other_doc_count=None,
        )

        search_opportunities(search_client, _base_params())

        # Scoring rule uses default so it will still be logged
        mock_newrelic.add_custom_attribute.assert_called_once_with(
            "search.scoring_rule", "default"
        )

        # Verify logger.info extra dictionary is appropriately reduced
        mock_logger.info.assert_called_with(
            "OpenSearch query completed",
            extra={
                "search.scoring_rule": "default",
            },
        )
