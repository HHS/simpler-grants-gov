import logging
from unittest.mock import Mock, patch

import boto3
import pytest
from botocore.exceptions import ClientError
from pydantic import ValidationError

from src.adapters.aws.dynamodb_adapter import (
    DynamoDBClient,
    DynamoDBConfig,
    DynamoDBGetItemResponse,
    get_boto_dynamodb_client,
)


class TestDynamoDBConfig:

    def test_config_defaults(self, monkeypatch):
        monkeypatch.delenv("FILE_SCAN_CACHE_TABLE_NAME", raising=False)
        with pytest.raises(ValidationError):
            DynamoDBConfig()

    def test_config_from_environment(self, monkeypatch):
        monkeypatch.setenv("FILE_SCAN_CACHE_TABLE_NAME", "test-table")
        config = DynamoDBConfig()
        assert config.file_scan_cache_table_name == "test-table"


class TestGetBotoDynamoDBClient:

    @patch("src.adapters.aws.dynamodb_adapter.get_boto_session")
    def test_uses_default_session(self, mock_get_session):
        mock_session = Mock()
        mock_get_session.return_value = mock_session
        get_boto_dynamodb_client()
        mock_get_session.assert_called_once()
        mock_session.client.assert_called_once_with(
            "dynamodb",
            region_name="us-east-1",
            endpoint_url=DynamoDBConfig().aws_dynamodb_endpoint_url,
        )

    def test_uses_provided_session(self):
        mock_session = Mock()
        get_boto_dynamodb_client(session=mock_session)
        mock_session.client.assert_called_once_with(
            "dynamodb",
            region_name="us-east-1",
            endpoint_url=DynamoDBConfig().aws_dynamodb_endpoint_url,
        )


class TestDynamoDBClient:

    def test_get_item_success(self, mock_dynamodb_table):
        boto_client = boto3.client("dynamodb", region_name="us-east-1")
        dynamodb_client = DynamoDBClient(dynamodb_client=boto_client)

        boto_client.put_item(
            TableName=mock_dynamodb_table,
            Item={
                "attachment_id": {"S": "test-id-123"},
                "user_id": {"S": "user-abc-123"},
                "status": {"S": "complete"},
            },
        )

        response = dynamodb_client.get_item(
            table_name=mock_dynamodb_table,
            key={"attachment_id": {"S": "test-id-123"}},
        )

        assert isinstance(response, DynamoDBGetItemResponse)
        assert response.item is not None
        assert response.item["attachment_id"]["S"] == "test-id-123"
        assert response.item["user_id"]["S"] == "user-abc-123"
        assert response.item["status"]["S"] == "complete"

    def test_get_item_not_found(self, mock_dynamodb_table):
        boto_client = boto3.client("dynamodb", region_name="us-east-1")
        dynamodb_client = DynamoDBClient(dynamodb_client=boto_client)

        response = dynamodb_client.get_item(
            table_name=mock_dynamodb_table,
            key={"attachment_id": {"S": "non-existent-id"}},
        )

        assert isinstance(response, DynamoDBGetItemResponse)
        assert response.item is None

    def test_get_item_consistent_read_true(self, mock_dynamodb_table):
        boto_client = boto3.client("dynamodb", region_name="us-east-1")
        dynamodb_client = DynamoDBClient(dynamodb_client=boto_client)

        boto_client.put_item(
            TableName=mock_dynamodb_table,
            Item={
                "attachment_id": {"S": "test-id-456"},
                "user_id": {"S": "user-456"},
                "status": {"S": "pending"},
            },
        )

        response = dynamodb_client.get_item(
            table_name=mock_dynamodb_table,
            key={"attachment_id": {"S": "test-id-456"}},
            consistent_read=True,
        )

        assert response.item is not None
        assert response.item["attachment_id"]["S"] == "test-id-456"
        assert response.item["status"]["S"] == "pending"

    def test_get_item_consistent_read_false(self, mock_dynamodb_table):
        boto_client = boto3.client("dynamodb", region_name="us-east-1")
        dynamodb_client = DynamoDBClient(dynamodb_client=boto_client)

        boto_client.put_item(
            TableName=mock_dynamodb_table,
            Item={
                "attachment_id": {"S": "test-id-789"},
                "user_id": {"S": "user-789"},
                "status": {"S": "in_progress"},
            },
        )

        response = dynamodb_client.get_item(
            table_name=mock_dynamodb_table,
            key={"attachment_id": {"S": "test-id-789"}},
            consistent_read=False,
        )

        assert response.item is not None
        assert response.item["attachment_id"]["S"] == "test-id-789"
        assert response.item["status"]["S"] == "in_progress"

    def test_get_item_logs_on_error(self, mock_dynamodb, caplog):
        invalid_table = "non-existent-table"
        boto_client = boto3.client("dynamodb", region_name="us-east-1")
        dynamodb_client = DynamoDBClient(dynamodb_client=boto_client)

        with pytest.raises(ClientError):
            with caplog.at_level(logging.ERROR):
                dynamodb_client.get_item(
                    table_name=invalid_table,
                    key={"attachment_id": {"S": "test-id"}},
                )

        assert "Failed to get item from DynamoDB" in caplog.text
        error_record = next(
            r for r in caplog.records if r.message == "Failed to get item from DynamoDB"
        )
        assert error_record.table_name == invalid_table

    def test_get_item_logs_success(self, mock_dynamodb_table, caplog):
        boto_client = boto3.client("dynamodb", region_name="us-east-1")
        dynamodb_client = DynamoDBClient(dynamodb_client=boto_client)

        boto_client.put_item(
            TableName=mock_dynamodb_table,
            Item={
                "attachment_id": {"S": "test-id-999"},
                "user_id": {"S": "user-999"},
                "status": {"S": "infected"},
            },
        )

        with caplog.at_level(logging.INFO):
            dynamodb_client.get_item(
                table_name=mock_dynamodb_table,
                key={"attachment_id": {"S": "test-id-999"}},
            )

        assert "Successfully retrieved item from DynamoDB" in caplog.text
        success_record = next(
            r for r in caplog.records if r.message == "Successfully retrieved item from DynamoDB"
        )
        assert success_record.table_name == mock_dynamodb_table

    def test_get_item_logs_not_found(self, mock_dynamodb_table, caplog):
        boto_client = boto3.client("dynamodb", region_name="us-east-1")
        dynamodb_client = DynamoDBClient(dynamodb_client=boto_client)

        with caplog.at_level(logging.INFO):
            dynamodb_client.get_item(
                table_name=mock_dynamodb_table,
                key={"attachment_id": {"S": "missing-id"}},
            )

        assert "Item not found in DynamoDB" in caplog.text
        not_found_record = next(
            r for r in caplog.records if r.message == "Item not found in DynamoDB"
        )
        assert not_found_record.table_name == mock_dynamodb_table
