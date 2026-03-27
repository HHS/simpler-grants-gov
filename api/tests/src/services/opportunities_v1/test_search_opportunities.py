"""
Unit tests for the explain/logging wiring in search_opportunities.
"""

from unittest.mock import MagicMock, patch

from src.adapters.search.opensearch_response import SearchResponse
from src.services.opportunities_v1.search_opportunities import search_opportunities


def _make_search_response(raw_hits: list | None = None) -> SearchResponse:
    return SearchResponse(
        total_records=len(raw_hits or []),
        records=[],
        aggregations={},
        scroll_id=None,
        took_ms=42,
        raw_hits=raw_hits or [],
    )


def _base_params(query: str | None = "climate") -> dict:
    return {
        "pagination": {"page_offset": 1, "page_size": 10},
        "query": query,
    }


class TestSearchOpportunitiesExplain:
    @patch("src.services.opportunities_v1.search_opportunities.log_search_result_explanations")
    @patch("src.services.opportunities_v1.search_opportunities.get_opensearch_config")
    def test_explain_passed_to_client_when_enabled(self, mock_config, mock_log):
        mock_config.return_value.opensearch_explain_enabled = True
        search_client = MagicMock()
        search_client.search.return_value = _make_search_response()

        search_opportunities(search_client, _base_params())

        _, kwargs = search_client.search.call_args
        assert kwargs.get("explain") is True

    @patch("src.services.opportunities_v1.search_opportunities.log_search_result_explanations")
    @patch("src.services.opportunities_v1.search_opportunities.get_opensearch_config")
    def test_explain_not_passed_when_disabled(self, mock_config, mock_log):
        mock_config.return_value.opensearch_explain_enabled = False
        search_client = MagicMock()
        search_client.search.return_value = _make_search_response()

        search_opportunities(search_client, _base_params())

        _, kwargs = search_client.search.call_args
        assert kwargs.get("explain") is False

    @patch("src.services.opportunities_v1.search_opportunities.log_search_result_explanations")
    @patch("src.services.opportunities_v1.search_opportunities.get_opensearch_config")
    def test_log_called_when_explain_enabled_and_query_set(self, mock_config, mock_log):
        mock_config.return_value.opensearch_explain_enabled = True
        raw_hits = [{"_score": 1.0, "_source": {"opportunity_id": "1"}}]
        search_client = MagicMock()
        search_client.search.return_value = _make_search_response(raw_hits=raw_hits)

        search_opportunities(search_client, _base_params(query="climate"))

        mock_log.assert_called_once_with(
            raw_hits=raw_hits,
            query="climate",
            scoring_rule="default",
        )

    @patch("src.services.opportunities_v1.search_opportunities.log_search_result_explanations")
    @patch("src.services.opportunities_v1.search_opportunities.get_opensearch_config")
    def test_log_not_called_when_query_is_none(self, mock_config, mock_log):
        mock_config.return_value.opensearch_explain_enabled = True
        search_client = MagicMock()
        search_client.search.return_value = _make_search_response()

        search_opportunities(search_client, _base_params(query=None))

        mock_log.assert_not_called()

    @patch("src.services.opportunities_v1.search_opportunities.log_search_result_explanations")
    @patch("src.services.opportunities_v1.search_opportunities.get_opensearch_config")
    def test_log_not_called_when_explain_disabled(self, mock_config, mock_log):
        mock_config.return_value.opensearch_explain_enabled = False
        search_client = MagicMock()
        search_client.search.return_value = _make_search_response()

        search_opportunities(search_client, _base_params(query="climate"))

        mock_log.assert_not_called()
