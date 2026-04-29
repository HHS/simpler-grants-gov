"""
Unit tests for scoring rule logging and explain wiring in search_opportunities.
"""

from unittest.mock import MagicMock, patch

from src.adapters.search.opensearch_response import SearchResponse
from src.services.opportunities_v1.search_opportunities import (
    CSV_SOURCE_INCLUDES,
    search_opportunities,
    search_opportunities_csv,
)


def _make_search_response(raw_hits: list | None = None) -> SearchResponse:
    return SearchResponse(
        total_records=len(raw_hits or []),
        records=[],
        aggregations={},
        scroll_id=None,
        raw_hits=raw_hits or [],
    )


def _base_params(query: str | None = "climate") -> dict:
    return {
        "pagination": {"page_offset": 1, "page_size": 10},
        "query": query,
    }


class TestSearchOpportunitiesScoringRuleLogging:
    @patch("src.services.opportunities_v1.search_opportunities.log_search_result_explanations")
    @patch("src.services.opportunities_v1.search_opportunities.get_opensearch_config")
    @patch(
        "src.services.opportunities_v1.search_opportunities.add_extra_data_to_current_request_logs"
    )
    def test_logs_scoring_rule(self, mock_add_extra_data, mock_config, mock_log):
        mock_config.return_value.opensearch_explain_enabled = False
        search_client = MagicMock()
        search_client.search.return_value = _make_search_response()

        search_opportunities(search_client, _base_params())

        mock_add_extra_data.assert_called_once_with({"search.scoring_rule": "default"})


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


class TestSearchOpportunitiesCsv:
    def test_csv_search_uses_optimized_query(self):
        search_client = MagicMock()
        search_client.search.return_value = _make_search_response()

        search_opportunities_csv(search_client, {"query": "climate"})

        args, kwargs = search_client.search.call_args
        search_request = args[1]

        assert search_request["size"] == 5000
        assert search_request["from"] == 0
        assert search_request["track_total_hits"] is False
        assert search_request["track_scores"] is False
        assert "aggs" not in search_request
        assert kwargs["include_scores"] is False
        assert kwargs["includes"] == CSV_SOURCE_INCLUDES
        assert kwargs["excludes"] == ["attachments"]
        assert kwargs["explain"] is False

    def test_csv_export_search_ignores_client_pagination(self):
        search_client = MagicMock()
        search_client.search.return_value = _make_search_response()

        search_opportunities_csv(
            search_client,
            {
                "query": "climate",
                "pagination": {
                    "page_offset": 100,
                    "page_size": 5,
                    "sort_order": [{"order_by": "opportunity_id", "sort_direction": "ascending"}],
                },
            },
            apply_export_pagination=True,
        )

        args, _ = search_client.search.call_args
        search_request = args[1]

        assert search_request["size"] == 5000
        assert search_request["from"] == 0
        assert search_request["sort"] == [{"summary.post_date": {"order": "desc"}}]

    def test_csv_search_respects_client_pagination_when_export_disabled(self):
        search_client = MagicMock()
        search_client.search.return_value = _make_search_response()

        search_opportunities_csv(
            search_client,
            {
                "query": "climate",
                "pagination": {
                    "page_offset": 3,
                    "page_size": 7,
                    "sort_order": [{"order_by": "opportunity_id", "sort_direction": "ascending"}],
                },
            },
            apply_export_pagination=False,
        )

        args, _ = search_client.search.call_args
        search_request = args[1]

        assert search_request["size"] == 7
        assert search_request["from"] == 14
        assert search_request["sort"] == [{"opportunity_id.keyword": {"order": "asc"}}]
