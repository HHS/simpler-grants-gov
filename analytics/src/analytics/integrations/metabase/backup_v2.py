"""
Metabase backup functionality (v2).

This module reads and persists a copy of the dashboards and queries 
in a Metabase instance. The backup dataset is stored in a shared 
format which can be consumed by the inverse capability, `metabase-restore`.
"""

import hashlib
import json
import logging
import re
import shutil
from collections import defaultdict
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import requests
from requests.exceptions import HTTPError, RequestException
from sqlparse import format as format_sql

from analytics.integrations.metabase._shared import (
    CARD_TAG_PATTERN,
    RESTORE_COLLECTION_DESCRIPTION,
    RESTORE_REFERENCE_PATTERN,
    clean_name,
)

logger = logging.getLogger(__name__)

HTTP_FORBIDDEN = 403

# Length of a `["field", <a>, <b>]` reference, classic or pMBQL-shaped alike.
_FIELD_REF_LENGTH = 3

# Matches any double-curly-brace placeholder -- our own restore reference
# syntax, Metabase's own resolved card-reference syntax, and plain
# variable filters alike.
_TEMPLATE_PLACEHOLDER_PATTERN = re.compile(r"\{\{.*?\}\}")


class MetabaseBackupV2:
    """Back up Metabase questions and dashboards to local filesystem, in restore format."""

    def __init__(self, api_url: str, api_key: str, output_dir: str) -> None:
        """
        Initialize the Metabase backup handler.

        Args:
            api_url: Base URL for the Metabase API.
            api_key: API key for authentication.
            output_dir: Directory to write backup files to.

        """
        self.api_url = api_url.rstrip("/")
        self.api_key = api_key
        self.output_dir = Path(output_dir)
        self.headers = {"x-api-key": api_key, "Content-Type": "application/json"}
        self._requests = requests
        self.stats = self._init_stats()
        # Maps a source database's id to its own {field_id: {schema, table,
        # column}} map, fetched at most once per database actually referenced
        # by a dimension-type template tag.
        self._field_ref_cache: dict[int, dict[int, dict[str, str]]] = {}

    @staticmethod
    def _init_stats() -> dict[str, int]:
        """Init dictionary of stats to collect."""
        return {
            "collections_processed": 0,
            "questions_processed": 0,
            "questions_skipped": 0,
            "dashboards_processed": 0,
            "dashboards_skipped": 0,
            "files_added": 0,
            "files_removed": 0,
            "files_modified": 0,
        }

    def backup(self) -> None:
        """Back up every question and dashboard to local filesystem, in restore format."""
        self.stats = self._init_stats()
        self.output_dir.mkdir(parents=True, exist_ok=True)

        collections = self.get_collections()
        self.stats["collections_processed"] = len(collections)
        logger.info("Found %d collections", len(collections))
        collection_folder = self._build_collection_folder_map(collections)

        cards_summary, dashboards_summary, collection_of = self._inventory(collections)
        self._check_collisions(cards_summary, collections)
        id_to_key = self._build_id_to_key_map(cards_summary)
        resolved_cards = self._resolve_all_cards(cards_summary, id_to_key)
        levels = self._assign_levels(resolved_cards)

        before = self._snapshot_output_tree()
        self._wipe_output_tree()
        self._write_all_questions(
            resolved_cards,
            levels,
            collection_of,
            collection_folder,
        )
        # Dashboards can only reference cards that were actually captured --
        # a card skipped above (e.g. a non-native question) has no .sql file
        # for a dashboard reference to resolve against at restore time, even
        # though its id is still a legitimate key in the broader id_to_key
        # map used for in-query cross-references above.
        written_id_to_key = {card["id"]: key for key, card in resolved_cards.items()}
        self._write_all_dashboards(
            dashboards_summary,
            written_id_to_key,
            collection_of,
            collection_folder,
        )
        after = self._snapshot_output_tree()

        self._record_changes(before, after)
        logger.info(
            "Done processing %d collections",
            self.stats["collections_processed"],
        )
        self.write_changelog()

    def get_collections(self) -> list[dict[str, Any]]:
        """
        Get all available collections from Metabase, excluding stale restore collections.

        Returns:
            List of collection objects with id, name, and location.

        """
        url = f"{self.api_url}/collection/?exclude-other-user-collections=true"
        response = self._requests.get(url, headers=self.headers, timeout=30)
        response.raise_for_status()
        raw = response.json()

        # Exclude personal/sample/archived collections *before* looking for a
        # "real" top-level collection -- Metabase's own built-in "Examples"
        # collection (is_sample: true) is a top-level, non-personal,
        # non-archived collection too, and would otherwise be mistaken for a
        # genuine standing collection.
        eligible = [
            c
            for c in raw
            if not (c.get("is_personal") or c.get("is_sample") or c.get("archived"))
        ]
        top_level = [c for c in eligible if c.get("location") == "/"]
        # `analytics metabase restore` (make mb-restore) creates a fresh,
        # disposable top-level collection on every run -- a re-import of
        # restore content, not new content, and never meant to be backed up.
        # Left lying around across multiple restore runs, their
        # identically-named sub-collections (Sprint_Metrics, Shared, ...)
        # would otherwise collide with the one real/standing collection's
        # own sub-collections under this format's global-uniqueness
        # requirement -- so these are excluded from backup entirely, however
        # many pile up, rather than requiring them to be manually cleaned up
        # first.
        restore_roots = [c for c in top_level if self._is_restore_collection(c)]
        has_non_restore_root = len(restore_roots) < len(top_level)

        # A genuine standing collection makes every restore collection
        # redundant scratch -- exclude them all. Otherwise (every top-level
        # collection is itself a restore collection, e.g. right after a fresh
        # install with nothing else restored yet), keep only the most recent
        # one so there's still something to back up, and older ones don't
        # collide with it.
        if has_non_restore_root:
            excluded_root_ids = {c["id"] for c in restore_roots}
        elif restore_roots:
            newest_id = max(c["id"] for c in restore_roots)
            excluded_root_ids = {c["id"] for c in restore_roots if c["id"] != newest_id}
        else:
            excluded_root_ids = set()

        collections = []
        for collection in raw:
            if (
                collection.get("is_personal")
                or collection.get("is_sample")
                or collection.get("archived")
            ):
                continue
            if not all(field in collection for field in ["id", "name", "location"]):
                continue
            location = collection["location"] or ""
            ancestor_ids = {
                int(part) for part in location.strip("/").split("/") if part
            }
            if (
                collection["id"] in excluded_root_ids
                or ancestor_ids & excluded_root_ids
            ):
                continue
            collections.append(collection)

        return collections

    @staticmethod
    def _is_restore_collection(collection: dict[str, Any]) -> bool:
        """Check whether a top-level collection was created by a restore run."""
        return collection.get("description") == RESTORE_COLLECTION_DESCRIPTION

    def get_items(self, collection_id: int) -> list[dict[str, Any]]:
        """
        Get all card and dashboard items in a collection.

        Args:
            collection_id: ID of the collection to get.

        Returns:
            List of item objects with id, name, and model.

        """
        url = f"{self.api_url}/collection/{collection_id}/items"
        response = self._requests.get(url, headers=self.headers, timeout=30)
        response.raise_for_status()

        items = []
        for item in response.json().get("data", []):
            if item.get("model") in ("card", "dashboard") and all(
                field in item for field in ["id", "name"]
            ):
                items.append(item)
            else:
                logger.debug(
                    "Skipping item: %s (model: %s)",
                    item.get("name"),
                    item.get("model"),
                )

        return items

    def get_card_detail(self, card_id: int) -> dict[str, Any] | None:
        """Fetch a card's full detail (query, display, metadata, parameters)."""
        url = f"{self.api_url}/card/{card_id}"
        return self._get_detail(url, "card", card_id)

    def get_dashboard_detail(self, dashboard_id: int) -> dict[str, Any] | None:
        """Fetch a dashboard's full detail (tabs, dashcards, parameters)."""
        url = f"{self.api_url}/dashboard/{dashboard_id}"
        return self._get_detail(url, "dashboard", dashboard_id)

    def _get_detail(self, url: str, kind: str, item_id: int) -> dict[str, Any] | None:
        """GET a single item's detail, returning None (and logging) on failure."""
        try:
            response = self._requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            return response.json()
        except HTTPError as exc:
            if exc.response is not None and exc.response.status_code == HTTP_FORBIDDEN:
                logger.warning(
                    "Permission denied (403) for %s %d. Skipping.",
                    kind,
                    item_id,
                )
            else:
                logger.exception("Error getting %s %d", kind, item_id)
            return None
        except RequestException:
            logger.exception("Error getting %s %d", kind, item_id)
            return None

    def _inventory(
        self,
        collections: list[dict[str, Any]],
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]], dict[int, int]]:
        """Walk every collection's items, splitting into cards vs. dashboards."""
        cards_summary = []
        dashboards_summary = []
        collection_of: dict[int, int] = {}

        for collection in collections:
            items = self.get_items(collection["id"])
            logger.info(
                "Found %d items in collection %d (%s)",
                len(items),
                collection["id"],
                collection["name"],
            )
            for item in items:
                collection_of[item["id"]] = collection["id"]
                if item["model"] == "card":
                    cards_summary.append(item)
                else:
                    dashboards_summary.append(item)

        return cards_summary, dashboards_summary, collection_of

    def _check_collisions(
        self,
        cards_summary: list[dict[str, Any]],
        collections: list[dict[str, Any]],
    ) -> None:
        """
        Raise one combined error if any question or collection name collides.

        This format requires every question key and collection folder name
        to be globally unique -- collect every collision in one pass so a
        real instance's whole set of problems surfaces at once, rather than
        being discovered one rename at a time.
        """
        problems: list[str] = []

        card_ids_by_key: dict[str, list[int]] = defaultdict(list)
        for card in cards_summary:
            card_ids_by_key[clean_name(card["name"])].append(card["id"])
        for key, ids in sorted(card_ids_by_key.items()):
            if len(ids) > 1:
                problems.append(
                    f"Question name '{key}' is used by card ids {ids} "
                    "-- rename one in Metabase.",
                )

        folder_ids_by_key: dict[str, list[int]] = defaultdict(list)
        for collection in collections:
            folder_ids_by_key[clean_name(collection["name"])].append(collection["id"])
        for key, ids in sorted(folder_ids_by_key.items()):
            if len(ids) > 1:
                problems.append(
                    f"Collection name '{key}' is used by collection ids {ids} "
                    "-- rename one in Metabase.",
                )

        if problems:
            details = "\n".join(f"  - {problem}" for problem in problems)
            message = (
                "Cannot back up: found name collisions that would break this "
                f"format's global-uniqueness requirement:\n{details}"
            )
            raise RuntimeError(message)

    @staticmethod
    def _build_id_to_key_map(cards_summary: list[dict[str, Any]]) -> dict[int, str]:
        """Map every card id to its clean-name key (uniqueness already checked)."""
        return {card["id"]: clean_name(card["name"]) for card in cards_summary}

    @staticmethod
    def _build_collection_folder_map(
        collections: list[dict[str, Any]],
    ) -> dict[int, str]:
        """Map every collection id to its leaf clean-name folder."""
        return {
            collection["id"]: clean_name(collection["name"])
            for collection in collections
        }

    def _resolve_all_cards(
        self,
        cards_summary: list[dict[str, Any]],
        id_to_key: dict[int, str],
    ) -> dict[str, dict[str, Any]]:
        """Fetch and resolve every card's full detail, keyed by its clean-name key."""
        resolved: dict[str, dict[str, Any]] = {}
        for item in cards_summary:
            detail = self.get_card_detail(item["id"])
            if detail is None:
                self.stats["questions_skipped"] += 1
                continue
            card = self._resolve_card(detail, id_to_key)
            if card is None:
                self.stats["questions_skipped"] += 1
                continue
            resolved[card["key"]] = card
        return resolved

    def _resolve_card(
        self,
        card: dict[str, Any],
        id_to_key: dict[int, str],
    ) -> dict[str, Any] | None:
        """Resolve one card's raw API detail into restore-ready fields."""
        query_type = card.get("query_type")
        if query_type is not None and query_type != "native":
            # A question built with Metabase's visual query builder (MBQL)
            # rather than hand-written SQL -- there's no query text to
            # capture, and that's expected, not a malformed card. Logged at
            # info, not warning, and with its own message so it doesn't read
            # like the same failure as a native question with a genuinely
            # missing/invalid query.
            logger.info(
                "Skipping card %s (%r): not a native SQL question (query_type=%s)",
                card.get("id"),
                card.get("name"),
                query_type,
            )
            return None

        raw_query, tags = self._native_query_and_tags(card)
        query = self._extract_query(raw_query, card.get("id"))
        if query is None:
            return None

        query = self._rewrite_references(query, id_to_key)
        database_id = card.get("database_id")
        kept_tags = {
            name: self._normalize_dimension_tag(tag, database_id)
            for name, tag in tags.items()
            if tag.get("type") != "card"
        }

        return {
            "key": clean_name(card["name"]),
            "id": card["id"],
            "name": card["name"],
            "query": query,
            "display": card.get("display", "table"),
            "visualization_settings": card.get("visualization_settings") or {},
            "description": card.get("description"),
            "template_tags": kept_tags,
            "parameters": card.get("parameters") or [],
            "dependencies": set(RESTORE_REFERENCE_PATTERN.findall(query)),
        }

    @staticmethod
    def _native_query_and_tags(
        card: dict[str, Any],
    ) -> tuple[str | None, dict[str, Any]]:
        """
        Extract (query text, template-tags dict) from a card's dataset_query.

        Metabase's card-detail API returns one of two shapes depending on
        the instance's Metabase version: the classic flat shape
        (`dataset_query.native.query`, template-tags as a dict keyed by tag
        name), or the newer "pMBQL" shape (`dataset_query.stages[0].native`,
        template-tags as a list of tag objects that each already carry their
        own `name` field). Both are handled here so this doesn't silently
        break again on the next Metabase upgrade either way.
        """
        dataset_query = card.get("dataset_query") or {}
        stages = dataset_query.get("stages")
        if isinstance(stages, list) and stages:
            stage = stages[0]
            query = stage.get("native")
            raw_tags = stage.get("template-tags") or []
            tags = {
                tag["name"]: tag
                for tag in raw_tags
                if isinstance(tag, dict) and "name" in tag
            }
            return (query if isinstance(query, str) else None), tags

        native = dataset_query.get("native") or {}
        query = native.get("query")
        tags = native.get("template-tags") or {}
        return (query if isinstance(query, str) else None), tags

    def _normalize_dimension_tag(
        self,
        tag: dict[str, Any],
        database_id: int | None,
    ) -> dict[str, Any]:
        """
        Normalize a dimension-type tag's field reference, and attach a portable field_ref.

        A `dimension` tag's field reference comes back as `["field", <id>,
        <options>]` (classic) or `["field", <options>, <id>]` (newer pMBQL
        shape, with the id and options args swapped) depending on the
        instance's Metabase version -- the same drift `_native_query_and_tags`
        handles for the query/tags container itself. Only the classic
        ordering is valid inside the flat `native.template-tags` payload this
        format writes on restore; posting the pMBQL ordering back verbatim
        makes card creation fail.

        The field id itself is also Metabase-internal to the instance it was
        captured from, and isn't guaranteed to mean the same column (or even
        belong to the same database) on a different instance's own schema
        sync. A `field_ref` (schema/table/column name) is attached whenever
        it can be resolved, so `restore` can re-resolve the correct id for
        whichever instance it's writing to, instead of trusting the raw id
        across instances.
        """
        if tag.get("type") != "dimension":
            return tag
        dimension = tag.get("dimension")
        if (
            not isinstance(dimension, list)
            or len(dimension) != _FIELD_REF_LENGTH
            or dimension[0] != "field"
        ):
            return tag

        if isinstance(dimension[1], dict):
            options, field_id = dimension[1], dimension[2]
            classic_options = {
                key: value
                for key, value in options.items()
                if not key.startswith("lib/")
            }
            dimension = ["field", field_id, classic_options or None]
        else:
            field_id = dimension[1]

        normalized = dict(tag)
        normalized["dimension"] = dimension

        if database_id is None:
            return normalized
        field_ref = self._field_refs_for_database(database_id).get(field_id)
        if field_ref is None:
            logger.warning(
                "Could not resolve field id %s (dimension tag %r) to a table/column "
                "name -- restoring to a different instance may not find the same field.",
                field_id,
                tag.get("name"),
            )
            return normalized
        normalized["field_ref"] = field_ref
        return normalized

    def _field_refs_for_database(self, database_id: int) -> dict[int, dict[str, str]]:
        """
        Fetch (and cache) a database's field-id -> {schema, table, column} map.

        This API key may not have permission to browse a database's schema
        even though it can read/write cards and collections -- that's a
        missing *enrichment*, not a reason to fail the whole backup, so a
        permission error here degrades to "no field_ref for this database"
        the same way `_get_detail` already degrades on a 403.
        """
        if database_id not in self._field_ref_cache:
            url = f"{self.api_url}/database/{database_id}/metadata"
            try:
                response = self._requests.get(url, headers=self.headers, timeout=30)
                response.raise_for_status()
            except HTTPError as exc:
                if (
                    exc.response is not None
                    and exc.response.status_code == HTTP_FORBIDDEN
                ):
                    logger.warning(
                        "Permission denied (403) fetching schema metadata for "
                        "database %d -- dimension-type template tags will be "
                        "captured without a field_ref, so restoring them to a "
                        "different instance may not resolve correctly.",
                        database_id,
                    )
                else:
                    logger.exception(
                        "Error fetching schema metadata for database %d",
                        database_id,
                    )
                self._field_ref_cache[database_id] = {}
                return self._field_ref_cache[database_id]
            except RequestException:
                logger.exception(
                    "Error fetching schema metadata for database %d",
                    database_id,
                )
                self._field_ref_cache[database_id] = {}
                return self._field_ref_cache[database_id]

            tables = response.json().get("tables") or []
            refs = {
                field["id"]: {
                    "schema": table.get("schema"),
                    "table": table["name"],
                    "column": field["name"],
                }
                for table in tables
                for field in table.get("fields") or []
            }
            self._field_ref_cache[database_id] = refs
        return self._field_ref_cache[database_id]

    @staticmethod
    def _extract_query(query: str | None, card_id: int | None) -> str | None:
        """Sanity-check and format a card's native SQL query."""
        if not query or not isinstance(query, str):
            logger.warning("No valid query found for card %s", card_id)
            return None
        if not any(kw in query.lower() for kw in ("select", "from", "where")):
            logger.warning(
                "Query for card %s does not contain required SQL keywords",
                card_id,
            )
            return None
        # sqlparse's keyword_case="upper" reformatting can mis-uppercase an
        # identifier that happens to collide with a SQL keyword (e.g. "quad",
        # short for a date-part-like grouping label) even inside a {{...}}
        # placeholder -- silently breaking the tag-name match against this
        # card's own template_tags. Swap placeholders for safe tokens
        # before formatting and restore them verbatim afterward so their
        # text is never touched.
        placeholders = _TEMPLATE_PLACEHOLDER_PATTERN.findall(query)
        protected = query
        for i, placeholder in enumerate(placeholders):
            protected = protected.replace(placeholder, f"__template_tag_{i}__", 1)

        formatted: str = format_sql(protected, reindent=True, keyword_case="upper")

        for i, placeholder in enumerate(placeholders):
            formatted = formatted.replace(f"__template_tag_{i}__", placeholder, 1)
        return formatted

    @staticmethod
    def _rewrite_references(query: str, id_to_key: dict[int, str]) -> str:
        """
        Rewrite {{#<id>-<slug>}} to {{#restore:<key>}} for every known id.

        A reference to an id outside this backup (e.g. a personal/sample/
        archived card) is left untouched -- `_auto_template_tags` in
        `restore.py` already supports hardcoded external references like this.
        """

        def replace(match: re.Match) -> str:
            ref_id = int(match.group(1)[1:].split("-", 1)[0])
            if ref_id in id_to_key:
                return "{{#restore:" + id_to_key[ref_id] + "}}"
            return match.group(0)

        return CARD_TAG_PATTERN.sub(replace, query)

    def _assign_levels(
        self,
        resolved_cards: dict[str, dict[str, Any]],
    ) -> dict[str, int]:
        """
        Assign level_N so every question defaults to the deepest level.

        Only promoted to a lower level when another restore question actually
        depends on it. A card's own dependency count doesn't matter here --
        what matters is how many hops of *dependents* sit above it, computed
        by walking the reversed dependency graph. A standalone card with no
        dependents lands at the deepest level alongside everything else with
        nothing relying on it, even if it happens to have no dependencies of
        its own.
        """
        if not resolved_cards:
            return {}

        dependents: dict[str, list[str]] = {key: [] for key in resolved_cards}
        for key, card in resolved_cards.items():
            for dep in card["dependencies"]:
                if dep in dependents:
                    dependents[dep].append(key)

        depths: dict[str, int] = {}
        visiting: set[str] = set()

        def compute_depth(key: str) -> int:
            if key in depths:
                return depths[key]
            if key in visiting:
                cycle = " -> ".join([*visiting, key])
                message = (
                    f"Circular reference detected among restore questions: {cycle}"
                )
                raise RuntimeError(message)
            visiting.add(key)
            depth = 0
            for dependent in dependents[key]:
                depth = max(depth, compute_depth(dependent) + 1)
            visiting.discard(key)
            depths[key] = depth
            return depth

        for key in resolved_cards:
            compute_depth(key)

        max_depth = max(depths.values())
        return {key: max_depth - depth for key, depth in depths.items()}

    def _write_all_questions(
        self,
        resolved_cards: dict[str, dict[str, Any]],
        levels: dict[str, int],
        collection_of: dict[int, int],
        collection_folder: dict[int, str],
    ) -> None:
        """Write every resolved card's .sql + sidecar .json to level_N/<Collection>/."""
        for key, card in resolved_cards.items():
            folder = collection_folder[collection_of[card["id"]]]
            self._write_question(card, levels[key], folder)
        self.stats["questions_processed"] = len(resolved_cards)

    def _write_question(self, card: dict[str, Any], level: int, folder: str) -> None:
        """Write one card's .sql and sidecar .json file."""
        level_dir = self.output_dir / f"level_{level}" / folder
        level_dir.mkdir(parents=True, exist_ok=True)

        query = card["query"]
        if not query.endswith("\n"):
            query += "\n"
        (level_dir / f"{card['key']}.sql").write_text(query)

        metadata: dict[str, Any] = {
            "name": card["name"],
            "display": card["display"],
            "visualization_settings": card["visualization_settings"],
        }
        if card["description"]:
            metadata["description"] = card["description"]
        if card["template_tags"]:
            metadata["template_tags"] = card["template_tags"]
        if card["parameters"]:
            metadata["parameters"] = card["parameters"]

        (level_dir / f"{card['key']}.json").write_text(
            json.dumps(metadata, indent=2) + "\n",
        )

    def _write_all_dashboards(
        self,
        dashboards_summary: list[dict[str, Any]],
        id_to_key: dict[int, str],
        collection_of: dict[int, int],
        collection_folder: dict[int, str],
    ) -> None:
        """Fetch and write every dashboard to dashboards/<Collection>/."""
        processed = 0
        for item in dashboards_summary:
            folder = collection_folder[collection_of[item["id"]]]
            if self._write_dashboard(item["id"], id_to_key, folder):
                processed += 1
            else:
                self.stats["dashboards_skipped"] += 1
        self.stats["dashboards_processed"] = processed

    def _write_dashboard(
        self,
        dashboard_id: int,
        id_to_key: dict[int, str],
        folder: str,
    ) -> bool:
        """Fetch, resolve, and write one dashboard's restore-format .json file."""
        dashboard = self.get_dashboard_detail(dashboard_id)
        if dashboard is None:
            return False

        try:
            spec = self._resolve_dashboard(dashboard, id_to_key)
        except RuntimeError as exc:
            # A dashcard or filter references a card that isn't in this
            # backup -- most commonly a non-native question mixed onto an
            # otherwise-SQL dashboard. That's a real, expected occurrence,
            # not a reason to abort every other dashboard in the run. The
            # RuntimeError's own message already names the offending card,
            # so it's included as plain text rather than a full traceback
            # (exc_info=True), which reads like an unhandled crash even
            # though this is a deliberately handled, expected case.
            logger.warning(
                "Skipping dashboard %d (%r): %s",
                dashboard_id,
                dashboard.get("name"),
                exc,
            )
            return False

        dash_dir = self.output_dir / "dashboards" / folder
        dash_dir.mkdir(parents=True, exist_ok=True)
        key = clean_name(dashboard["name"])
        (dash_dir / f"{key}.json").write_text(json.dumps(spec, indent=2) + "\n")
        return True

    def _resolve_dashboard(
        self,
        dashboard: dict[str, Any],
        id_to_key: dict[int, str],
    ) -> dict[str, Any]:
        """Translate a live dashboard's API shape into the restore dashboard schema."""
        tabs = sorted(dashboard.get("tabs") or [], key=lambda t: t["position"])
        tab_id_to_name = {t["id"]: t["name"] for t in tabs}

        dashcards = sorted(
            dashboard["dashcards"],
            key=lambda dc: (
                tab_id_to_name.get(dc["dashboard_tab_id"], ""),
                dc["row"],
                dc["col"],
            ),
        )

        return {
            "name": dashboard["name"],
            "description": dashboard.get("description"),
            "width": dashboard.get("width", "fixed"),
            "auto_apply_filters": dashboard.get("auto_apply_filters", True),
            "parameters": [
                self._resolve_dashboard_parameter(p, id_to_key)
                for p in dashboard.get("parameters") or []
            ],
            "tabs": [t["name"] for t in tabs],
            "dashcards": [
                self._resolve_dashcard(dc, tab_id_to_name, id_to_key, dashboard["name"])
                for dc in dashcards
            ],
        }

    @staticmethod
    def _resolve_dashboard_parameter(
        param: dict[str, Any],
        id_to_key: dict[int, str],
    ) -> dict[str, Any]:
        """Translate one dashboard-level filter parameter, resolving its card source."""
        entry: dict[str, Any] = {
            "id": param["id"],
            "slug": param["slug"],
            "name": param["name"],
            "type": param["type"],
            "sectionId": param.get("sectionId"),
            "isMultiSelect": param.get("isMultiSelect", False),
            "required": param.get("required", False),
        }
        if param.get("default") is not None:
            entry["default"] = param["default"]
        if param.get("values_source_type") == "card":
            source_config = param["values_source_config"]
            card_id = source_config["card_id"]
            if card_id not in id_to_key:
                message = (
                    f"Parameter '{param['name']}' sources its values from card id "
                    f"{card_id}, which isn't in any backed-up collection "
                    "(excluded/personal/archived?)."
                )
                raise RuntimeError(message)
            entry["values_source_type"] = "card"
            entry["values_source_config"] = {
                "card": id_to_key[card_id],
                "value_field": source_config["value_field"],
            }
        return entry

    def _resolve_dashcard(
        self,
        dashcard: dict[str, Any],
        tab_id_to_name: dict[int, str],
        id_to_key: dict[int, str],
        dashboard_name: str,
    ) -> dict[str, Any]:
        """Translate one dashcard, resolving its card reference (or virtual/text content)."""
        entry: dict[str, Any] = {
            "tab": tab_id_to_name.get(dashcard["dashboard_tab_id"]),
            "col": dashcard["col"],
            "row": dashcard["row"],
            "size_x": dashcard["size_x"],
            "size_y": dashcard["size_y"],
        }

        visualization_settings = dict(dashcard.get("visualization_settings") or {})
        card_id = dashcard.get("card_id")
        if card_id is not None:
            if card_id not in id_to_key:
                message = (
                    f"Dashboard '{dashboard_name}' has a dashcard referencing card id "
                    f"{card_id}, which isn't in any backed-up collection "
                    "(excluded/personal/archived?)."
                )
                raise RuntimeError(message)
            entry["card"] = id_to_key[card_id]
        else:
            entry["text"] = visualization_settings.pop("text", "")
            visualization_settings.pop("virtual_card", None)

        if visualization_settings:
            entry["visualization_settings"] = visualization_settings

        mappings = dashcard.get("parameter_mappings") or []
        if mappings:
            entry["parameter_mappings"] = [
                self._resolve_parameter_mapping(m) for m in mappings
            ]

        return entry

    @staticmethod
    def _resolve_parameter_mapping(mapping: dict[str, Any]) -> dict[str, Any]:
        """Translate one dashcard parameter_mapping back into {parameter, target_tag}."""
        target = mapping["target"]
        if target[0] == "dimension":
            tag_name = target[1][1]
        elif target[0] == "text-tag":
            tag_name = target[1]
        else:
            message = f"Unexpected dashcard parameter target shape: {target!r}"
            raise RuntimeError(message)
        return {"parameter": mapping["parameter_id"], "target_tag": tag_name}

    def _snapshot_output_tree(self) -> dict[str, str]:
        """Map relative path -> content hash for everything under level_*/ and dashboards/."""
        snapshot = {}
        for pattern in ("level_*/**/*", "dashboards/**/*"):
            for path in self.output_dir.glob(pattern):
                if path.is_file():
                    rel = str(path.relative_to(self.output_dir))
                    snapshot[rel] = hashlib.sha256(path.read_bytes()).hexdigest()
        return snapshot

    def _wipe_output_tree(self) -> None:
        """
        Remove level_*/ and dashboards/ under output_dir (leaving other files alone).

        Level assignment can shift between runs as the dependency graph
        changes, so files can't just be updated in place -- rebuild the
        whole tree fresh each time instead.
        """
        for level_dir in self.output_dir.glob("level_*"):
            if level_dir.is_dir():
                shutil.rmtree(level_dir)
        dashboards_dir = self.output_dir / "dashboards"
        if dashboards_dir.is_dir():
            shutil.rmtree(dashboards_dir)

    def _record_changes(self, before: dict[str, str], after: dict[str, str]) -> None:
        """Diff two path->hash snapshots into added/removed/modified counts."""
        added = set(after) - set(before)
        removed = set(before) - set(after)
        common = set(after) & set(before)
        modified = {path for path in common if after[path] != before[path]}
        self.stats["files_added"] = len(added)
        self.stats["files_removed"] = len(removed)
        self.stats["files_modified"] = len(modified)

    def write_changelog(self) -> None:
        """Write a changelog entry with backup statistics."""
        logger.info("Collections processed: %d", self.stats["collections_processed"])
        logger.info("Questions processed: %d", self.stats["questions_processed"])
        logger.info("Questions skipped: %d", self.stats["questions_skipped"])
        logger.info("Dashboards processed: %d", self.stats["dashboards_processed"])
        logger.info("Dashboards skipped: %d", self.stats["dashboards_skipped"])
        logger.info("Files added: %d", self.stats["files_added"])
        logger.info("Files modified: %d", self.stats["files_modified"])
        logger.info("Files removed: %d", self.stats["files_removed"])

        timestamp = datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S")
        log_entry = (
            f"\n=== Backup completed at {timestamp} ===\n"
            f"Collections processed: {self.stats['collections_processed']}\n"
            f"Questions processed: {self.stats['questions_processed']}\n"
            f"Questions skipped: {self.stats['questions_skipped']}\n"
            f"Dashboards processed: {self.stats['dashboards_processed']}\n"
            f"Dashboards skipped: {self.stats['dashboards_skipped']}\n"
            f"Files added: {self.stats['files_added']}\n"
            f"Files modified: {self.stats['files_modified']}\n"
            f"Files removed: {self.stats['files_removed']}\n"
            "================================\n"
        )

        changelog_path = self.output_dir / "CHANGELOG.txt"
        if not changelog_path.exists():
            changelog_path.write_text("")
            logger.info("Created new changelog file")

        current_content = changelog_path.read_text()
        changelog_path.write_text(log_entry + current_content)
