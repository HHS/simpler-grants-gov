"""
Metabase question and dashboard restore functionality.

This module publishes a set of Metabase questions and dashboards from a
local "restore directory" by:
1. Creating a new, timestamped collection (so re-running never collides
   with a previous run)
2. Walking the restore directory's `level_N/<Collection>/*.sql` structure in
   ascending level order, resolving `{{#restore:<name>}}` cross-question
   references against questions created in earlier levels
3. Posting each resolved question to the Metabase API as a card in the
   appropriate sub-collection
4. Walking the restore directory's `dashboards/<Collection>/*.json` structure
   (processed after every `level_N` directory, so all referenced questions
   already exist), creating each dashboard with its tabs and dashcards,
   resolving question-name references against the same cards created in
   step 3

Unlike `backup_v2.py` (which reads *from* Metabase and writes local files),
this module reads local files and writes *to* Metabase. It never modifies or
deletes anything already in the target instance -- every run only adds a new,
independent collection.
"""

import json
import logging
import os
import re
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import requests
from requests.exceptions import RequestException

from analytics.integrations.metabase._shared import (
    CARD_TAG_PATTERN,
    RESTORE_REFERENCE_PATTERN,
    VARIABLE_TAG_PATTERN,
    build_card_tag,
    build_text_tag,
    slugify,
)

logger = logging.getLogger(__name__)


class MetabaseRestore:
    """Publish restore content to Metabase in a new timestamped collection."""

    def __init__(
        self,
        api_url: str,
        api_key: str,
        restore_dir: str,
        collection_name: str,
    ) -> None:
        """
        Initialize the Metabase restore handler.

        Args:
            api_url: Base URL for the Metabase API.
            api_key: API key for authentication.
            restore_dir: Path to the restore directory (contains level_N/ folders).
            collection_name: Base name for the new collection; a timestamp
                is appended to it.

        """
        self.api_url = api_url.rstrip("/")
        self.api_key = api_key
        self.restore_dir = Path(restore_dir)
        self.collection_name = collection_name
        self.headers = {"x-api-key": api_key, "Content-Type": "application/json"}
        self._requests = requests
        self._database_id: int | None = None
        self._subcollection_ids: dict[str, int] = {}
        # Maps a restore question's filename (without extension) to the newly
        # created card's {"id": ..., "name": ...}.
        self._card_map: dict[str, dict[str, Any]] = {}
        self._questions_created = 0
        self._dashboards_created = 0

    def restore(self) -> None:
        """Create a new collection and post every restore question and dashboard into it."""
        self._database_id = self._resolve_database_id()
        parent_id = self._create_parent_collection()

        level_dirs = sorted(
            (p for p in self.restore_dir.glob("level_*") if p.is_dir()),
            key=_level_sort_key,
        )
        if not level_dirs:
            logger.warning("No level_* directories found under %s", self.restore_dir)

        for level_dir in level_dirs:
            self._process_level(level_dir, parent_id)

        self._process_dashboards(parent_id)

        logger.info(
            "Restore complete: %d question(s) and %d dashboard(s) created in "
            "collection '%s' (id=%d)",
            self._questions_created,
            self._dashboards_created,
            self.collection_name,
            parent_id,
        )
        web_url = self._collection_web_url(parent_id)
        if web_url:
            logger.info("View it at: %s", web_url)

    def _resolve_database_id(self) -> int:
        """Look up the target database's id by matching DB_NAME."""
        db_name = os.getenv("DB_NAME")
        url = f"{self.api_url}/database"
        response = self._requests.get(url, headers=self.headers, timeout=30)
        response.raise_for_status()
        body = response.json()
        databases = body["data"] if isinstance(body, dict) and "data" in body else body

        for db in databases:
            if db.get("name") == db_name:
                return db["id"]

        message = f"No Metabase database named '{db_name}' found."
        raise RuntimeError(message)

    def _create_parent_collection(self) -> int:
        """Create the new top-level, timestamped collection."""
        timestamp = datetime.now(UTC).strftime("%Y-%m-%d_%H%M%S")
        name = f"{self.collection_name} {timestamp}"
        url = f"{self.api_url}/collection"
        response = self._requests.post(
            url,
            headers=self.headers,
            json={"name": name},
            timeout=30,
        )
        response.raise_for_status()
        collection_id = response.json()["id"]
        logger.info("Created collection '%s' (id=%d)", name, collection_id)
        return collection_id

    def _get_or_create_subcollection(self, name: str, parent_id: int) -> int:
        """Get the cached sub-collection id, creating it on first use."""
        if name in self._subcollection_ids:
            return self._subcollection_ids[name]

        url = f"{self.api_url}/collection"
        response = self._requests.post(
            url,
            headers=self.headers,
            json={"name": name, "parent_id": parent_id},
            timeout=30,
        )
        response.raise_for_status()
        collection_id = response.json()["id"]
        self._subcollection_ids[name] = collection_id
        logger.info("Created sub-collection '%s' (id=%d)", name, collection_id)
        return collection_id

    def _process_level(self, level_dir: Path, parent_id: int) -> None:
        """Process every question under a single level_N directory."""
        for collection_dir in sorted(p for p in level_dir.iterdir() if p.is_dir()):
            collection_id = self._get_or_create_subcollection(
                collection_dir.name,
                parent_id,
            )
            for sql_path in sorted(collection_dir.glob("*.sql")):
                self._create_question(sql_path, collection_id)

    def _create_question(self, sql_path: Path, collection_id: int) -> None:
        """Resolve references, then create a single question."""
        key = sql_path.stem
        query = self._resolve_references(sql_path.read_text(), sql_path)
        metadata = self._load_metadata(sql_path)

        name = metadata.get("name", key.replace("_", " "))
        template_tags = dict(metadata.get("template_tags") or {})
        template_tags.update(self._auto_template_tags(query, template_tags))
        native: dict[str, Any] = {"query": query}
        if template_tags:
            native["template-tags"] = template_tags

        payload = {
            "name": name,
            "dataset_query": {
                "type": "native",
                "native": native,
                "database": self._database_id,
            },
            "display": metadata.get("display", "table"),
            "visualization_settings": metadata.get("visualization_settings", {}),
            "collection_id": collection_id,
        }
        if metadata.get("description"):
            payload["description"] = metadata["description"]
        if metadata.get("parameters"):
            payload["parameters"] = metadata["parameters"]

        url = f"{self.api_url}/card"
        try:
            response = self._requests.post(
                url,
                headers=self.headers,
                json=payload,
                timeout=30,
            )
            response.raise_for_status()
        except RequestException:
            logger.exception("Failed to create question from %s", sql_path)
            raise

        card = response.json()
        self._card_map[key] = {"id": card["id"], "name": name}
        self._questions_created += 1
        logger.info("Created question '%s' (id=%d) from %s", name, card["id"], sql_path)

    def _load_metadata(self, sql_path: Path) -> dict[str, Any]:
        """Load the sidecar JSON metadata for a question, if present."""
        json_path = sql_path.with_suffix(".json")
        if not json_path.exists():
            return {}
        return json.loads(json_path.read_text())

    def _resolve_references(self, query: str, sql_path: Path) -> str:
        """Replace {{#restore:<name>}} placeholders with real card references."""

        def replace(match: re.Match) -> str:
            key = match.group(1)
            if key not in self._card_map:
                message = (
                    f"{sql_path}: reference to unresolved restore question "
                    f"'{key}' -- it must live in an earlier level_N/ "
                    "directory than this file."
                )
                raise RuntimeError(message)
            card = self._card_map[key]
            slug = slugify(card["name"])
            return f"{{{{#{card['id']}-{slug}}}}}"

        return RESTORE_REFERENCE_PATTERN.sub(replace, query)

    def _auto_template_tags(
        self,
        query: str,
        existing_tags: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Generate minimal default template-tags for any {{...}} not already covered.

        Metabase requires every embedded tag to have a matching
        template-tags entry or the query fails at run time -- with a raw
        SQL syntax error for an undefined {{variable}} (Metabase doesn't
        substitute it at all), or "missing required parameters" for an
        undefined {{#<id>-<slug>}} card reference. Restore content normally
        covers these via sidecar `template_tags`, and {{#restore:name}}
        cross-references get resolved to real {{#<id>-<slug>}} text by
        `_resolve_references`; this catches anything still missing
        afterward, e.g. a hardcoded reference to a question that already
        exists outside this restore run.
        """
        auto_tags: dict[str, Any] = {}

        for match in CARD_TAG_PATTERN.finditer(query):
            tag_name = match.group(1)
            if tag_name in existing_tags:
                continue
            card_id = int(tag_name[1:].split("-", 1)[0])
            auto_tags[tag_name] = build_card_tag(tag_name, card_id)

        for match in VARIABLE_TAG_PATTERN.finditer(query):
            tag_name = match.group(1)
            if tag_name in existing_tags or tag_name in auto_tags:
                continue
            auto_tags[tag_name] = build_text_tag(tag_name)

        return auto_tags

    def _process_dashboards(self, parent_id: int) -> None:
        """Create every dashboard defined under the restore directory's dashboards/ folder."""
        dashboards_dir = self.restore_dir / "dashboards"
        if not dashboards_dir.is_dir():
            return

        for collection_dir in sorted(p for p in dashboards_dir.iterdir() if p.is_dir()):
            collection_id = self._get_or_create_subcollection(
                collection_dir.name,
                parent_id,
            )
            for dash_path in sorted(collection_dir.glob("*.json")):
                self._create_dashboard(dash_path, collection_id)

    def _create_dashboard(self, dash_path: Path, collection_id: int) -> None:
        """Create a single dashboard, its tabs, and its dashcards from a restore file."""
        spec = json.loads(dash_path.read_text())
        dashboard_id = self._create_dashboard_shell(spec, collection_id, dash_path)
        self._populate_dashboard(spec, dashboard_id, dash_path)

        self._dashboards_created += 1
        logger.info(
            "Created dashboard '%s' (id=%d) from %s",
            spec["name"],
            dashboard_id,
            dash_path,
        )
        web_url = self._dashboard_web_url(dashboard_id)
        if web_url:
            logger.info("View it at: %s", web_url)

    def _create_dashboard_shell(
        self,
        spec: dict[str, Any],
        collection_id: int,
        dash_path: Path,
    ) -> int:
        """POST the empty dashboard (name/description/parameters only)."""
        parameters = self._resolve_dashboard_parameters(
            spec.get("parameters") or [],
            dash_path,
        )
        url = f"{self.api_url}/dashboard"
        try:
            response = self._requests.post(
                url,
                headers=self.headers,
                json={
                    "name": spec["name"],
                    "description": spec.get("description"),
                    "collection_id": collection_id,
                    "parameters": parameters,
                },
                timeout=30,
            )
            response.raise_for_status()
        except RequestException:
            logger.exception("Failed to create dashboard from %s", dash_path)
            raise
        dashboard_id: int = response.json()["id"]
        return dashboard_id

    def _populate_dashboard(
        self,
        spec: dict[str, Any],
        dashboard_id: int,
        dash_path: Path,
    ) -> None:
        """PUT the dashboard's width/filters/tabs/dashcards in one bulk call."""
        tab_ids: dict[str, int] = {}
        tabs = []
        for index, tab_name in enumerate(spec.get("tabs") or [], start=1):
            tab_ids[tab_name] = -index
            tabs.append({"id": -index, "name": tab_name})

        dashcards = [
            self._build_dashcard_payload(dashcard, -index, tab_ids, dash_path)
            for index, dashcard in enumerate(spec.get("dashcards") or [], start=1)
        ]

        url = f"{self.api_url}/dashboard/{dashboard_id}"
        try:
            response = self._requests.put(
                url,
                headers=self.headers,
                json={
                    "width": spec.get("width", "fixed"),
                    "auto_apply_filters": spec.get("auto_apply_filters", True),
                    "tabs": tabs,
                    "dashcards": dashcards,
                },
                timeout=30,
            )
            response.raise_for_status()
        except RequestException:
            logger.exception("Failed to populate dashboard from %s", dash_path)
            raise

    def _resolve_dashboard_parameters(
        self,
        parameters: list[dict[str, Any]],
        dash_path: Path,
    ) -> list[dict[str, Any]]:
        """Resolve any card-sourced filter's `values_source_config.card` by name."""
        resolved = []
        for raw_param in parameters:
            param = dict(raw_param)
            source_config = param.get("values_source_config")
            if source_config and "card" in source_config:
                source_config = dict(source_config)
                card_name = source_config.pop("card")
                source_config["card_id"] = self._resolve_card_id(card_name, dash_path)
                param["values_source_config"] = source_config
            resolved.append(param)
        return resolved

    def _build_dashcard_payload(
        self,
        dashcard: dict[str, Any],
        dashcard_id: int,
        tab_ids: dict[str, int],
        dash_path: Path,
    ) -> dict[str, Any]:
        """Resolve one restore dashcard entry into a real Metabase dashcard payload."""
        tab_name = dashcard.get("tab")
        if tab_name is None:
            dashboard_tab_id = None
        elif tab_name in tab_ids:
            dashboard_tab_id = tab_ids[tab_name]
        else:
            message = f"{dash_path}: dashcard references unknown tab '{tab_name}'."
            raise RuntimeError(message)

        card_name = dashcard.get("card")
        card_id = self._resolve_card_id(card_name, dash_path) if card_name else None

        visualization_settings = dict(dashcard.get("visualization_settings") or {})
        if "text" in dashcard:
            visualization_settings["text"] = dashcard["text"]
            visualization_settings.setdefault(
                "virtual_card",
                {
                    "name": None,
                    "dataset_query": {},
                    "display": "text",
                    "visualization_settings": {},
                    "archived": False,
                },
            )

        payload: dict[str, Any] = {
            "id": dashcard_id,
            "dashboard_tab_id": dashboard_tab_id,
            "card_id": card_id,
            "col": dashcard["col"],
            "row": dashcard["row"],
            "size_x": dashcard["size_x"],
            "size_y": dashcard["size_y"],
            "visualization_settings": visualization_settings,
        }
        if dashcard.get("parameter_mappings"):
            payload["parameter_mappings"] = _build_parameter_mappings(
                dashcard["parameter_mappings"],
                card_id,
            )
        return payload

    def _resolve_card_id(self, name: str, dash_path: Path) -> int:
        """Look up an already-created card's id by its restore question name."""
        if name not in self._card_map:
            message = (
                f"{dash_path}: reference to unresolved restore question "
                f"'{name}' -- it must live in a level_N/ directory (all of "
                "which are processed before any dashboards)."
            )
            raise RuntimeError(message)
        return self._card_map[name]["id"]

    def _collection_web_url(self, collection_id: int) -> str | None:
        """Best-effort web UI URL for the created collection."""
        if not self.api_url.endswith("/api"):
            return None
        base = self.api_url[: -len("/api")]
        return f"{base}/collection/{collection_id}"

    def _dashboard_web_url(self, dashboard_id: int) -> str | None:
        """Best-effort web UI URL for the created dashboard."""
        if not self.api_url.endswith("/api"):
            return None
        base = self.api_url[: -len("/api")]
        return f"{base}/dashboard/{dashboard_id}"


def _level_sort_key(level_dir: Path) -> int:
    """Sort level_N directories numerically, so level_2 comes before level_10."""
    return int(level_dir.name.removeprefix("level_"))


def _build_parameter_mappings(
    mappings: list[dict[str, Any]],
    card_id: int | None,
) -> list[dict[str, Any]]:
    """Convert restore-style {parameter, target_tag} mappings to Metabase's shape."""
    resolved = []
    for mapping in mappings:
        entry: dict[str, Any] = {"parameter_id": mapping["parameter"]}
        if card_id is not None:
            entry["card_id"] = card_id
            entry["target"] = [
                "dimension",
                ["template-tag", mapping["target_tag"]],
                {"stage-number": 0},
            ]
        else:
            entry["target"] = ["text-tag", mapping["target_tag"]]
        resolved.append(entry)
    return resolved
