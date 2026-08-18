"""Unit tests for Metabase restore functionality."""

# pylint: disable=wrong-import-order

import itertools
import json
from pathlib import Path
from unittest.mock import MagicMock

import pytest
from analytics.integrations.metabase.restore import (
    MetabaseRestore,
    _level_sort_key,
)
from requests.exceptions import HTTPError, RequestException


@pytest.fixture(name="restore_instance")
def _restore_instance(tmp_path: Path) -> MetabaseRestore:
    """Create a MetabaseRestore instance with a mocked requests client."""
    restorer = MetabaseRestore(
        api_url="http://metabase.example.com/api",
        api_key="test-key",
        restore_dir=str(tmp_path),
        collection_name="Import",
    )
    mock_requests = MagicMock()
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    restorer._requests = mock_requests
    restorer._database_id = 99
    return restorer


def _write_question(
    collection_dir: Path,
    stem: str,
    query: str,
    metadata: dict | None = None,
) -> None:
    """Write a `.sql` (and optional sidecar `.json`) file under a collection dir."""
    collection_dir.mkdir(parents=True, exist_ok=True)
    (collection_dir / f"{stem}.sql").write_text(query)
    if metadata is not None:
        (collection_dir / f"{stem}.json").write_text(json.dumps(metadata))


def test_init(restore_instance: MetabaseRestore) -> None:
    """Test initialization of MetabaseRestore."""
    assert restore_instance.api_url == "http://metabase.example.com/api"
    assert restore_instance.api_key == "test-key"
    assert restore_instance.collection_name == "Import"
    assert restore_instance.headers == {
        "x-api-key": "test-key",
        "Content-Type": "application/json",
    }


def test_resolve_database_id(
    restore_instance: MetabaseRestore,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Test resolving a database id by name from the env-configured DB_NAME."""
    monkeypatch.setenv("DB_NAME", "target_db")
    response = MagicMock()
    response.json.return_value = {
        "data": [
            {"id": 1, "name": "sample"},
            {"id": 2, "name": "target_db"},
        ],
    }
    response.raise_for_status.return_value = None
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    restore_instance._requests.get.return_value = response

    assert restore_instance._resolve_database_id() == 2


def test_resolve_database_id_not_found(
    restore_instance: MetabaseRestore,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Test that an unmatched DB_NAME raises a clear error."""
    monkeypatch.setenv("DB_NAME", "does_not_exist")
    response = MagicMock()
    response.json.return_value = {"data": [{"id": 1, "name": "sample"}]}
    response.raise_for_status.return_value = None
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    restore_instance._requests.get.return_value = response

    with pytest.raises(RuntimeError, match="does_not_exist"):
        restore_instance._resolve_database_id()


def test_create_parent_collection(restore_instance: MetabaseRestore) -> None:
    """Test creating the top-level, timestamped collection."""
    response = MagicMock()
    response.json.return_value = {"id": 42}
    response.raise_for_status.return_value = None
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    restore_instance._requests.post.return_value = response

    collection_id = restore_instance._create_parent_collection()

    assert collection_id == 42
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    _, kwargs = restore_instance._requests.post.call_args
    assert kwargs["json"]["name"].startswith("Import ")


def test_get_or_create_subcollection_is_cached(
    restore_instance: MetabaseRestore,
) -> None:
    """Test that a sub-collection is only created once, even if requested twice."""
    response = MagicMock()
    response.json.return_value = {"id": 7}
    response.raise_for_status.return_value = None
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    restore_instance._requests.post.return_value = response

    first_id = restore_instance._get_or_create_subcollection("Data_Availability", 1)
    second_id = restore_instance._get_or_create_subcollection("Data_Availability", 1)

    assert first_id == 7
    assert second_id == 7
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    restore_instance._requests.post.assert_called_once()


def test_resolve_references_success(restore_instance: MetabaseRestore) -> None:
    """Test resolving a {{#restore:<name>}} placeholder against a populated card map."""
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    restore_instance._card_map["Default_Reporting_Period"] = {
        "id": 364,
        "name": "Default Reporting Period",
    }

    resolved = restore_instance._resolve_references(
        "WITH reporting_period AS {{#restore:Default_Reporting_Period}}",
        Path("some_file.sql"),
    )

    assert resolved == "WITH reporting_period AS {{#364-default-reporting-period}}"


def test_resolve_references_unresolved_raises(
    restore_instance: MetabaseRestore,
) -> None:
    """Test that an unresolved restore reference fails fast, naming the file and reference."""
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    with pytest.raises(RuntimeError, match="unresolved_name") as exc_info:
        restore_instance._resolve_references(
            "SELECT * FROM {{#restore:unresolved_name}}",
            Path("bad_file.sql"),
        )

    assert "bad_file.sql" in str(exc_info.value)


def test_auto_template_tags_plain_variable(restore_instance: MetabaseRestore) -> None:
    """Test that an undefined plain {{variable}} gets a minimal "text" default tag."""
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    tags = restore_instance._auto_template_tags("SELECT {{project_name}} AS p", {})

    tag = tags["project_name"]
    assert tag["type"] == "text"
    assert tag["name"] == "project_name"


def test_auto_template_tags_hardcoded_card_reference(
    restore_instance: MetabaseRestore,
) -> None:
    """
    Test that a hardcoded (not restore-resolved) {{#id-slug}} reference gets a "card" tag.

    This covers referencing a question that already exists outside this
    restore run (e.g. a permanent collection a user built by hand), where
    there's no {{#restore:name}} placeholder to resolve -- the id is already
    literally embedded in the SQL.
    """
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    tags = restore_instance._auto_template_tags(
        "WITH x AS {{#142-default-reporting-period}} SELECT * FROM x",
        {},
    )

    tag = tags["#142-default-reporting-period"]
    assert tag["type"] == "card"
    assert tag["card-id"] == 142


def test_auto_template_tags_skips_existing(restore_instance: MetabaseRestore) -> None:
    """Test that a tag already covered by existing_tags is not overwritten."""
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    existing = {
        "quarter": {
            "type": "dimension",
            "name": "quarter",
            "dimension": ["field", 307, None],
            "widget-type": "string/=",
        },
    }
    tags = restore_instance._auto_template_tags("SELECT {{quarter}}", existing)

    assert tags == {}


def test_create_question_payload_shape(
    restore_instance: MetabaseRestore,
    tmp_path: Path,
) -> None:
    """Test that a created question posts the expected card payload shape."""
    sql_path = tmp_path / "My_Question.sql"
    sql_path.write_text("SELECT 1")
    (tmp_path / "My_Question.json").write_text(
        '{"name": "My Question", "display": "line", '
        '"visualization_settings": {"foo": "bar"}, "description": "desc"}',
    )

    response = MagicMock()
    response.json.return_value = {"id": 55}
    response.raise_for_status.return_value = None
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    restore_instance._requests.post.return_value = response

    restore_instance._create_question(sql_path, collection_id=3)

    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    _, kwargs = restore_instance._requests.post.call_args
    payload = kwargs["json"]
    assert payload["name"] == "My Question"
    assert payload["dataset_query"] == {
        "type": "native",
        "native": {"query": "SELECT 1"},
        "database": 99,
    }
    assert payload["display"] == "line"
    assert payload["visualization_settings"] == {"foo": "bar"}
    assert payload["collection_id"] == 3
    assert payload["description"] == "desc"
    assert restore_instance._card_map["My_Question"] == {
        "id": 55,
        "name": "My Question",
    }


def test_create_question_with_template_tags_and_parameters(
    restore_instance: MetabaseRestore,
    tmp_path: Path,
) -> None:
    """Test that sidecar template_tags/parameters are passed through to the payload."""
    sql_path = tmp_path / "Filtered_Question.sql"
    sql_path.write_text("SELECT * FROM t WHERE {{quarter}}")
    metadata = {
        "name": "Filtered Question",
        "template_tags": {
            "quarter": {
                "type": "dimension",
                "name": "quarter",
                "dimension": ["field", 307, None],
                "widget-type": "string/=",
            },
        },
        "parameters": [
            {
                "type": "string/=",
                "target": ["dimension", ["template-tag", "quarter"]],
                "name": "Quarter",
                "slug": "quarter",
            },
        ],
    }
    (tmp_path / "Filtered_Question.json").write_text(json.dumps(metadata))

    response = MagicMock()
    response.json.return_value = {"id": 66}
    response.raise_for_status.return_value = None
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    restore_instance._requests.post.return_value = response

    restore_instance._create_question(sql_path, collection_id=3)

    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    _, kwargs = restore_instance._requests.post.call_args
    payload = kwargs["json"]
    assert (
        payload["dataset_query"]["native"]["template-tags"] == metadata["template_tags"]
    )
    assert payload["parameters"] == metadata["parameters"]


def test_create_question_with_restore_reference_adds_card_template_tag(
    restore_instance: MetabaseRestore,
    tmp_path: Path,
) -> None:
    """
    Test that a {{#restore:name}} reference gets a matching "card"-type template-tag.

    Without this, Metabase accepts the card at creation time but fails at
    query time with "missing required parameters".
    """
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    restore_instance._card_map["Ranked_Statuses"] = {
        "id": 143,
        "name": "Ranked Statuses",
    }
    sql_path = tmp_path / "Consumer_Question.sql"
    sql_path.write_text("WITH ranked_statuses AS {{#restore:Ranked_Statuses}} SELECT 1")

    response = MagicMock()
    response.json.return_value = {"id": 200}
    response.raise_for_status.return_value = None
    restore_instance._requests.post.return_value = response

    restore_instance._create_question(sql_path, collection_id=3)

    _, kwargs = restore_instance._requests.post.call_args
    payload = kwargs["json"]
    query = payload["dataset_query"]["native"]["query"]
    tags = payload["dataset_query"]["native"]["template-tags"]
    assert "{{#143-ranked-statuses}}" in query
    tag = tags["#143-ranked-statuses"]
    assert tag["type"] == "card"
    assert tag["card-id"] == 143
    assert tag["name"] == "#143-ranked-statuses"


def test_create_question_error_propagates(
    restore_instance: MetabaseRestore,
    tmp_path: Path,
) -> None:
    """Test that a failed card creation raises rather than failing silently."""
    sql_path = tmp_path / "Bad_Question.sql"
    sql_path.write_text("SELECT 1")

    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    restore_instance._requests.post.side_effect = RequestException("API error")

    with pytest.raises(RequestException):
        restore_instance._create_question(sql_path, collection_id=3)


def test_create_question_http_error_logs_response_body(
    restore_instance: MetabaseRestore,
    tmp_path: Path,
    caplog: pytest.LogCaptureFixture,
) -> None:
    """Test that a 500's response body is logged, not just the exception message."""
    sql_path = tmp_path / "Bad_Question.sql"
    sql_path.write_text("SELECT 1")

    error_response = MagicMock()
    error_response.text = '{"message": "Invalid field reference"}'
    http_error = HTTPError("500 Server Error", response=error_response)

    response = MagicMock()
    response.raise_for_status.side_effect = http_error
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    restore_instance._requests.post.return_value = response

    with pytest.raises(HTTPError):
        restore_instance._create_question(sql_path, collection_id=3)

    assert "Invalid field reference" in caplog.text


def test_restore_processes_levels_in_order(
    restore_instance: MetabaseRestore,
    tmp_path: Path,
) -> None:
    """Test that level_0 is fully processed before level_1, so cross-refs resolve."""
    _write_question(
        tmp_path / "level_0" / "Data_Availability",
        "Default_Reporting_Period",
        "SELECT 1",
    )
    _write_question(
        tmp_path / "level_1" / "ETL_Metrics",
        "ETL_Issue_Count_All",
        "WITH x AS {{#restore:Default_Reporting_Period}} SELECT * FROM x",
    )

    created_ids = itertools.count(1)

    def fake_post(*_args: object, **_kwargs: object) -> MagicMock:
        response = MagicMock()
        response.json.return_value = {"id": next(created_ids)}
        response.raise_for_status.return_value = None
        return response

    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    restore_instance._requests.post.side_effect = fake_post
    restore_instance._resolve_database_id = MagicMock(return_value=99)

    restore_instance.restore()

    assert restore_instance._questions_created == 2
    assert "Default_Reporting_Period" in restore_instance._card_map
    assert "ETL_Issue_Count_All" in restore_instance._card_map


def test_restore_no_level_dirs_logs_warning(
    restore_instance: MetabaseRestore,
    caplog: pytest.LogCaptureFixture,
) -> None:
    """Test that an empty restore directory logs a warning rather than raising."""
    response = MagicMock()
    response.json.return_value = {"id": 1}
    response.raise_for_status.return_value = None
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    restore_instance._requests.post.return_value = response
    restore_instance._resolve_database_id = MagicMock(return_value=99)

    with caplog.at_level("WARNING"):
        restore_instance.restore()

    assert restore_instance._questions_created == 0
    assert "No level_* directories found" in caplog.text


def test_resolve_dashboard_parameters_resolves_card_source(
    restore_instance: MetabaseRestore,
) -> None:
    """Test that a card-sourced filter's values_source_config.card resolves by name."""
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    restore_instance._card_map["All_Deliverables"] = {
        "id": 49,
        "name": "All Deliverables",
    }

    parameters = [
        {
            "id": "deliverable",
            "slug": "deliverable",
            "values_source_type": "card",
            "values_source_config": {
                "card": "All_Deliverables",
                "value_field": ["field", "title", {"base-type": "type/Text"}],
            },
        },
    ]

    resolved = restore_instance._resolve_dashboard_parameters(
        parameters,
        Path("dash.json"),
    )

    assert resolved[0]["values_source_config"]["card_id"] == 49
    assert "card" not in resolved[0]["values_source_config"]
    assert resolved[0]["values_source_config"]["value_field"] == [
        "field",
        "title",
        {"base-type": "type/Text"},
    ]


def test_resolve_dashboard_parameters_missing_card_raises(
    restore_instance: MetabaseRestore,
) -> None:
    """Test that an unresolvable values_source_config.card fails fast, naming the file."""
    parameters = [
        {"id": "deliverable", "values_source_config": {"card": "Missing_Question"}},
    ]

    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    with pytest.raises(RuntimeError, match="Missing_Question") as exc_info:
        restore_instance._resolve_dashboard_parameters(parameters, Path("dash.json"))

    assert "dash.json" in str(exc_info.value)


def test_resolve_card_id_missing_raises(restore_instance: MetabaseRestore) -> None:
    """Test that a dashboard referencing an unresolved question fails fast."""
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    with pytest.raises(RuntimeError, match="Missing_Question") as exc_info:
        restore_instance._resolve_card_id("Missing_Question", Path("dash.json"))

    assert "dash.json" in str(exc_info.value)


def test_build_dashcard_payload_regular_card(restore_instance: MetabaseRestore) -> None:
    """Test that a regular dashcard resolves its card + tab and builds parameter_mappings."""
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    restore_instance._card_map["Deliverable_Status_History"] = {
        "id": 47,
        "name": "Deliverable - Status History",
    }
    tab_ids = {"Deliverable Details": -1}
    dashcard = {
        "tab": "Deliverable Details",
        "card": "Deliverable_Status_History",
        "col": 0,
        "row": 1,
        "size_x": 12,
        "size_y": 5,
        "visualization_settings": {"card.title": "Status History"},
        "parameter_mappings": [
            {"parameter": "deliverable", "target_tag": "deliverable_title"},
        ],
    }

    payload = restore_instance._build_dashcard_payload(
        dashcard,
        -1,
        tab_ids,
        Path("dash.json"),
    )

    assert payload["id"] == -1
    assert payload["dashboard_tab_id"] == -1
    assert payload["card_id"] == 47
    assert payload["col"] == 0
    assert payload["row"] == 1
    assert payload["size_x"] == 12
    assert payload["size_y"] == 5
    assert payload["visualization_settings"] == {"card.title": "Status History"}
    assert payload["parameter_mappings"] == [
        {
            "parameter_id": "deliverable",
            "card_id": 47,
            "target": [
                "dimension",
                ["template-tag", "deliverable_title"],
                {"stage-number": 0},
            ],
        },
    ]


def test_build_dashcard_payload_virtual_card(restore_instance: MetabaseRestore) -> None:
    """Test that a virtual/text dashcard synthesizes the virtual_card viz settings shape."""
    tab_ids = {"Deliverable Details": -1}
    dashcard = {
        "tab": "Deliverable Details",
        "text": "# {{deliverable_title}}",
        "col": 0,
        "row": 0,
        "size_x": 24,
        "size_y": 1,
        "parameter_mappings": [
            {"parameter": "deliverable", "target_tag": "deliverable_title"},
        ],
    }

    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    payload = restore_instance._build_dashcard_payload(
        dashcard,
        -1,
        tab_ids,
        Path("dash.json"),
    )

    assert payload["card_id"] is None
    assert payload["visualization_settings"]["text"] == "# {{deliverable_title}}"
    assert payload["visualization_settings"]["virtual_card"]["display"] == "text"
    assert payload["parameter_mappings"] == [
        {"parameter_id": "deliverable", "target": ["text-tag", "deliverable_title"]},
    ]


def test_build_dashcard_payload_unknown_tab_raises(
    restore_instance: MetabaseRestore,
) -> None:
    """Test that a dashcard referencing an unknown tab name fails fast."""
    dashcard = {
        "tab": "Nonexistent Tab",
        "card": "Whatever",
        "col": 0,
        "row": 0,
        "size_x": 1,
        "size_y": 1,
    }

    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    with pytest.raises(RuntimeError, match="Nonexistent Tab"):
        restore_instance._build_dashcard_payload(dashcard, -1, {}, Path("dash.json"))


def test_build_dashcard_payload_no_tabs_at_all(
    restore_instance: MetabaseRestore,
) -> None:
    """Test that a dashcard with tab=None on a tab-less dashboard doesn't raise."""
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    restore_instance._card_map["Issue_Title"] = {"id": 12, "name": "Issue Title"}
    dashcard = {
        "tab": None,
        "card": "Issue_Title",
        "col": 0,
        "row": 0,
        "size_x": 24,
        "size_y": 3,
    }

    payload = restore_instance._build_dashcard_payload(
        dashcard,
        -1,
        {},
        Path("dash.json"),
    )

    assert payload["dashboard_tab_id"] is None
    assert payload["card_id"] == 12


def test_create_dashboard_put_payload_shape(
    restore_instance: MetabaseRestore,
    tmp_path: Path,
) -> None:
    """Test that POST creates the shell and PUT carries width/filters/tabs/dashcards."""
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    restore_instance._card_map["Current_Quarter"] = {
        "id": 38,
        "name": "Current Quarter",
    }

    dash_path = tmp_path / "Delivery_Metrics.json"
    dash_path.write_text(
        json.dumps(
            {
                "name": "Delivery Metrics",
                "description": None,
                "width": "fixed",
                "auto_apply_filters": True,
                "parameters": [],
                "tabs": ["Tab One"],
                "dashcards": [
                    {
                        "tab": "Tab One",
                        "card": "Current_Quarter",
                        "col": 0,
                        "row": 0,
                        "size_x": 12,
                        "size_y": 4,
                    },
                ],
            },
        ),
    )

    post_response = MagicMock()
    post_response.json.return_value = {"id": 100}
    post_response.raise_for_status.return_value = None
    put_response = MagicMock()
    put_response.raise_for_status.return_value = None

    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    restore_instance._requests.post.return_value = post_response
    restore_instance._requests.put.return_value = put_response

    restore_instance._create_dashboard(dash_path, collection_id=5)

    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    _, post_kwargs = restore_instance._requests.post.call_args
    post_payload = post_kwargs["json"]
    assert "width" not in post_payload
    assert "auto_apply_filters" not in post_payload
    assert post_payload["name"] == "Delivery Metrics"
    assert post_payload["collection_id"] == 5

    put_args, put_kwargs = restore_instance._requests.put.call_args
    assert put_args[0] == "http://metabase.example.com/api/dashboard/100"
    put_payload = put_kwargs["json"]
    assert put_payload["width"] == "fixed"
    assert put_payload["auto_apply_filters"] is True
    assert put_payload["tabs"] == [{"id": -1, "name": "Tab One"}]
    assert put_payload["dashcards"][0]["card_id"] == 38
    assert put_payload["dashcards"][0]["dashboard_tab_id"] == -1

    assert restore_instance._dashboards_created == 1


def test_process_dashboards_noop_when_dir_missing(
    restore_instance: MetabaseRestore,
) -> None:
    """Test that a missing dashboards/ directory is silently skipped."""
    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    restore_instance._process_dashboards(parent_id=1)

    assert restore_instance._dashboards_created == 0
    restore_instance._requests.post.assert_not_called()


def test_restore_creates_dashboard_after_questions(
    restore_instance: MetabaseRestore,
    tmp_path: Path,
) -> None:
    """Test the full restore() flow: questions created first, then a dashboard referencing them."""
    _write_question(
        tmp_path / "level_0" / "Quarter_Data",
        "Current_Quarter",
        "SELECT '2026-Q3'",
    )
    (tmp_path / "dashboards" / "Dashboards").mkdir(parents=True)
    (tmp_path / "dashboards" / "Dashboards" / "Delivery_Metrics.json").write_text(
        json.dumps(
            {
                "name": "Delivery Metrics",
                "tabs": ["Tab One"],
                "dashcards": [
                    {
                        "tab": "Tab One",
                        "card": "Current_Quarter",
                        "col": 0,
                        "row": 0,
                        "size_x": 12,
                        "size_y": 4,
                    },
                ],
            },
        ),
    )

    created_ids = itertools.count(1)

    def fake_post(*_args: object, **_kwargs: object) -> MagicMock:
        response = MagicMock()
        response.json.return_value = {"id": next(created_ids)}
        response.raise_for_status.return_value = None
        return response

    put_response = MagicMock()
    put_response.raise_for_status.return_value = None

    # pylint: disable=protected-access
    # ruff: noqa: SLF001
    restore_instance._requests.post.side_effect = fake_post
    restore_instance._requests.put.return_value = put_response
    restore_instance._resolve_database_id = MagicMock(return_value=99)

    restore_instance.restore()

    assert restore_instance._questions_created == 1
    assert restore_instance._dashboards_created == 1


def test_level_sort_key_is_numeric(tmp_path: Path) -> None:
    """Test that level directories sort numerically, not lexicographically."""
    names = ["level_0", "level_2", "level_10", "level_1"]
    dirs = []
    for name in names:
        d = tmp_path / name
        d.mkdir()
        dirs.append(d)

    ordered = sorted(dirs, key=_level_sort_key)

    assert [d.name for d in ordered] == ["level_0", "level_1", "level_2", "level_10"]
