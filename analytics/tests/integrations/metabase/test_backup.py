"""Unit tests for Metabase backup functionality."""

from pathlib import Path
from typing import Any
from unittest.mock import MagicMock, patch

import pytest
import requests
from requests.exceptions import RequestException
from sqlparse import format as format_sql

from analytics.integrations.metabase.backup import MetabaseBackup


@pytest.fixture(name="mock_response")
def _mock_response() -> MagicMock:
    """Mock response object for testing."""
    mock_resp = MagicMock(spec=requests.Response)
    mock_resp.raise_for_status = MagicMock()
    return mock_resp


@pytest.fixture(name="mock_response_2")
def _mock_response_2() -> MagicMock:
    """Mock response object for testing."""
    mock_resp = MagicMock(spec=requests.Response)
    mock_resp.raise_for_status = MagicMock()
    return mock_resp


@pytest.fixture(name="metabase_backup_fixture")
def _metabase_backup_fixture(tmp_path: Path) -> MetabaseBackup:
    """Create a MetabaseBackup instance with a temporary output directory."""
    with patch("analytics.integrations.metabase.backup.requests") as mock_requests:
        backup = MetabaseBackup(
            api_url="http://metabase.example.com/api",
            api_key="test-key",
            output_dir=str(tmp_path),
        )
        # pylint: disable=protected-access
        backup._requests = mock_requests
        yield backup


@pytest.fixture(name="backup_instance")
def _backup_instance(tmp_path: Path) -> MetabaseBackup:
    """Create a MetabaseBackup instance for testing."""
    backup = MetabaseBackup(
        api_url="http://metabase.example.com/api",
        api_key="test-key",
        output_dir=tmp_path,
    )
    mock_requests = MagicMock()
    # pylint: disable=protected-access
    backup._requests = mock_requests
    return backup


@pytest.fixture(name="collection_data")
def _collection_data() -> list[dict[str, Any]]:
    """Mock collection data."""
    return [
        {
            "id": 1,
            "name": "Collection 1",
            "location": "/1",
            "is_personal": False,
            "is_sample": False,
            "archived": False,
        },
        {
            "id": 2,
            "name": "Collection 2",
            "location": "/1/2",
            "is_personal": False,
            "is_sample": False,
            "archived": False,
        },
        {
            "id": 3,
            "name": "Collection 3",
            "location": "",
            "is_personal": False,
            "is_sample": False,
            "archived": False,
        },  # Root level collection
        {
            "id": 4,
            "name": "Collection 4",
            "location": "/1/2/4",
            "is_personal": False,
            "is_sample": False,
            "archived": False,
        },
        {
            "id": 5,
            "name": "Collection 5",
            "location": "/invalid/5",
            "is_personal": False,
            "is_sample": False,
            "archived": False,
        },  # Invalid parent
    ]


@pytest.fixture(name="item_data")
def _item_data() -> list[dict[str, Any]]:
    """Mock item data with different model types."""
    return [
        {"id": 101, "name": "Query 1", "model": "card"},
        {"id": 102, "name": "Query 2", "model": "card"},
        {"id": 103, "name": "Dashboard 1", "model": "dashboard"},
        {"id": 104, "name": "Collection 1", "model": "collection"},
    ]


@pytest.fixture(name="sql_query")
def _sql_query() -> str:
    """Mock SQL query data."""
    return "SELECT * FROM table WHERE condition = true"


@pytest.fixture(name="invalid_sql")
def _invalid_sql() -> str:
    """Mock invalid SQL query data."""
    return "This is not a SQL query"


@pytest.fixture(name="test_response")
def _test_response() -> MagicMock:
    """Mock response object for testing."""
    mock_resp = MagicMock(spec=requests.Response)
    mock_resp.raise_for_status = MagicMock()
    return mock_resp


def test_clean_name(backup_instance: MetabaseBackup) -> None:
    """Test cleaning collection and item names."""
    assert backup_instance.clean_name("Test Collection") == "Test_Collection"
    assert backup_instance.clean_name("Test/Collection") == "Test_Collection"
    assert backup_instance.clean_name("Test\\Collection") == "Test_Collection"
    assert backup_instance.clean_name("Test:Collection") == "Test_Collection"
    assert backup_instance.clean_name("Test?Collection") == "Test_Collection"
    assert backup_instance.clean_name("Test*Collection") == "Test_Collection"
    assert backup_instance.clean_name("Test|Collection") == "Test_Collection"
    assert backup_instance.clean_name('Test"Collection') == "Test_Collection"
    assert backup_instance.clean_name("Test<Collection>") == "Test_Collection"
    assert backup_instance.clean_name("Test>Collection") == "Test_Collection"
    assert backup_instance.clean_name("Test Collection ") == "Test_Collection"
    assert backup_instance.clean_name(" Test Collection") == "Test_Collection"
    assert backup_instance.clean_name("Test  Collection") == "Test_Collection"


def test_get_collections(
    backup_instance: MetabaseBackup,
    collection_data: list[dict[str, Any]],
) -> None:
    """Test getting collections from Metabase."""
    response = MagicMock(spec=requests.Response)
    response.json.return_value = collection_data
    response.raise_for_status.return_value = None
    # pylint: disable=protected-access
    backup_instance._requests.get.return_value = response

    result = backup_instance.get_collections()

    assert len(result) == 5
    assert result[0]["id"] == 1
    assert result[0]["name"] == "Collection 1"
    # pylint: disable=protected-access
    backup_instance._requests.get.assert_called_once_with(
        "http://metabase.example.com/api/collection/?exclude-other-user-collections=true",
        headers=backup_instance.headers,
        timeout=30,
    )


def test_get_collections_error(backup_instance: MetabaseBackup) -> None:
    """Test error handling when getting collections."""
    # pylint: disable=protected-access
    backup_instance._requests.get.side_effect = RequestException(
        "API Error",
    )

    with pytest.raises(RequestException):
        backup_instance.get_collections()


def test_get_items(
    backup_instance: MetabaseBackup,
    collection_data: list[dict[str, Any]],
    item_data: list[dict[str, Any]],
) -> None:
    """Test getting collection items."""
    # Mock the API response
    response = MagicMock(spec=requests.Response)
    response.json.return_value = {"data": item_data}
    response.raise_for_status.return_value = None
    # pylint: disable=protected-access
    backup_instance._requests.get.return_value = response

    # Test getting items for a collection
    result = backup_instance.get_items(collection_data[0]["id"])
    assert len(result) == 2  # Only card items are returned
    assert result[0]["id"] == 101
    assert result[1]["id"] == 102

    # Test getting items for a collection with no items
    response.json.return_value = {"data": []}
    result = backup_instance.get_items(collection_data[1]["id"])
    assert len(result) == 0

    # Test API error - this will raise an exception as the implementation doesn't handle it
    # pylint: disable=protected-access
    backup_instance._requests.get.side_effect = Exception("API Error")

    # We expect this to raise an exception
    with pytest.raises(Exception, match="API Error"):
        backup_instance.get_items(collection_data[2]["id"])


def test_get_item_sql(
    backup_instance: MetabaseBackup, test_response: MagicMock,
) -> None:
    """Test getting query from an item."""
    # Test valid SQL query
    test_response.json.return_value = {
        "dataset_query": {"native": {"query": "SELECT * FROM table WHERE id = 1"}},
    }

    # pylint: disable=protected-access
    backup_instance._requests.get = MagicMock(return_value=test_response)
    sql_query = backup_instance.get_item_sql(1)

    # The implementation formats the SQL with sqlparse, so we need to compare with the
    # formatted version
    expected_formatted_query = format_sql(
        "SELECT * FROM table WHERE id = 1",
        reindent=True,
        keyword_case="upper",
    )
    assert sql_query == expected_formatted_query

    # Test invalid query (not SQL)
    test_response.json.return_value = {
        "dataset_query": {"native": {"query": "not a sql query"}},
    }

    sql_query = backup_instance.get_item_sql(1)
    assert sql_query is None

    # Test missing query
    test_response.json.return_value = {}

    sql_query = backup_instance.get_item_sql(1)
    assert sql_query is None


def test_process_item(backup_instance: MetabaseBackup, tmp_path: Path) -> None:
    """Test processing a single item."""
    collection_path = tmp_path / "test_collection"
    collection_path.mkdir(parents=True, exist_ok=True)

    item = {"id": 1, "name": "Test Item"}
    sql_query = "SELECT * FROM table WHERE id = 1"

    # Mock get_item_sql to return our query
    backup_instance.get_item_sql = MagicMock(return_value=sql_query)

    # Process the item
    backup_instance.process_item(item, collection_path)

    # Verify file was created with formatted SQL
    file_path = collection_path / f"{item['id']}-Test_Item.sql"
    assert file_path.exists()
    assert file_path.read_text() == sql_query

    # Verify stats were updated
    assert backup_instance.stats["items_with_queries"] == 1
    assert backup_instance.stats["items_with_diffs"] == 1
    assert backup_instance.stats["files_updated"] == 1

    # Test processing the same item again (should not change stats)
    backup_instance.process_item(item, collection_path)
    assert backup_instance.stats["items_with_queries"] == 2
    assert backup_instance.stats["items_with_diffs"] == 1  # No change
    assert backup_instance.stats["files_updated"] == 1  # No change

    # Test processing an item with a different query
    new_query = "SELECT * FROM table WHERE id = 2"
    backup_instance.get_item_sql = MagicMock(return_value=new_query)
    backup_instance.process_item(item, collection_path)
    assert backup_instance.stats["items_with_queries"] == 3
    assert backup_instance.stats["items_with_diffs"] == 2  # Incremented
    assert backup_instance.stats["files_updated"] == 2  # Incremented

    # Test processing an item with a different name
    renamed_item = {"id": 1, "name": "Renamed Item"}
    backup_instance.process_item(renamed_item, collection_path)
    assert backup_instance.stats["files_renamed"] == 1


def test_get_collection_path(
    backup_instance: MetabaseBackup, collection_data: list[dict[str, Any]],
) -> None:
    """Test getting collection path."""
    collection = {"id": 1, "name": "Test Collection", "location": "/1/2/3"}
    response = MagicMock()
    response.json.return_value = collection_data
    # pylint: disable=protected-access
    backup_instance._requests.get.return_value = response

    path = backup_instance.get_collection_path(collection)
    expected_path = backup_instance.output_dir / "1-Unknown/2-Unknown/3-Unknown/1-Test_Collection"
    assert str(path) == str(expected_path)


def test_get_collection_path_with_empty_ids(
    backup_instance: MetabaseBackup, collection_data: list[dict[str, Any]],
) -> None:
    """Test getting collection path with empty IDs."""
    collection = {"id": 7, "name": "Collection 7", "location": "/invalid/7"}
    response = MagicMock()
    response.json.return_value = collection_data
    # pylint: disable=protected-access
    backup_instance._requests.get.return_value = response

    path = backup_instance.get_collection_path(collection)
    expected_path = backup_instance.output_dir / "invalid-Unknown/7-Unknown/7-Collection_7"
    assert str(path) == str(expected_path)


def test_write_changelog(backup_instance: MetabaseBackup, tmp_path: Path) -> None:
    """Test writing to the changelog."""
    backup_instance.output_dir = tmp_path

    # Set up stats
    backup_instance.stats = {
        "total_collections": 5,
        "total_items": 10,
        "items_with_queries": 8,
        "items_with_diffs": 3,
        "items_skipped": 2,
        "folders_renamed": 3,
        "files_renamed": 1,
        "files_updated": 3,
    }

    backup_instance.write_changelog()

    changelog_path = tmp_path / "CHANGELOG.txt"
    assert changelog_path.exists()

    content = changelog_path.read_text()
    assert "Backup completed at" in content
    assert "Collections processed: 5" in content
    assert "Items processed: 10" in content
    assert "Folders renamed: 3" in content
    assert "Files updated: 3" in content
    assert "Files renamed: 1" in content
    assert "Errors encountered: 2" in content

    # Test appending to an existing changelog
    backup_instance.stats = {
        "total_collections": 6,
        "total_items": 12,
        "items_with_queries": 10,
        "items_with_diffs": 4,
        "items_skipped": 1,
        "folders_renamed": 4,
        "files_renamed": 2,
        "files_updated": 4,
    }

    backup_instance.write_changelog()

    content = changelog_path.read_text()
    assert content.count("Backup completed at") == 2
    assert "Collections processed: 6" in content
    assert "Items processed: 12" in content
    assert "Folders renamed: 4" in content
    assert "Files updated: 4" in content
    assert "Files renamed: 2" in content
    assert "Errors encountered: 1" in content


def test_backup_integration(backup_instance: MetabaseBackup, tmp_path: Path) -> None:
    """Test the full backup process."""
    backup_instance.output_dir = tmp_path

    # Mock collection response
    test_collections = [
        {
            "id": 1,
            "name": "Collection 1",
            "location": "/",
            "is_personal": False,
            "is_sample": False,
            "archived": False,
        },
    ]

    # Mock items response
    test_items = {
        "data": [
            {"id": 1, "name": "Item 1", "model": "card"},
            {"id": 2, "name": "Item 2", "model": "card"},
        ],
    }

    # Mock query responses
    test_query = {
        "dataset_query": {"native": {"query": "SELECT * FROM table WHERE id = 1"}},
    }

    # Set up mock responses
    mock_responses = [
        # get_collections
        MagicMock(json=lambda: test_collections, raise_for_status=lambda: None),
        # get_items
        MagicMock(json=lambda: test_items, raise_for_status=lambda: None),
        # get_item_sql for item 1
        MagicMock(json=lambda: test_query, raise_for_status=lambda: None),
        # get_item_sql for item 2
        MagicMock(json=lambda: test_query, raise_for_status=lambda: None),
    ]

    # Mock the get_collections method to return our test_collections
    backup_instance.get_collections = MagicMock(return_value=test_collections)

    # Mock the get_items method to return the items directly
    backup_instance.get_items = MagicMock(return_value=test_items["data"])

    # Mock the get_item_sql method to return the query
    backup_instance.get_item_sql = MagicMock(
        return_value="SELECT * FROM table WHERE id = 1",
    )

    # pylint: disable=protected-access
    backup_instance._requests.get = MagicMock(side_effect=mock_responses)
    backup_instance.backup()

    # Verify output structure
    collection_dir = tmp_path / "1-Collection_1"
    assert collection_dir.exists()
    assert (collection_dir / "1-Item_1.sql").exists()
    assert (collection_dir / "2-Item_2.sql").exists()


def test_init(backup_instance: MetabaseBackup) -> None:
    """Test initialization of MetabaseBackup."""
    assert backup_instance.api_url == "http://metabase.example.com/api"
    assert backup_instance.api_key == "test-key"
    assert isinstance(backup_instance.output_dir, Path)
    assert backup_instance.headers == {"x-api-key": "test-key"}
    assert backup_instance.stats == {
        "total_items": 0,
        "total_collections": 0,
        "items_with_queries": 0,
        "items_with_diffs": 0,
        "items_skipped": 0,
        "folders_renamed": 0,
        "files_renamed": 0,
        "files_updated": 0,
    }
    assert backup_instance.collections == []


def test_get_item_sql_invalid(
    backup_instance: MetabaseBackup, invalid_sql: str,
) -> None:
    """Test handling of invalid queries."""
    response = MagicMock(spec=requests.Response)
    response.json.return_value = {
        "dataset_query": {"native": {"query": invalid_sql}},
    }
    response.raise_for_status.return_value = None
    # pylint: disable=protected-access
    backup_instance._requests.get.return_value = response

    sql_query = backup_instance.get_item_sql(101)

    assert sql_query is None
    # pylint: disable=protected-access
    backup_instance._requests.get.assert_called_once_with(
        "http://metabase.example.com/api/card/101",
        headers=backup_instance.headers,
        timeout=30,
    )


def test_get_item_sql_permission_denied(backup_instance: MetabaseBackup) -> None:
    """Test handling of permission denied errors."""
    # Create a proper HTTPError exception
    response = MagicMock()
    response.status_code = 403
    http_error = requests.exceptions.HTTPError()
    http_error.response = response

    # Set up the mock to raise the exception
    response = MagicMock()
    response.raise_for_status.side_effect = http_error
    response.json.return_value = {}

    # pylint: disable=protected-access
    backup_instance._requests.get = MagicMock(return_value=response)
    sql_query = backup_instance.get_item_sql(1)
    assert sql_query is None


def test_write_changelog_with_stats(
    backup_instance: MetabaseBackup, tmp_path: Path,
) -> None:
    """Test writing to the changelog with stats."""
    backup_instance.output_dir = tmp_path

    # Set up stats
    backup_instance.stats = {
        "total_collections": 5,
        "total_items": 10,
        "items_with_queries": 8,
        "items_with_diffs": 3,
        "items_skipped": 2,
        "folders_renamed": 3,
        "files_renamed": 1,
        "files_updated": 3,
    }

    backup_instance.write_changelog()

    changelog_path = tmp_path / "CHANGELOG.txt"
    assert changelog_path.exists()

    content = changelog_path.read_text()
    assert "Backup completed at" in content
    assert "Collections processed: 5" in content
    assert "Items processed: 10" in content
    assert "Folders renamed: 3" in content
    assert "Files updated: 3" in content
    assert "Files renamed: 1" in content
    assert "Errors encountered: 2" in content


def test_file_renaming(
    backup_instance: MetabaseBackup, sql_query: str, tmp_path: Path,
) -> None:
    """Test file renaming when item names change."""
    backup_instance.output_dir = tmp_path

    # Create a directory for collection 1
    collection_dir = tmp_path / "1-Unknown"
    collection_dir.mkdir(parents=True, exist_ok=True)

    # Create a file with the old name
    old_file = collection_dir / "101-Old_Query_Name.sql"
    old_file.write_text("SELECT * FROM old_table")

    # Mock get_item_sql to return our query
    backup_instance.get_item_sql = MagicMock(return_value=sql_query)

    # Process an item with a new name
    item = {"id": 101, "name": "New Query Name", "model": "card"}
    backup_instance.process_item(item, collection_dir)

    # Check that the file was renamed
    assert not old_file.exists()
    new_file = collection_dir / "101-New_Query_Name.sql"
    assert new_file.exists()
    assert new_file.read_text() == sql_query


def test_collection_path_with_empty_ids(
    backup_instance: MetabaseBackup,
    collection_data: list[dict[str, Any]],
) -> None:
    """Test handling of empty collection IDs in paths."""
    # Mock get_collections to return our mock collections
    backup_instance.get_collections = MagicMock(return_value=collection_data)

    # Create a collection with a path containing empty segments
    collection = {
        "id": 6,
        "name": "Collection 6",
        "location": "/1//2/6",
        "is_personal": False,
        "is_sample": False,
        "archived": False,
    }

    path = backup_instance.get_collection_path(collection)
    # The implementation creates a path with "Unknown" for all parent collections
    expected_path = (
        backup_instance.output_dir / "1-Unknown" / "2-Unknown" / "6-Unknown" / "6-Collection_6"
    )
    assert str(path) == str(expected_path)

    # Create a collection with a path containing invalid IDs
    collection = {
        "id": 7,
        "name": "Collection 7",
        "location": "/invalid/7",
        "is_personal": False,
        "is_sample": False,
        "archived": False,
    }

    path = backup_instance.get_collection_path(collection)
    expected_path = (
        backup_instance.output_dir / "invalid-Unknown" / "7-Unknown" / "7-Collection_7"
    )
    assert str(path) == str(expected_path)


def test_backup_with_error_handling(
    backup_instance: MetabaseBackup,
    collection_data: list[dict[str, Any]],
    item_data: list[dict[str, Any]],
    sql_query: str,
    tmp_path: Path,
) -> None:
    """Test error handling during the backup process."""
    backup_instance.output_dir = tmp_path

    # Create the collection directory structure
    collection_dir = tmp_path / "1-Unknown"
    collection_dir.mkdir(parents=True, exist_ok=True)

    # Create the SQL file for the first item
    (collection_dir / "101-Query_1.sql").write_text(sql_query)

    # Mock API responses
    backup_instance.get_collections = MagicMock(return_value=collection_data)

    # Mock get_items to return items for collection 1 and raise a RequestException for collection 2
    def get_items_side_effect(collection_id: int) -> list[dict[str, Any]]:
        if collection_id == 1:
            return [item_data[0], item_data[1]]
        if collection_id == 2:
            error_msg = "API error for collection 2"
            raise RequestException(error_msg)
        return []

    backup_instance.get_items = MagicMock(side_effect=get_items_side_effect)

    # Mock get_item_sql to return query for item 101 and None for item 102
    def get_item_sql_side_effect(item_id: int) -> str | None:
        if item_id == 101:
            return sql_query
        return None

    backup_instance.get_item_sql = MagicMock(side_effect=get_item_sql_side_effect)

    # Run the backup and expect it to handle errors gracefully
    backup_instance.backup()

    # Verify that the backup completed despite errors
    assert (tmp_path / "CHANGELOG.txt").exists()
    changelog_content = (tmp_path / "CHANGELOG.txt").read_text()
    assert "Backup completed" in changelog_content
    assert "Errors encountered" in changelog_content
    assert "Folders renamed:" in changelog_content


def test_backup_with_empty_collection(
    backup_instance: MetabaseBackup,
    collection_data: list[dict[str, Any]],
    tmp_path: Path,
) -> None:
    """Test handling of empty collections."""
    backup_instance.output_dir = tmp_path

    # Mock API responses for an empty collection
    # pylint: disable=protected-access
    backup_instance._requests.get.side_effect = [
        # get_collections
        MagicMock(
            json=lambda: [collection_data[0]],  # Just one collection
            raise_for_status=lambda: None,
        ),
        # get_items for collection 1 - empty
        MagicMock(json=lambda: {"data": []}, raise_for_status=lambda: None),
    ]

    # Mock the get_collections method to return our test_collections
    backup_instance.get_collections = MagicMock(return_value=[collection_data[0]])

    # Mock the get_items method to return an empty list
    backup_instance.get_items = MagicMock(return_value=[])

    # Run the backup
    backup_instance.backup()

    # Check that the collection directory was created
    assert (tmp_path / "1-Collection_1").exists()

    # Check that the changelog was created
    assert (tmp_path / "CHANGELOG.txt").exists()

    # Check that the changelog includes information about the empty collection
    changelog_content = (tmp_path / "CHANGELOG.txt").read_text()
    assert "Collections processed: 1" in changelog_content
    assert "Items processed: 0" in changelog_content
    assert "Folders renamed:" in changelog_content


def test_create_collection_dir(backup_instance: MetabaseBackup, tmp_path: Path) -> None:
    """Test creating collection directories with renaming of existing directories."""
    backup_instance.output_dir = tmp_path

    # Create a collection with a specific path
    collection = {
        "id": 1,
        "name": "Collection 1",
        "location": "/",
        "is_personal": False,
        "is_sample": False,
        "archived": False,
    }

    # Mock get_collection_path to return a specific path
    backup_instance.get_collection_path = MagicMock(
        return_value=tmp_path / "1-Collection_1",
    )

    # Create the directory
    collection_dir = backup_instance.create_collection_dir(collection)

    # Verify the directory was created
    assert collection_dir.exists()
    assert collection_dir.is_dir()

    # Now test renaming when collection name changes
    # First, create a directory with the old name
    old_dir = tmp_path / "1-Old_Collection_Name"
    old_dir.mkdir(parents=True, exist_ok=True)

    # Create a file in the old directory to verify it gets moved
    test_file = old_dir / "test.txt"
    test_file.write_text("test content")

    # Update the collection name
    collection["name"] = "New Collection Name"

    # Mock get_collection_path to return the new path
    backup_instance.get_collection_path = MagicMock(
        return_value=tmp_path / "1-New_Collection_Name",
    )

    # Create the directory again
    collection_dir = backup_instance.create_collection_dir(collection)

    # Verify the old directory was renamed
    assert not old_dir.exists()
    assert collection_dir.exists()

    # Verify the file was moved to the new directory
    assert (collection_dir / "test.txt").exists()
    assert (collection_dir / "test.txt").read_text() == "test content"

    # Verify the folders_renamed stat was incremented
    assert backup_instance.stats["folders_renamed"] == 1

    # Test nested collection paths
    # Create a nested collection
    nested_collection = {
        "id": 2,
        "name": "Nested Collection",
        "location": "/1",
        "is_personal": False,
        "is_sample": False,
        "archived": False,
    }

    # Mock get_collection_path to return a nested path
    backup_instance.get_collection_path = MagicMock(
        return_value=tmp_path / "1-New_Collection_Name" / "2-Nested_Collection",
    )

    # Create the nested directory
    nested_dir = backup_instance.create_collection_dir(nested_collection)

    # Verify the nested directory was created
    assert nested_dir.exists()
    assert nested_dir.is_dir()

    # Test renaming a nested directory
    # Create an old nested directory
    old_nested_dir = tmp_path / "1-New_Collection_Name" / "2-Old_Nested_Name"
    old_nested_dir.mkdir(parents=True, exist_ok=True)

    # Create a file in the old nested directory
    nested_test_file = old_nested_dir / "nested_test.txt"
    nested_test_file.write_text("nested test content")

    # Update the nested collection name
    nested_collection["name"] = "Updated Nested Collection"

    # Mock get_collection_path to return the updated nested path
    backup_instance.get_collection_path = MagicMock(
        return_value=tmp_path / "1-New_Collection_Name" / "2-Updated_Nested_Collection",
    )

    # Create the nested directory again
    nested_dir = backup_instance.create_collection_dir(nested_collection)

    # Verify the old nested directory was renamed
    assert not old_nested_dir.exists()
    assert nested_dir.exists()

    # Verify the file was moved to the new nested directory
    assert (nested_dir / "nested_test.txt").exists()
    assert (nested_dir / "nested_test.txt").read_text() == "nested test content"

    # Verify the folders_renamed stat was incremented again
    assert backup_instance.stats["folders_renamed"] == 2
