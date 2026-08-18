"""Unit tests for Metabase backup functionality."""

# pylint: disable=wrong-import-order,too-many-lines

import json
from pathlib import Path
from unittest.mock import MagicMock

import pytest
import requests
from analytics.integrations.metabase._shared import RESTORE_COLLECTION_DESCRIPTION
from analytics.integrations.metabase.backup_v2 import MetabaseBackupV2
from requests.exceptions import HTTPError, RequestException


@pytest.fixture(name="backup_instance")
def _backup_instance(tmp_path: Path) -> MetabaseBackupV2:
    """Create a MetabaseBackupV2 instance with a mocked requests client."""
    backup = MetabaseBackupV2(
        api_url="http://metabase.example.com/api",
        api_key="test-key",
        output_dir=str(tmp_path),
    )
    backup._requests = MagicMock()  # pylint: disable=protected-access
    return backup


def _response(payload: object) -> MagicMock:
    """Build a mock requests.Response with the given JSON payload."""
    mock_resp = MagicMock(spec=requests.Response)
    mock_resp.json.return_value = payload
    mock_resp.raise_for_status.return_value = None
    return mock_resp


def test_init(backup_instance: MetabaseBackupV2) -> None:
    """Test initialization of MetabaseBackupV2."""
    assert backup_instance.api_url == "http://metabase.example.com/api"
    assert backup_instance.api_key == "test-key"
    assert backup_instance.headers == {
        "x-api-key": "test-key",
        "Content-Type": "application/json",
    }
    assert backup_instance.stats["collections_processed"] == 0


def test_get_collections_filters_personal_sample_archived(
    backup_instance: MetabaseBackupV2,
) -> None:
    """Test that personal/sample/archived collections are excluded."""
    payload = [
        {"id": 1, "name": "Real", "location": "/"},
        {"id": 2, "name": "Personal", "location": "/", "is_personal": True},
        {"id": 3, "name": "Sample", "location": "/", "is_sample": True},
        {"id": 4, "name": "Archived", "location": "/", "archived": True},
        {"id": 5, "name": "Missing location fields"},
    ]
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    backup_instance._requests.get.return_value = _response(payload)

    result = backup_instance.get_collections()

    assert [c["id"] for c in result] == [1]


def test_get_collections_excludes_restore_collections(
    backup_instance: MetabaseBackupV2,
) -> None:
    """Test that restore collections are excluded entirely when a real collection exists."""
    payload = [
        {"id": 1, "name": "Real", "location": "/"},
        {"id": 2, "name": "Sprint_Metrics", "location": "/1/"},
        {
            "id": 10,
            "name": "Dashboard-Restore 2026-08-05_040849",
            "location": "/",
            "description": RESTORE_COLLECTION_DESCRIPTION,
        },
        {"id": 11, "name": "Sprint_Metrics", "location": "/10/"},
        {"id": 12, "name": "Dashboards", "location": "/10/"},
        {
            "id": 20,
            "name": "Dashboard-Restore 2026-08-05_043629",
            "location": "/",
            "description": RESTORE_COLLECTION_DESCRIPTION,
        },
        {"id": 21, "name": "Sprint_Metrics", "location": "/20/"},
    ]
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    backup_instance._requests.get.return_value = _response(payload)

    result = backup_instance.get_collections()

    assert [c["id"] for c in result] == [1, 2]


def test_get_collections_keeps_newest_restore_collection_when_no_real_collection(
    backup_instance: MetabaseBackupV2,
) -> None:
    """Test that the newest restore collection is kept when it's all that exists."""
    payload = [
        {
            "id": 10,
            "name": "Dashboard-Restore 2026-08-05_040849",
            "location": "/",
            "description": RESTORE_COLLECTION_DESCRIPTION,
        },
        {"id": 11, "name": "Sprint_Metrics", "location": "/10/"},
        {
            "id": 20,
            "name": "Dashboard-Restore 2026-08-05_043629",
            "location": "/",
            "description": RESTORE_COLLECTION_DESCRIPTION,
        },
        {"id": 21, "name": "Sprint_Metrics", "location": "/20/"},
    ]
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    backup_instance._requests.get.return_value = _response(payload)

    result = backup_instance.get_collections()

    assert [c["id"] for c in result] == [20, 21]


def test_get_collections_ignores_builtin_examples_when_choosing_newest_restore_collection(
    backup_instance: MetabaseBackupV2,
) -> None:
    """Test that Metabase's built-in sample 'Examples' collection doesn't count as a real one."""
    payload = [
        {"id": 2, "name": "Examples", "location": "/", "is_sample": True},
        {
            "id": 10,
            "name": "Dashboard-Restore 2026-08-05_040849",
            "location": "/",
            "description": RESTORE_COLLECTION_DESCRIPTION,
        },
        {"id": 11, "name": "Sprint_Metrics", "location": "/10/"},
        {
            "id": 20,
            "name": "Dashboard-Restore 2026-08-05_043629",
            "location": "/",
            "description": RESTORE_COLLECTION_DESCRIPTION,
        },
        {"id": 21, "name": "Sprint_Metrics", "location": "/20/"},
    ]
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    backup_instance._requests.get.return_value = _response(payload)

    result = backup_instance.get_collections()

    assert [c["id"] for c in result] == [20, 21]


def test_get_items_keeps_cards_and_dashboards(
    backup_instance: MetabaseBackupV2,
) -> None:
    """Test that get_items keeps card and dashboard models, drops everything else."""
    payload = {
        "data": [
            {"id": 1, "name": "A Card", "model": "card"},
            {"id": 2, "name": "A Dashboard", "model": "dashboard"},
            {"id": 3, "name": "A Collection", "model": "collection"},
            {"id": 4, "model": "card"},  # missing name
        ],
    }
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    backup_instance._requests.get.return_value = _response(payload)

    result = backup_instance.get_items(1)

    assert [i["id"] for i in result] == [1, 2]


def test_get_card_detail_success(backup_instance: MetabaseBackupV2) -> None:
    """Test fetching a card's full detail."""
    payload = {"id": 1, "name": "Some Card"}
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    backup_instance._requests.get.return_value = _response(payload)

    assert backup_instance.get_card_detail(1) == payload


def test_get_card_detail_permission_denied_returns_none(
    backup_instance: MetabaseBackupV2,
) -> None:
    """Test that a 403 response is treated as skip-this-card, not a hard failure."""
    error_response = MagicMock()
    error_response.status_code = 403
    http_error = HTTPError()
    http_error.response = error_response
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    backup_instance._requests.get.side_effect = http_error

    assert backup_instance.get_card_detail(1) is None


def test_get_card_detail_request_exception_returns_none(
    backup_instance: MetabaseBackupV2,
) -> None:
    """Test that a generic request failure is treated as skip-this-card."""
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    backup_instance._requests.get.side_effect = RequestException("boom")

    assert backup_instance.get_card_detail(1) is None


def test_extract_query_valid(backup_instance: MetabaseBackupV2) -> None:
    """Test extracting and formatting a valid query."""
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    query = backup_instance._extract_query("select * from table where id = 1", 1)

    assert query is not None
    assert "SELECT" in query


def test_extract_query_missing_keywords_returns_none(
    backup_instance: MetabaseBackupV2,
) -> None:
    """Test that a query missing select/from/where is rejected."""
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    assert backup_instance._extract_query("not a sql query", 1) is None


def test_extract_query_missing_returns_none(backup_instance: MetabaseBackupV2) -> None:
    """Test that a card with no query at all is rejected."""
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    assert backup_instance._extract_query(None, 1) is None


def test_native_query_and_tags_classic_shape(
    backup_instance: MetabaseBackupV2,
) -> None:
    """Test extraction from the classic flat dataset_query.native shape."""
    card = {
        "dataset_query": {
            "native": {
                "query": "select 1",
                "template-tags": {
                    "quarter": {"name": "quarter", "type": "dimension"},
                },
            },
        },
    }
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    query, tags = backup_instance._native_query_and_tags(card)

    assert query == "select 1"
    assert tags == {"quarter": {"name": "quarter", "type": "dimension"}}


def test_native_query_and_tags_pmbql_stages_shape(
    backup_instance: MetabaseBackupV2,
) -> None:
    """
    Test extraction from the newer pMBQL dataset_query.stages shape.

    Some Metabase versions return template-tags as a list of tag objects
    (each already carrying its own "name") instead of a dict keyed by tag
    name -- this is the shape actually returned by a real production
    instance running a newer Metabase version.
    """
    card = {
        "dataset_query": {
            "lib/type": "mbql/query",
            "stages": [
                {
                    "lib/type": "mbql.stage/native",
                    "native": "select 1 where {{quad}}",
                    "template-tags": [
                        {
                            "name": "quad",
                            "type": "dimension",
                            "widget-type": "string/=",
                        },
                    ],
                },
            ],
            "database": 2,
        },
    }
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    query, tags = backup_instance._native_query_and_tags(card)

    assert query == "select 1 where {{quad}}"
    assert tags == {
        "quad": {"name": "quad", "type": "dimension", "widget-type": "string/="},
    }


def test_native_query_and_tags_missing_stages_returns_none_query(
    backup_instance: MetabaseBackupV2,
) -> None:
    """Test that an empty/unrecognized dataset_query shape yields no query, not a crash."""
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    query, tags = backup_instance._native_query_and_tags({"dataset_query": {}})

    assert query is None
    assert tags == {}


def test_resolve_card_handles_pmbql_stages_shape(
    backup_instance: MetabaseBackupV2,
) -> None:
    """Test that _resolve_card succeeds end to end against the pMBQL shape."""
    card = {
        "id": 55,
        "name": "Deliverable Issues Done",
        "dataset_query": {
            "stages": [
                {
                    "native": "WITH x AS {{#143-ranked-statuses}} SELECT * FROM x "
                    "WHERE {{deliverable_title}}",
                    "template-tags": [
                        {
                            "name": "#143-ranked-statuses",
                            "type": "card",
                            "card-id": 143,
                        },
                        {"name": "deliverable_title", "type": "dimension"},
                    ],
                },
            ],
        },
        "display": "table",
        "visualization_settings": {},
        "parameters": [],
    }
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    resolved = backup_instance._resolve_card(card, {143: "Ranked_Statuses"})

    assert resolved is not None
    assert "#143-ranked-statuses" not in resolved["template_tags"]
    assert "deliverable_title" in resolved["template_tags"]
    assert resolved["dependencies"] == {"Ranked_Statuses"}


def test_resolve_card_skips_non_native_question_with_clear_message(
    backup_instance: MetabaseBackupV2,
    caplog: pytest.LogCaptureFixture,
) -> None:
    """Test that a GUI-built (MBQL) question is skipped with its own clear message."""
    card = {
        "id": 916,
        "name": "Cumulative Users over Time",
        "query_type": "query",
        "dataset_query": {
            "stages": [
                {"source-table": 67, "aggregation": [], "breakout": []},
            ],
        },
    }
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    with caplog.at_level("INFO"):
        resolved = backup_instance._resolve_card(card, {})

    assert resolved is None
    assert "not a native SQL question" in caplog.text
    assert "916" in caplog.text
    assert "No valid query found" not in caplog.text


def test_resolve_card_missing_query_type_still_falls_through(
    backup_instance: MetabaseBackupV2,
) -> None:
    """Test that a card with no query_type field at all still gets extracted normally."""
    card = {
        "id": 1,
        "name": "No Query Type Field",
        "dataset_query": {"stages": [{"native": "SELECT 1"}]},
        "display": "table",
        "visualization_settings": {},
        "parameters": [],
    }
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    resolved = backup_instance._resolve_card(card, {})

    assert resolved is not None
    assert resolved["query"] == "SELECT 1"


def test_rewrite_references_known_id_becomes_restore_placeholder(
    backup_instance: MetabaseBackupV2,
) -> None:
    """Test that a reference to a known id is rewritten to {{#restore:key}}."""
    query = "WITH ranked_statuses AS {{#143-ranked-statuses}} SELECT 1"
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    resolved = backup_instance._rewrite_references(query, {143: "Ranked_Statuses"})

    assert resolved == "WITH ranked_statuses AS {{#restore:Ranked_Statuses}} SELECT 1"


def test_rewrite_references_external_id_left_untouched(
    backup_instance: MetabaseBackupV2,
) -> None:
    """Test that a reference to an id outside this backup is left as-is."""
    query = "WITH x AS {{#999-some-external-question}} SELECT 1"
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    resolved = backup_instance._rewrite_references(query, {})

    assert resolved == query


def test_resolve_card_strips_card_type_template_tags(
    backup_instance: MetabaseBackupV2,
) -> None:
    """Test that "card"-type template tags are stripped, others kept."""
    card = {
        "id": 55,
        "name": "Deliverable Issues Done",
        "dataset_query": {
            "native": {
                "query": "WITH x AS {{#143-ranked-statuses}} SELECT * FROM x "
                "WHERE {{deliverable_title}}",
                "template-tags": {
                    "#143-ranked-statuses": {"type": "card", "card-id": 143},
                    "deliverable_title": {
                        "type": "dimension",
                        "name": "deliverable_title",
                    },
                },
            },
        },
        "display": "table",
        "visualization_settings": {},
        "parameters": [],
    }
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    resolved = backup_instance._resolve_card(card, {143: "Ranked_Statuses"})

    assert resolved is not None
    assert "#143-ranked-statuses" not in resolved["template_tags"]
    assert "deliverable_title" in resolved["template_tags"]
    assert resolved["key"] == "Deliverable_Issues_Done"
    assert resolved["dependencies"] == {"Ranked_Statuses"}


def test_resolve_card_normalizes_pmbql_dimension_field_shape(
    backup_instance: MetabaseBackupV2,
) -> None:
    """Test that a pMBQL-shaped dimension field ref is rewritten to the classic shape."""
    card = {
        "id": 56,
        "name": "Burndown by Issue",
        "dataset_query": {
            "native": {
                "query": "SELECT * FROM x WHERE {{quad}}",
                "template-tags": {
                    "quad": {
                        "type": "dimension",
                        "name": "quad",
                        "dimension": [
                            "field",
                            {
                                "lib/uuid": "b5b4cbe3-0b13-4d20-89a0-7cb6424c7afd",
                                "base-type": "type/Text",
                            },
                            310,
                        ],
                        "widget-type": "string/=",
                    },
                },
            },
        },
        "display": "table",
        "visualization_settings": {},
        "parameters": [],
    }
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    resolved = backup_instance._resolve_card(card, {})

    assert resolved is not None
    assert resolved["template_tags"]["quad"]["dimension"] == [
        "field",
        310,
        {"base-type": "type/Text"},
    ]


def test_normalize_dimension_tag_leaves_classic_shape_untouched(
    backup_instance: MetabaseBackupV2,
) -> None:
    """Test that an already-classic-shaped dimension tag passes through unchanged."""
    tag = {
        "type": "dimension",
        "name": "quad",
        "dimension": ["field", 310, None],
    }
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    normalized = backup_instance._normalize_dimension_tag(tag, database_id=None)

    assert normalized == tag


def test_normalize_dimension_tag_ignores_non_dimension_tags(
    backup_instance: MetabaseBackupV2,
) -> None:
    """Test that a non-dimension tag (e.g. a plain text variable) is left as-is."""
    tag = {"type": "text", "name": "deliverable_title"}
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    normalized = backup_instance._normalize_dimension_tag(tag, database_id=None)

    assert normalized == tag


def test_normalize_dimension_tag_attaches_field_ref_when_resolvable(
    backup_instance: MetabaseBackupV2,
) -> None:
    """Test that a resolvable field id gets a portable field_ref attached."""
    tag = {
        "type": "dimension",
        "name": "quad",
        "dimension": ["field", 310, None],
    }
    response = MagicMock()
    response.json.return_value = {
        "tables": [
            {
                "name": "gh_quad",
                "schema": "app",
                "fields": [{"id": 310, "name": "name"}],
            },
        ],
    }
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    backup_instance._requests.get.return_value = response

    normalized = backup_instance._normalize_dimension_tag(tag, database_id=2)

    assert normalized["field_ref"] == {
        "schema": "app",
        "table": "gh_quad",
        "column": "name",
    }
    backup_instance._requests.get.assert_called_once()


def test_normalize_dimension_tag_caches_metadata_across_calls(
    backup_instance: MetabaseBackupV2,
) -> None:
    """Test that the same database's metadata is only fetched once."""
    response = MagicMock()
    response.json.return_value = {
        "tables": [
            {
                "name": "gh_quad",
                "schema": "app",
                "fields": [{"id": 310, "name": "name"}],
            },
        ],
    }
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    backup_instance._requests.get.return_value = response

    tag = {"type": "dimension", "name": "quad", "dimension": ["field", 310, None]}
    backup_instance._normalize_dimension_tag(tag, database_id=2)
    backup_instance._normalize_dimension_tag(tag, database_id=2)

    backup_instance._requests.get.assert_called_once()


def test_normalize_dimension_tag_warns_when_field_unresolvable(
    backup_instance: MetabaseBackupV2,
    caplog: pytest.LogCaptureFixture,
) -> None:
    """Test that an id with no matching field logs a warning and skips field_ref."""
    tag = {"type": "dimension", "name": "quad", "dimension": ["field", 999, None]}
    response = MagicMock()
    response.json.return_value = {"tables": []}
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    backup_instance._requests.get.return_value = response

    normalized = backup_instance._normalize_dimension_tag(tag, database_id=2)

    assert "field_ref" not in normalized
    assert "Could not resolve field id 999" in caplog.text


def test_normalize_dimension_tag_degrades_gracefully_on_permission_denied(
    backup_instance: MetabaseBackupV2,
    caplog: pytest.LogCaptureFixture,
) -> None:
    """Test that a 403 fetching schema metadata skips field_ref, not the whole backup."""
    tag = {"type": "dimension", "name": "quad", "dimension": ["field", 310, None]}
    error_response = MagicMock()
    error_response.status_code = 403
    http_error = HTTPError()
    http_error.response = error_response
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    backup_instance._requests.get.side_effect = http_error

    normalized = backup_instance._normalize_dimension_tag(tag, database_id=2)

    assert normalized["dimension"] == ["field", 310, None]
    assert "field_ref" not in normalized
    assert "Permission denied (403)" in caplog.text


def test_field_refs_for_database_caches_permission_denied(
    backup_instance: MetabaseBackupV2,
) -> None:
    """Test that a 403 is only fetched once, not retried for every dimension tag."""
    error_response = MagicMock()
    error_response.status_code = 403
    http_error = HTTPError()
    http_error.response = error_response
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    backup_instance._requests.get.side_effect = http_error

    backup_instance._field_refs_for_database(2)
    backup_instance._field_refs_for_database(2)

    assert backup_instance._requests.get.call_count == 1


def test_check_collisions_none_when_unique(backup_instance: MetabaseBackupV2) -> None:
    """Test that unique card and collection names raise nothing."""
    cards = [{"id": 1, "name": "A"}, {"id": 2, "name": "B"}]
    collections = [{"id": 10, "name": "X"}, {"id": 11, "name": "Y"}]
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    backup_instance._check_collisions(cards, collections)  # should not raise


def test_check_collisions_reports_card_and_collection_collisions_together(
    backup_instance: MetabaseBackupV2,
) -> None:
    """Test that both card-name and collection-name collisions are reported together."""
    cards = [
        {"id": 1, "name": "Same Name"},
        {"id": 2, "name": "Same Name"},
    ]
    collections = [
        {"id": 10, "name": "Same Folder"},
        {"id": 11, "name": "Same Folder"},
    ]
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    with pytest.raises(RuntimeError) as exc_info:
        backup_instance._check_collisions(cards, collections)

    message = str(exc_info.value)
    assert "Same_Name" in message
    assert "[1, 2]" in message
    assert "Same_Folder" in message
    assert "[10, 11]" in message


def test_assign_levels_two_level_chain(backup_instance: MetabaseBackupV2) -> None:
    """Test that a question referencing a shared building block is level 1."""
    resolved_cards = {
        "Shared_Thing": {"dependencies": set()},
        "Consumer": {"dependencies": {"Shared_Thing"}},
    }
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    levels = backup_instance._assign_levels(resolved_cards)

    assert levels["Shared_Thing"] == 0
    assert levels["Consumer"] == 1


def test_assign_levels_three_level_chain(backup_instance: MetabaseBackupV2) -> None:
    """Test that level assignment isn't hardcoded to two levels."""
    resolved_cards = {
        "A": {"dependencies": set()},
        "B": {"dependencies": {"A"}},
        "C": {"dependencies": {"B"}},
    }
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    levels = backup_instance._assign_levels(resolved_cards)

    assert levels == {"A": 0, "B": 1, "C": 2}


def test_assign_levels_ignores_external_dependency(
    backup_instance: MetabaseBackupV2,
) -> None:
    """Test that a dependency on a question outside this set doesn't affect level."""
    resolved_cards = {
        "Consumer": {"dependencies": {"Not_In_This_Backup"}},
    }
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    levels = backup_instance._assign_levels(resolved_cards)

    assert levels["Consumer"] == 0


def test_assign_levels_detects_cycle(backup_instance: MetabaseBackupV2) -> None:
    """Test that a circular reference raises a clear error instead of hanging."""
    resolved_cards = {
        "A": {"dependencies": {"B"}},
        "B": {"dependencies": {"A"}},
    }
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    with pytest.raises(RuntimeError, match="Circular reference"):
        backup_instance._assign_levels(resolved_cards)


def test_assign_levels_standalone_card_gets_deepest_level(
    backup_instance: MetabaseBackupV2,
) -> None:
    """
    Test that a standalone card lands at the deepest level, not level 0.

    A card with no dependencies and no dependents must land at the same
    deepest level as the chain's shallowest node, not get pulled down to
    level 0 just because it happens to have no dependencies of its own.
    """
    resolved_cards = {
        "Shared_Thing": {"dependencies": set()},
        "Consumer": {"dependencies": {"Shared_Thing"}},
        "Standalone": {"dependencies": set()},
    }
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    levels = backup_instance._assign_levels(resolved_cards)

    assert levels["Shared_Thing"] == 0
    assert levels["Consumer"] == 1
    assert levels["Standalone"] == 1


def test_assign_levels_all_standalone_lands_at_level_zero(
    backup_instance: MetabaseBackupV2,
) -> None:
    """When nothing references anything, everything settles at a single level 0."""
    resolved_cards = {
        "A": {"dependencies": set()},
        "B": {"dependencies": set()},
    }
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    levels = backup_instance._assign_levels(resolved_cards)

    assert levels == {"A": 0, "B": 0}


def test_assign_levels_empty_dict(backup_instance: MetabaseBackupV2) -> None:
    """Test that an empty input returns an empty level map without error."""
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    assert backup_instance._assign_levels({}) == {}


def test_write_question_creates_sql_and_sidecar(
    backup_instance: MetabaseBackupV2,
    tmp_path: Path,
) -> None:
    """Test that a resolved card is written as .sql + sidecar .json."""
    card = {
        "key": "My_Question",
        "id": 1,
        "name": "My Question",
        "query": "SELECT 1",
        "display": "line",
        "visualization_settings": {"foo": "bar"},
        "description": "A description",
        "template_tags": {},
        "parameters": [],
    }
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    backup_instance._write_question(card, level=1, folder="Some_Collection")

    sql_path = tmp_path / "level_1" / "Some_Collection" / "My_Question.sql"
    json_path = tmp_path / "level_1" / "Some_Collection" / "My_Question.json"
    assert sql_path.read_text() == "SELECT 1\n"
    metadata = json.loads(json_path.read_text())
    assert metadata == {
        "name": "My Question",
        "display": "line",
        "visualization_settings": {"foo": "bar"},
        "description": "A description",
    }


def test_resolve_dashboard_translates_tabs_and_dashcards(
    backup_instance: MetabaseBackupV2,
) -> None:
    """Test translating a live dashboard's tabs/dashcards/parameters to restore schema."""
    dashboard = {
        "name": "Delivery Metrics",
        "description": None,
        "width": "fixed",
        "auto_apply_filters": True,
        "tabs": [
            {"id": 5, "name": "Tab Two", "position": 1},
            {"id": 4, "name": "Tab One", "position": 0},
        ],
        "parameters": [
            {
                "id": "abc123",
                "slug": "deliverable",
                "name": "Deliverable",
                "type": "string/=",
                "sectionId": "string",
                "isMultiSelect": False,
                "required": True,
                "default": ["Some Deliverable"],
                "values_source_type": "card",
                "values_source_config": {
                    "card_id": 49,
                    "value_field": ["field", "title", {"base-type": "type/Text"}],
                },
            },
        ],
        "dashcards": [
            {
                "id": 1,
                "dashboard_tab_id": 4,
                "card_id": 100,
                "col": 0,
                "row": 0,
                "size_x": 12,
                "size_y": 4,
                "visualization_settings": {"card.title": "Hello"},
                "parameter_mappings": [
                    {
                        "parameter_id": "abc123",
                        "card_id": 100,
                        "target": ["dimension", ["template-tag", "deliverable_title"]],
                    },
                ],
            },
            {
                "id": 2,
                "dashboard_tab_id": 5,
                "card_id": None,
                "col": 0,
                "row": 0,
                "size_x": 24,
                "size_y": 1,
                "visualization_settings": {
                    "text": "# {{deliverable_title}}",
                    "virtual_card": {"display": "text"},
                },
                "parameter_mappings": [
                    {
                        "parameter_id": "abc123",
                        "target": ["text-tag", "deliverable_title"],
                    },
                ],
            },
        ],
    }
    id_to_key = {100: "Some_Question", 49: "All_Deliverables_Titles"}

    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    spec = backup_instance._resolve_dashboard(dashboard, id_to_key)

    assert spec["tabs"] == ["Tab One", "Tab Two"]
    assert (
        spec["parameters"][0]["values_source_config"]["card"]
        == "All_Deliverables_Titles"
    )

    card_dashcard = spec["dashcards"][0]
    assert card_dashcard["tab"] == "Tab One"
    assert card_dashcard["card"] == "Some_Question"
    assert card_dashcard["parameter_mappings"] == [
        {"parameter": "abc123", "target_tag": "deliverable_title"},
    ]

    text_dashcard = spec["dashcards"][1]
    assert text_dashcard["tab"] == "Tab Two"
    assert "card" not in text_dashcard
    assert text_dashcard["text"] == "# {{deliverable_title}}"
    assert "visualization_settings" not in text_dashcard
    assert text_dashcard["parameter_mappings"] == [
        {"parameter": "abc123", "target_tag": "deliverable_title"},
    ]


def test_resolve_dashcard_unresolved_external_card_raises(
    backup_instance: MetabaseBackupV2,
) -> None:
    """Test that a dashcard referencing a card outside this backup fails fast."""
    dashcard = {
        "dashboard_tab_id": 1,
        "card_id": 999,
        "col": 0,
        "row": 0,
        "size_x": 1,
        "size_y": 1,
    }
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    with pytest.raises(RuntimeError, match="999"):
        backup_instance._resolve_dashcard(dashcard, {}, {}, "Some Dashboard")


def test_write_dashboard_skips_unresolvable_reference_without_raising(
    backup_instance: MetabaseBackupV2,
    caplog: pytest.LogCaptureFixture,
) -> None:
    """
    Test that a dashboard referencing an uncapturable card is skipped, not fatal.

    This is the real-world case of a dashboard mixing native SQL questions
    with a GUI-built (non-native) one: the non-native card was never
    written during _write_all_questions, so its id isn't in id_to_key here
    -- that one dashboard should be skipped with a clear log message, not
    crash the rest of the backup run.
    """
    dashboard_detail = {
        "id": 300,
        "name": "Mixed Dashboard",
        "tabs": [],
        "parameters": [],
        "dashcards": [
            {
                "id": 1,
                "dashboard_tab_id": None,
                "card_id": 916,
                "col": 0,
                "row": 0,
                "size_x": 6,
                "size_y": 3,
            },
        ],
    }
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    backup_instance._requests.get.return_value = _response(dashboard_detail)

    with caplog.at_level("WARNING"):
        written = backup_instance._write_dashboard(300, {}, "Dashboards")

    assert written is False
    assert "Mixed Dashboard" in caplog.text
    assert "card id 916" in caplog.text
    assert "Traceback" not in caplog.text


def test_backup_written_id_to_key_excludes_skipped_cards(
    backup_instance: MetabaseBackupV2,
    tmp_path: Path,
) -> None:
    """
    Test the full backup() flow when a dashboard mixes a captured and a skipped card.

    The dashboard must be skipped (not written with a dangling reference),
    while the native question and the rest of the run still succeed.
    """
    collections_payload = [
        {"id": 11, "name": "Deliverable Data", "location": "/"},
        {"id": 12, "name": "Dashboards", "location": "/"},
    ]
    items_by_collection = {
        11: {
            "data": [
                {"id": 101, "name": "My Question", "model": "card"},
                {"id": 916, "name": "Non-native", "model": "card"},
            ],
        },
        12: {"data": [{"id": 200, "name": "Mixed Dashboard", "model": "dashboard"}]},
    }
    card_details = {
        101: {
            "id": 101,
            "name": "My Question",
            "query_type": "native",
            "dataset_query": {"native": {"query": "SELECT 1"}},
            "display": "table",
            "visualization_settings": {},
        },
        916: {"id": 916, "name": "Non-native", "query_type": "query"},
    }
    dashboard_detail = {
        "id": 200,
        "name": "Mixed Dashboard",
        "tabs": [],
        "parameters": [],
        "dashcards": [
            {
                "id": 1,
                "dashboard_tab_id": None,
                "card_id": 101,
                "col": 0,
                "row": 0,
                "size_x": 12,
                "size_y": 4,
            },
            {
                "id": 2,
                "dashboard_tab_id": None,
                "card_id": 916,
                "col": 0,
                "row": 4,
                "size_x": 12,
                "size_y": 4,
            },
        ],
    }

    def fake_get(url: str, **_kwargs: object) -> MagicMock:
        if url.endswith("/collection/?exclude-other-user-collections=true"):
            return _response(collections_payload)
        for collection_id, payload in items_by_collection.items():
            if url.endswith(f"/collection/{collection_id}/items"):
                return _response(payload)
        for card_id, detail in card_details.items():
            if url.endswith(f"/card/{card_id}"):
                return _response(detail)
        if url.endswith("/dashboard/200"):
            return _response(dashboard_detail)
        message = f"Unexpected URL: {url}"
        raise AssertionError(message)

    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    backup_instance._requests.get.side_effect = fake_get

    backup_instance.backup()

    assert (tmp_path / "level_0" / "Deliverable_Data" / "My_Question.sql").exists()
    assert not (
        tmp_path / "dashboards" / "Dashboards" / "Mixed_Dashboard.json"
    ).exists()
    assert backup_instance.stats["questions_processed"] == 1
    assert backup_instance.stats["dashboards_processed"] == 0
    assert backup_instance.stats["dashboards_skipped"] == 1


def test_resolve_dashboard_parameter_unresolved_external_card_raises(
    backup_instance: MetabaseBackupV2,
) -> None:
    """Test that a filter sourced from a card outside this backup fails fast."""
    param = {
        "id": "abc",
        "slug": "x",
        "name": "X",
        "type": "string/=",
        "values_source_type": "card",
        "values_source_config": {"card_id": 999, "value_field": []},
    }
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    with pytest.raises(RuntimeError, match="999"):
        backup_instance._resolve_dashboard_parameter(param, {})


def test_resolve_parameter_mapping_dimension(backup_instance: MetabaseBackupV2) -> None:
    """Test translating a dimension-target parameter_mapping."""
    mapping = {
        "parameter_id": "abc",
        "card_id": 1,
        "target": ["dimension", ["template-tag", "deliverable_title"]],
    }
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    assert backup_instance._resolve_parameter_mapping(mapping) == {
        "parameter": "abc",
        "target_tag": "deliverable_title",
    }


def test_resolve_parameter_mapping_text_tag(backup_instance: MetabaseBackupV2) -> None:
    """Test translating a text-tag-target parameter_mapping (virtual dashcard)."""
    mapping = {"parameter_id": "abc", "target": ["text-tag", "deliverable_title"]}
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    assert backup_instance._resolve_parameter_mapping(mapping) == {
        "parameter": "abc",
        "target_tag": "deliverable_title",
    }


def test_resolve_parameter_mapping_unexpected_shape_raises(
    backup_instance: MetabaseBackupV2,
) -> None:
    """Test that an unrecognized target shape fails fast instead of guessing."""
    mapping = {"parameter_id": "abc", "target": ["something-else", "x"]}
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    with pytest.raises(RuntimeError, match="Unexpected"):
        backup_instance._resolve_parameter_mapping(mapping)


def test_snapshot_and_wipe_output_tree(
    backup_instance: MetabaseBackupV2,
    tmp_path: Path,
) -> None:
    """Test that snapshotting hashes files and wiping removes level_*/dashboards only."""
    (tmp_path / "level_0" / "Coll").mkdir(parents=True)
    (tmp_path / "level_0" / "Coll" / "Q.sql").write_text("SELECT 1")
    (tmp_path / "dashboards" / "Coll").mkdir(parents=True)
    (tmp_path / "dashboards" / "Coll" / "D.json").write_text("{}")
    (tmp_path / "CHANGELOG.txt").write_text("keep me")

    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    snapshot = backup_instance._snapshot_output_tree()
    assert "level_0/Coll/Q.sql" in snapshot
    assert "dashboards/Coll/D.json" in snapshot

    backup_instance._wipe_output_tree()

    assert not (tmp_path / "level_0").exists()
    assert not (tmp_path / "dashboards").exists()
    assert (tmp_path / "CHANGELOG.txt").exists()


def test_record_changes_added_removed_modified(
    backup_instance: MetabaseBackupV2,
) -> None:
    """Test diffing two snapshots into added/removed/modified counts."""
    before = {"a.sql": "hash1", "b.sql": "hash2"}
    after = {"a.sql": "hash1", "b.sql": "hash-changed", "c.sql": "hash3"}

    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    backup_instance._record_changes(before, after)

    assert backup_instance.stats["files_added"] == 1
    assert backup_instance.stats["files_removed"] == 0
    assert backup_instance.stats["files_modified"] == 1


def test_write_changelog(backup_instance: MetabaseBackupV2, tmp_path: Path) -> None:
    """Test that a changelog entry is written and prepended on subsequent runs."""
    backup_instance.stats.update(
        {
            "collections_processed": 2,
            "questions_processed": 5,
            "questions_skipped": 1,
            "dashboards_processed": 1,
            "dashboards_skipped": 0,
            "files_added": 3,
            "files_modified": 1,
            "files_removed": 0,
        },
    )

    backup_instance.write_changelog()

    content = (tmp_path / "CHANGELOG.txt").read_text()
    assert "Backup completed at" in content
    assert "Collections processed: 2" in content
    assert "Questions processed: 5" in content
    assert "Files added: 3" in content

    backup_instance.write_changelog()
    content = (tmp_path / "CHANGELOG.txt").read_text()
    assert content.count("Backup completed at") == 2
    assert content.startswith("\n=== Backup completed at")


def test_backup_integration(backup_instance: MetabaseBackupV2, tmp_path: Path) -> None:
    """Test the full backup() flow: two questions (one dependent) + one dashboard."""
    collections_payload = [
        {"id": 10, "name": "Shared", "location": "/"},
        {"id": 11, "name": "Deliverable Data", "location": "/"},
        {"id": 12, "name": "Dashboards", "location": "/"},
    ]
    items_by_collection = {
        10: {"data": [{"id": 100, "name": "Ranked Statuses", "model": "card"}]},
        11: {"data": [{"id": 101, "name": "My Question", "model": "card"}]},
        12: {"data": [{"id": 200, "name": "My Dashboard", "model": "dashboard"}]},
    }
    card_details = {
        100: {
            "id": 100,
            "name": "Ranked Statuses",
            "dataset_query": {"native": {"query": "SELECT 'Backlog' AS status"}},
            "display": "table",
            "visualization_settings": {},
        },
        101: {
            "id": 101,
            "name": "My Question",
            "dataset_query": {
                "native": {
                    "query": "WITH x AS {{#100-ranked-statuses}} SELECT * FROM x",
                },
            },
            "display": "table",
            "visualization_settings": {},
        },
    }
    dashboard_detail = {
        "id": 200,
        "name": "My Dashboard",
        "tabs": [{"id": 1, "name": "Only Tab", "position": 0}],
        "parameters": [],
        "dashcards": [
            {
                "id": 1,
                "dashboard_tab_id": 1,
                "card_id": 101,
                "col": 0,
                "row": 0,
                "size_x": 12,
                "size_y": 4,
            },
        ],
    }

    def fake_get(url: str, **_kwargs: object) -> MagicMock:
        if url.endswith("/collection/?exclude-other-user-collections=true"):
            return _response(collections_payload)
        for collection_id, payload in items_by_collection.items():
            if url.endswith(f"/collection/{collection_id}/items"):
                return _response(payload)
        for card_id, detail in card_details.items():
            if url.endswith(f"/card/{card_id}"):
                return _response(detail)
        if url.endswith("/dashboard/200"):
            return _response(dashboard_detail)
        message = f"Unexpected URL: {url}"
        raise AssertionError(message)

    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    backup_instance._requests.get.side_effect = fake_get

    backup_instance.backup()

    assert (tmp_path / "level_0" / "Shared" / "Ranked_Statuses.sql").exists()
    assert (tmp_path / "level_1" / "Deliverable_Data" / "My_Question.sql").exists()
    consumer_sql = (
        tmp_path / "level_1" / "Deliverable_Data" / "My_Question.sql"
    ).read_text()
    assert "{{#restore:Ranked_Statuses}}" in consumer_sql

    dashboard_path = tmp_path / "dashboards" / "Dashboards" / "My_Dashboard.json"
    assert dashboard_path.exists()
    dashboard_spec = json.loads(dashboard_path.read_text())
    assert dashboard_spec["dashcards"][0]["card"] == "My_Question"

    assert (tmp_path / "CHANGELOG.txt").exists()
    changelog = (tmp_path / "CHANGELOG.txt").read_text()
    assert "Questions processed: 2" in changelog
    assert "Dashboards processed: 1" in changelog
