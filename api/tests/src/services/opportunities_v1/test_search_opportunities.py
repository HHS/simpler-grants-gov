"""
Unit tests for scoring rule logging in search_opportunities.
"""

from unittest.mock import MagicMock, patch

from src.adapters.search.opensearch_response import SearchResponse
from src.services.opportunities_v1.search_opportunities import search_opportunities


class TestSearchOpportunitiesScoringRuleLogging:
    @patch(
        "src.services.opportunities_v1.search_opportunities.add_extra_data_to_current_request_logs"
    )
    def test_logs_scoring_rule(self, mock_add_extra_data):
        search_client = MagicMock()
        search_client.search.return_value = SearchResponse(
            total_records=0, records=[], aggregations={}, scroll_id=None
        )

        search_opportunities(
            search_client,
            {"pagination": {"page_offset": 1, "page_size": 10}, "query": "climate"},
        )

        mock_add_extra_data.assert_called_once_with({"search.scoring_rule": "default"})
