"""
Metabase backup functionality.

This module provides functionality to backup Metabase queries by:
1. Fetching all collections
2. Getting items in each collection
3. Retrieving query details for each item
4. Writing the queries to local filesystem in a structured format
"""

import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests
from requests.exceptions import HTTPError, RequestException
from sqlparse import format as format_sql

logger = logging.getLogger(__name__)

# Constants
HTTP_FORBIDDEN = 403


class MetabaseBackup:
    """Back up Metabase queries to local filesystem."""

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
        self.headers = {"x-api-key": api_key}
        self._requests = requests
        self.stats = self._init_stats()
        self.collections: list[dict[str, Any]] = []

        # Ensure output directory exists
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def _init_stats(self) -> dict[str, int]:
        """
        Init dictionary of stats to collect.

        Returns:
            Dictionary with initialized stats.

        """
        return {
            "total_items": 0,
            "total_collections": 0,
            "items_with_queries": 0,
            "items_with_diffs": 0,
            "items_skipped": 0,
            "folders_renamed": 0,
            "files_renamed": 0,
            "files_updated": 0,
        }

    def clean_name(self, name: str) -> str:
        """
        Clean a name for use in filenames.

        Args:
            name: Name to clean.

        Returns:
            Cleaned name with special characters replaced by underscores.

        """
        # Replace whitespace and special characters with underscores
        cleaned = ""
        for c in name:
            if c.isalnum():
                cleaned += c
            else:
                # Only add underscore if the last character isn't already an underscore
                if not cleaned or cleaned[-1] != "_":
                    cleaned += "_"
        return cleaned.strip("_")  # Remove trailing underscores

    def backup(self) -> None:
        """Backup all Metabase queries to local filesystem."""
        # Reset stats
        self.stats = self._init_stats()

        # Get all collections
        self.collections = self.get_collections()
        self.stats["total_collections"] = len(self.collections)
        logger.info("Found %d collections", len(self.collections))

        # Process each collection
        for collection in self.collections:
            collection_id = collection["id"]
            collection_name = collection["name"]
            logger.info(
                "Processing collection %d (%s)",
                collection_id,
                collection_name,
            )

            try:
                # Create collection directory
                collection_dir = self.create_collection_dir(collection)

                # Get items in collection
                items = self.get_items(collection_id)
                self.stats["total_items"] += len(items)
                logger.info(
                    "Found %d items in collection %d (%s)",
                    len(items),
                    collection_id,
                    collection_name,
                )

                # Process each item
                for item in items:
                    self.process_item(item, collection_dir)

            except (OSError, RequestException):
                logger.exception(
                    "Error processing collection %d (%s)",
                    collection_id,
                    collection_name,
                )
                self.stats["items_skipped"] += len(items)

        # Log final stats
        logger.info("Done processing %d collections", self.stats["total_collections"])
        self.write_changelog()

    def get_collections(self) -> list[dict[str, Any]]:
        """
        Get all available collections from Metabase.

        Returns:
            List of collection objects with id, name, and location.

        """
        url = f"{self.api_url}/collection/?exclude-other-user-collections=true"
        response = self._requests.get(url, headers=self.headers, timeout=30)
        response.raise_for_status()

        collections = []
        for collection in response.json():
            # Skip personal, sample, or archived collections
            if (
                collection.get("is_personal")
                or collection.get("is_sample")
                or collection.get("archived")
            ):
                continue

            # Ensure required fields exist
            if all(field in collection for field in ["id", "name", "location"]):
                collections.append(collection)

        return collections

    def create_collection_dir(self, collection: dict[str, Any]) -> Path:
        """
        Create a directory for a collection or rename existing dir as necessary.

        Args:
            collection: Collection object with id, name, and location.

        Returns:
            Path to the collection directory.

        """
        # Get the collection path
        collection_path = self.get_collection_path(collection)

        # Split the path into segments
        path_parts = list(collection_path.parts)
        output_dir_parts = list(self.output_dir.parts)

        # Start from the output directory
        current_path = self.output_dir

        # Process each segment after the output directory
        for i in range(len(output_dir_parts), len(path_parts)):
            segment = path_parts[i]
            segment_id = segment.split("-")[0]

            # Check if a directory with the same ID prefix exists
            existing_dirs = list(current_path.glob(f"{segment_id}-*"))

            # If found and it's not the same as our target segment, rename it
            if existing_dirs and existing_dirs[0].name != segment:
                old_dir = existing_dirs[0]
                new_dir = current_path / segment

                # Rename the directory
                old_dir.rename(new_dir)
                self.stats["folders_renamed"] += 1
                logger.info(
                    "Renamed directory from '%s' to '%s'",
                    old_dir.name,
                    new_dir.name,
                )

            # Update the current path
            current_path = current_path / segment

            # Create the directory if it doesn't exist
            current_path.mkdir(parents=True, exist_ok=True)

        return collection_path

    def get_collection_path(self, collection: dict[str, Any]) -> Path:
        """
        Create a path for a collection.

        Args:
            collection: Collection object with id, name, and location.

        Returns:
            Path to the collection directory.

        """
        # Get the collection's location path
        location = collection.get("location", "")

        # For root collections, just use the collection name
        if not location:
            return (
                self.output_dir
                / f"{collection['id']}-{self.clean_name(collection['name'])}"
            )

        # For collections with a location, we need to handle the hierarchy
        # The location is a path like "/123/456" where each number is a collection ID
        # First, a map of collection IDs and names
        collection_map = {str(c["id"]): c["name"] for c in self.collections}

        # Split the location path into parts and remove the leading slash
        parts = [p for p in location.strip("/").split("/") if p]

        # Build the path
        path = self.output_dir
        for part in parts:
            if part in collection_map:
                # Use the actual collection name from our map
                name = collection_map[part]
                path = path / f"{part}-{self.clean_name(name)}"
            else:
                # If we can't find the collection name, use a generic name
                path = path / f"{part}-Unknown"

        # Add the current collection to the path
        return path / f"{collection['id']}-{self.clean_name(collection['name'])}"

    def get_items(self, collection_id: int) -> list[dict[str, Any]]:
        """
        Get all items in a collection.

        Args:
            collection_id: ID of the collection to get.

        Returns:
            List of item objects with id and name.

        """
        url = f"{self.api_url}/collection/{collection_id}/items"
        response = self._requests.get(url, headers=self.headers, timeout=30)
        response.raise_for_status()

        # The API returns items in a nested 'data' field
        items = []
        for item in response.json().get("data", []):
            # Ignore item if it is not of type card
            if item.get("model") == "card" and all(
                field in item for field in ["id", "name"]
            ):
                items.append(item)
            else:
                logger.debug(
                    "Skipping non-card item: %s (model: %s)",
                    item.get("name"),
                    item.get("model"),
                )

        return items

    def process_item(self, item: dict[str, Any], collection_dir: Path) -> None:
        """
        Process a single item from a collection.

        Args:
            item: The item to process.
            collection_dir: The directory to write the item to.

        """
        # Get details about card including embedded sql
        query = self.get_item_sql(item["id"])
        if not query:
            self.stats["items_skipped"] += 1
            return

        self.stats["items_with_queries"] += 1

        # Define path of local file to which we will write sql
        new_filename = f"{item['id']}-{self.clean_name(item['name'])}.sql"
        new_filepath = collection_dir / new_filename

        # Check if a file with this ID already exists (regardless of name)
        existing_files = list(collection_dir.glob(f"{item['id']}-*.sql"))

        # If no existing file with this ID, create a new one and return
        if not existing_files:
            new_filepath.write_text(query)
            self.stats["items_with_diffs"] += 1
            self.stats["files_updated"] += 1
            logger.info(
                "Found diffs in query for item %d (%s)",
                item["id"],
                item["name"],
            )
            return

        # Found an existing file with the same ID, read it
        existing_file = existing_files[0]
        current_query = existing_file.read_text()

        # Has the sql changed?
        if current_query != query:
            # Update the file with the new sql
            existing_file.write_text(query)
            self.stats["items_with_diffs"] += 1
            self.stats["files_updated"] += 1
            logger.info(
                "Found diffs in query for item %d (%s)",
                item["id"],
                item["name"],
            )

        # Has the filename changed?
        if existing_file.name != new_filename:
            # Rename the file to match the new name
            existing_file.rename(new_filepath)
            self.stats["files_renamed"] += 1
            logger.info(
                "Renamed file for item %d from '%s' to '%s'",
                item["id"],
                existing_file.name,
                new_filename,
            )

    def get_item_sql(self, item_id: int) -> str | None:
        """
        Get the SQL query for an item.

        Args:
            item_id: ID of the item to get.

        Returns:
            SQL query string if found and valid, None otherwise.

        """
        url = f"{self.api_url}/card/{item_id}"
        try:
            response = self._requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()

            # Extract sql from the dataset_query field
            data = response.json()
            dataset_query = data.get("dataset_query", {})
            query = dataset_query.get("native", {}).get("query")

            if not query or not isinstance(query, str):
                logger.warning("No valid query found for item %d", item_id)
                return None

            # Basic sanity check for SQL
            if not any(
                keyword.lower() in query.lower()
                for keyword in ["select", "from", "where"]
            ):
                logger.warning(
                    "Query for item %d does not contain required SQL keywords",
                    item_id,
                )
                return None

            return format_sql(query, reindent=True, keyword_case="upper")

        except HTTPError as e:
            if e.response.status_code == HTTP_FORBIDDEN:
                logger.warning(
                    "Permission denied (403) for item %d. Skipping.",
                    item_id,
                )
                return None
            logger.exception("Error getting query for item %d", item_id)
            return None

        except RequestException:
            logger.exception("Error getting query for item %d", item_id)
            return None

    def write_changelog(self) -> None:
        """Write a changelog entry with backup statistics."""
        logger.info("Total items processed: %d", self.stats["total_items"])
        logger.info("Items with queries: %d", self.stats["items_with_queries"])
        logger.info("Items skipped: %d", self.stats["items_skipped"])
        logger.info("Items with diffs: %d", self.stats["items_with_diffs"])
        logger.info("Folders renamed: %d", self.stats["folders_renamed"])
        logger.info("Files updated: %d", self.stats["files_updated"])
        logger.info("Files renamed: %d", self.stats["files_renamed"])

        # Write changelog
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        log_entry = (
            f"\n=== Backup completed at {timestamp} ===\n"
            f"Collections processed: {self.stats['total_collections']}\n"
            f"Items processed: {self.stats['total_items']}\n"
            f"Folders renamed: {self.stats['folders_renamed']}\n"
            f"Files updated: {self.stats['files_updated']}\n"
            f"Files renamed: {self.stats['files_renamed']}\n"
            f"Errors encountered: {self.stats['items_skipped']}\n"
            "================================\n"
        )

        # Create the file if it doesn't exist
        changelog_path = self.output_dir / "CHANGELOG.txt"
        if not changelog_path.exists():
            changelog_path.write_text("")
            logger.info("Created new changelog file")

        # Append the new entry to the existing content
        current_content = changelog_path.read_text()
        changelog_path.write_text(log_entry + current_content)
