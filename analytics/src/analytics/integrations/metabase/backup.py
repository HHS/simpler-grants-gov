"""
Metabase backup functionality.

This module provides functionality to backup Metabase queries by:
1. Fetching all collections
2. Getting items in each collection
3. Retrieving query details for each item
4. Writing the queries to disk in a structured format
"""

import os
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import requests
from requests.exceptions import HTTPError, RequestException
from sqlparse import format as format_sql

logger = logging.getLogger(__name__)


class MetabaseBackup:
    """Handles backing up Metabase queries to disk."""

    def __init__(self, api_url: str, api_key: str, output_dir: str):
        """Initialize the Metabase backup handler.

        Args:
            api_url: Base URL for the Metabase API
            api_key: API key for authentication
            output_dir: Directory to write backup files to
        """
        self.api_url = api_url.rstrip("/")
        self.api_key = api_key
        self.output_dir = Path(output_dir)
        self.headers = {"x-api-key": api_key}
        self._requests = requests

        # Ensure output directory exists
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def _clean_name(self, name: str) -> str:
        """Clean a name for use in filenames.

        Args:
            name: Name to clean

        Returns:
            Cleaned name with special characters replaced by underscores
        """
        # Replace whitespace and special characters with underscores
        cleaned = ""
        for c in name:
            if c.isalnum():
                cleaned += c
            elif c in "<>":  # Handle angle brackets specially
                cleaned += "_"
            else:
                cleaned += "_"
        return cleaned.strip("_")  # Remove trailing underscores

    def get_collections(self) -> List[Dict]:
        """Get all available collections from Metabase.

        Returns:
            List of collection objects with id, name, and location
        """
        url = f"{self.api_url}/collection/?exclude-other-user-collections=true"
        response = self._requests.get(url, headers=self.headers)
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

    def get_collection_items(self, collection_id: int) -> List[Dict]:
        """Get all items in a collection.

        Args:
            collection_id: ID of the collection to get items from

        Returns:
            List of item objects with id and name
        """
        url = f"{self.api_url}/collection/{collection_id}/items"
        response = self._requests.get(url, headers=self.headers)
        response.raise_for_status()

        # The API returns items in a nested 'data' field
        items = []
        for item in response.json().get("data", []):
            # Only process items with model="card"
            if item.get("model") == "card" and all(
                field in item for field in ["id", "name"]
            ):
                items.append(item)
            else:
                logger.debug(
                    f"Skipping non-card item: {item.get('name')} (model: {item.get('model')})"
                )

        return items

    def get_item_query(self, item_id: int) -> Optional[str]:
        """Get the SQL query for an item.

        Args:
            item_id: ID of the item to get query from

        Returns:
            SQL query string if found and valid, None otherwise
        """
        url = f"{self.api_url}/card/{item_id}"
        try:
            response = self._requests.get(url, headers=self.headers)
            response.raise_for_status()

            # The query is nested in the dataset_query field
            data = response.json()
            dataset_query = data.get("dataset_query", {})
            query = dataset_query.get("native", {}).get("query")

            if not query or not isinstance(query, str):
                logger.warning(f"No valid query found for item {item_id}")
                return None

            # Basic sanity check for SQL
            if not any(
                keyword.lower() in query.lower()
                for keyword in ["select", "from", "where"]
            ):
                logger.warning(
                    f"Query for item {item_id} does not contain required SQL keywords"
                )
                return None

            return query
        except HTTPError as e:
            if e.response.status_code == 403:
                logger.warning(f"Permission denied (403) for item {item_id}. Skipping.")
                return None
            logger.error(f"Error getting query for item {item_id}: {str(e)}")
            return None
        except RequestException as e:
            logger.error(f"Error getting query for item {item_id}: {str(e)}")
            return None

    def write_query_to_file(
        self, collection_path: Path, item_id: int, item_name: str, query: str
    ) -> bool:
        """Write a query to a file, only if the content has changed.

        Args:
            collection_path: Path to the collection directory
            item_id: ID of the item
            item_name: Name of the item
            query: SQL query to write

        Returns:
            True if file was written, False if content was unchanged
        """
        # Create collection directory if it doesn't exist
        collection_path.mkdir(parents=True, exist_ok=True)

        # Format the query for readability
        formatted_query = format_sql(query, reindent=True, keyword_case="upper")

        # Create filename
        clean_name = self._clean_name(item_name)
        filename = f"{item_id}-{clean_name}.sql"
        filepath = collection_path / filename

        # Check if file exists and content is different
        if filepath.exists():
            current_content = filepath.read_text()
            if current_content == formatted_query:
                return False

        # Write the file
        filepath.write_text(formatted_query)
        return True

    def create_collection_path(self, collection: Dict) -> Path:
        """Create a path for a collection.

        Args:
            collection: Collection object with id, name, and location

        Returns:
            Path to the collection directory
        """
        # Get the collection's location path
        location = collection.get("location", "")

        # For root collections, just use the collection name
        if not location:
            return (
                self.output_dir
                / f"{collection['id']}-{self._clean_name(collection['name'])}"
            )

        # For collections with a location, we need to handle the hierarchy
        # The location is a path like "/123/456" where each number is a collection ID

        # First, get all collections to build a map of IDs to names
        collections = self.get_collections()
        collection_map = {str(c["id"]): c["name"] for c in collections}

        # Split the location path into parts and remove the leading slash
        parts = [p for p in location.strip("/").split("/") if p]

        # Build the path
        path = self.output_dir
        for part in parts:
            if part in collection_map:
                # Use the actual collection name from our map
                name = collection_map[part]
                path = path / f"{part}-{self._clean_name(name)}"
            else:
                # If we can't find the collection name, use a generic name
                path = path / f"{part}-Collection_{part}"

        # Add the current collection to the path
        return path / f"{collection['id']}-{self._clean_name(collection['name'])}"

    def write_changelog(self, stats: Dict) -> None:
        """Write a changelog entry with backup statistics.

        Args:
            stats: Dictionary containing backup statistics
        """
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = (
            f"\n=== Backup completed at {timestamp} ===\n"
            f"Collections processed: {stats['collections']}\n"
            f"Items processed: {stats['items']}\n"
            f"Files changed: {stats['changed_files']}\n"
            f"Renamed files: {stats['renamed_files']}\n"
            f"Errors encountered: {stats['errors']}\n"
            "================================\n"
        )

        changelog_path = self.output_dir / "CHANGELOG.txt"

        # Create the file if it doesn't exist
        if not changelog_path.exists():
            changelog_path.write_text("")
            logger.info("Created new changelog file")

        # Append the new entry to the existing content
        current_content = changelog_path.read_text()
        changelog_path.write_text(log_entry + current_content)

    def backup(self) -> None:
        """Backup all Metabase queries to disk."""
        try:
            # Get all collections
            collections = self.get_collections()
            logger.info(f"Found {len(collections)} collections")

            # Track stats
            total_items = 0
            items_with_queries = 0
            items_with_diffs = 0
            items_skipped = 0
            items_renamed = 0

            # Process each collection
            for collection in collections:
                collection_id = collection["id"]
                collection_name = collection["name"]
                logger.info(
                    f"Processing collection {collection_id} ({collection_name})"
                )

                try:
                    # Get items in collection
                    items = self.get_collection_items(collection_id)
                    total_items += len(items)
                    logger.info(
                        f"Found {len(items)} items in collection {collection_id} ({collection_name})"
                    )

                    # Create collection directory
                    collection_dir = self.create_collection_path(collection)
                    collection_dir.mkdir(parents=True, exist_ok=True)

                    # Process each item
                    for item in items:
                        try:
                            # Get query for item
                            query = self.get_item_query(item["id"])
                            if query:
                                items_with_queries += 1

                                # Create the new filename
                                new_filename = (
                                    f"{item['id']}-{self._clean_name(item['name'])}.sql"
                                )
                                new_filepath = collection_dir / new_filename

                                # Check if a file with this ID already exists (regardless of name)
                                existing_files = list(
                                    collection_dir.glob(f"{item['id']}-*.sql")
                                )

                                if existing_files:
                                    # Found an existing file with the same ID
                                    existing_file = existing_files[0]

                                    # Check if the filename has changed
                                    if existing_file.name != new_filename:
                                        # Read the current query from the existing file
                                        current_query = existing_file.read_text()

                                        # Update the file with the new query
                                        existing_file.write_text(query)

                                        # Rename the file to match the new name
                                        existing_file.rename(new_filepath)
                                        items_renamed += 1
                                        logger.info(
                                            f"Renamed file for item {item['id']} from '{existing_file.name}' to '{new_filename}'"
                                        )

                                        # Check if the query content has changed
                                        if current_query != query:
                                            items_with_diffs += 1
                                            logger.info(
                                                f"Found diffs in query for item {item['id']} ({item['name']})"
                                            )
                                    else:
                                        # Same filename, just check if content has changed
                                        current_query = existing_file.read_text()
                                        if current_query != query:
                                            existing_file.write_text(query)
                                            items_with_diffs += 1
                                            logger.info(
                                                f"Found diffs in query for item {item['id']} ({item['name']})"
                                            )
                                else:
                                    # No existing file with this ID, create a new one
                                    new_filepath.write_text(query)
                                    items_with_diffs += 1
                                    logger.info(
                                        f"Found diffs in query for item {item['id']} ({item['name']})"
                                    )
                            else:
                                items_skipped += 1
                                logger.warning(
                                    f"No valid query found for item {item['id']} ({item['name']})"
                                )

                        except (IOError, RequestException) as e:
                            logger.error(
                                f"Error processing item {item['id']} ({item['name']}): {str(e)}"
                            )
                            items_skipped += 1

                except (IOError, RequestException) as e:
                    logger.error(
                        f"Error processing collection {collection_id} ({collection_name}): {str(e)}"
                    )
                    items_skipped += len(items)

            # Log final stats
            logger.info(f"Done processing {len(collections)} collections")
            logger.info(f"Total items processed: {total_items}")
            logger.info(f"Items with queries: {items_with_queries}")
            logger.info(f"Items with diffs: {items_with_diffs}")
            logger.info(f"Items renamed: {items_renamed}")
            logger.info(f"Items skipped: {items_skipped}")

            # Write changelog
            stats = {
                "collections": len(collections),
                "items": total_items,
                "changed_files": items_with_diffs,
                "renamed_files": items_renamed,
                "errors": items_skipped,
            }
            self.write_changelog(stats)

            logger.info("Done")

        except Exception as e:
            logger.error(f"Backup failed: {str(e)}")
            raise
