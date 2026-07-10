import uuid
from datetime import timedelta

import boto3
import pytest
from grants_shared.util import datetime_util
from sqlalchemy import select

import tests.src.db.models.factories as factories
from src.constants.lookup_constants import FileScanStatus
from src.db.models.file_upload_models import PendingFile
from src.validation.validation_constants import ValidationErrorType

URL = "/v1/files"


@pytest.fixture
def dynamodb_boto_client(file_scan_dynamodb_table):
    """boto3 client for asserting on records the route wrote. Shares moto state."""
    return boto3.client("dynamodb", region_name="us-east-1")


@pytest.fixture
def aws_mocks(
    mock_file_scan_s3_bucket,
    file_scan_dynamodb_table,
):
    """Bundle the s3 + dynamodb fixtures this endpoint needs."""
    return {
        "bucket": mock_file_scan_s3_bucket,
        "table": file_scan_dynamodb_table,
    }


def _get_dynamodb_item(dynamodb_client, table_name, pending_file_id):
    return dynamodb_client.get_item(
        TableName=table_name,
        Key={"file_id": {"S": str(pending_file_id)}},
    ).get("Item")


class TestCreatePresignedUploadSuccess:
    def test_creates_pending_file_and_scan_record(
        self,
        client,
        user,
        user_auth_token,
        db_session,
        aws_mocks,
        dynamodb_boto_client,
    ):
        resp = client.post(
            URL,
            headers={"X-SGG-Token": user_auth_token},
            json={"file_name": "example.txt", "mime_type": "text/plain"},
        )

        assert resp.status_code == 200
        body = resp.get_json()
        assert body["message"] == "Success"

        data = body["data"]
        pending_file_id = uuid.UUID(data["pending_file_id"])
        assert data["url"].startswith("http")
        assert data["body"]["x-amz-meta-file-id"] == str(pending_file_id)
        assert data["body"]["x-amz-meta-user-id"] == str(user.user_id)
        assert data["body"]["Content-Type"] == "text/plain"

        pending_file = db_session.execute(
            select(PendingFile).where(PendingFile.pending_file_id == pending_file_id)
        ).scalar_one()
        assert pending_file.user_id == user.user_id
        assert pending_file.file_name == "example.txt"
        assert pending_file.mime_type == "text/plain"
        assert pending_file.file_scan_status == FileScanStatus.PENDING
        assert pending_file.file_location.endswith(f"/unscanned/{pending_file_id}/example.txt")

        item = _get_dynamodb_item(dynamodb_boto_client, aws_mocks["table"], pending_file_id)
        assert item is not None
        assert item["file_id"]["S"] == str(pending_file_id)
        assert item["user_id"]["S"] == str(user.user_id)
        assert item["status"]["S"] == FileScanStatus.PENDING.value

    def test_secures_unsafe_file_name(
        self,
        client,
        user_auth_token,
        db_session,
        aws_mocks,
    ):
        unsafe_name = "../../etc/passwd weird name.txt"
        resp = client.post(
            URL,
            headers={"X-SGG-Token": user_auth_token},
            json={"file_name": unsafe_name, "mime_type": "text/plain"},
        )

        assert resp.status_code == 200
        pending_file_id = uuid.UUID(resp.get_json()["data"]["pending_file_id"])

        pending_file = db_session.execute(
            select(PendingFile).where(PendingFile.pending_file_id == pending_file_id)
        ).scalar_one()
        # secure_filename strips directory traversal and replaces unsafe characters
        assert "../" not in pending_file.file_location
        assert " " not in pending_file.file_location
        assert pending_file.file_location.endswith("/passwd_weird_name.txt")
        # We preserve the original file name on the DB record for display
        assert pending_file.file_name == unsafe_name

    def test_works_with_api_user_key_auth(
        self,
        client,
        user_api_key,
        db_session,
        aws_mocks,
    ):
        resp = client.post(
            URL,
            headers={"X-API-Key": user_api_key.key_id},
            json={"file_name": "report.pdf", "mime_type": "application/pdf"},
        )

        assert resp.status_code == 200
        pending_file_id = uuid.UUID(resp.get_json()["data"]["pending_file_id"])

        pending_file = db_session.execute(
            select(PendingFile).where(PendingFile.pending_file_id == pending_file_id)
        ).scalar_one()
        assert pending_file.user_id == user_api_key.user_id

    def test_presigned_url_points_to_file_scan_bucket(
        self,
        client,
        user_auth_token,
        aws_mocks,
    ):
        """The URL must target the file scan bucket so the lambda picks it up."""
        resp = client.post(
            URL,
            headers={"X-SGG-Token": user_auth_token},
            json={"file_name": "hello.txt", "mime_type": "text/plain"},
        )
        assert resp.status_code == 200

        presigned = resp.get_json()["data"]
        # Bucket name appears either as a virtual-host subdomain or path prefix
        # depending on signature style; both are acceptable.
        assert aws_mocks["bucket"] in presigned["url"]

    def test_logs_pending_file_id(
        self,
        client,
        user,
        user_auth_token,
        aws_mocks,
        caplog,
    ):
        with caplog.at_level("INFO"):
            resp = client.post(
                URL,
                headers={"X-SGG-Token": user_auth_token},
                json={"file_name": "example.txt", "mime_type": "text/plain"},
            )

        assert resp.status_code == 200
        pending_file_id = uuid.UUID(resp.get_json()["data"]["pending_file_id"])

        records = [
            r for r in caplog.records if r.message == "Created presigned upload for pending file"
        ]
        assert len(records) == 1
        record = records[0]
        assert record.pending_file_id == pending_file_id
        assert record.user_id == user.user_id
        assert record.file_scan_status == FileScanStatus.PENDING


class TestCreatePresignedUpload401:
    def test_no_auth(self, client, enable_factory_create):
        resp = client.post(URL, json={"file_name": "f.txt", "mime_type": "text/plain"})
        assert resp.status_code == 401


class TestCreatePresignedUpload422:
    def test_missing_file_name(self, client, user_auth_token, aws_mocks):
        resp = client.post(
            URL,
            headers={"X-SGG-Token": user_auth_token},
            json={"mime_type": "text/plain"},
        )
        assert resp.status_code == 422

    def test_missing_mime_type(self, client, user_auth_token, aws_mocks):
        resp = client.post(
            URL,
            headers={"X-SGG-Token": user_auth_token},
            json={"file_name": "f.txt"},
        )
        assert resp.status_code == 422

    def test_file_name_too_long(self, client, user_auth_token, aws_mocks):
        resp = client.post(
            URL,
            headers={"X-SGG-Token": user_auth_token},
            json={"file_name": "a" * 101, "mime_type": "text/plain"},
        )
        assert resp.status_code == 422

    def test_empty_file_name(self, client, user_auth_token, aws_mocks):
        resp = client.post(
            URL,
            headers={"X-SGG-Token": user_auth_token},
            json={"file_name": "", "mime_type": "text/plain"},
        )
        assert resp.status_code == 422


class TestCreatePresignedUpload429:
    def test_rate_limit_exceeded_returns_429_with_validation_detail(
        self,
        client,
        user,
        user_auth_token,
        aws_mocks,
        monkeypatch,
    ):
        # Use a smaller limit so the test stays fast
        monkeypatch.setenv("PENDING_FILE_UPLOAD_RATE_LIMIT", "3")
        factories.PendingFileFactory.create_batch(size=3, user=user)

        resp = client.post(
            URL,
            headers={"X-SGG-Token": user_auth_token},
            json={"file_name": "another.txt", "mime_type": "text/plain"},
        )

        assert resp.status_code == 429
        body = resp.get_json()
        assert body["message"] == "Too many pending file uploads"
        assert len(body["errors"]) == 1
        assert body["errors"][0]["type"] == ValidationErrorType.PENDING_FILE_UPLOAD_LIMIT_EXCEEDED

    def test_only_recent_pending_files_count_toward_limit(
        self,
        client,
        user,
        user_auth_token,
        aws_mocks,
        monkeypatch,
    ):
        monkeypatch.setenv("PENDING_FILE_UPLOAD_RATE_LIMIT", "2")
        monkeypatch.setenv("PENDING_FILE_UPLOAD_RATE_WINDOW_HOURS", "1")

        # Backdate this row past the rate-limit window so it doesn't count
        factories.PendingFileFactory.create(
            user=user, created_at=datetime_util.utcnow() - timedelta(hours=2)
        )

        # One recent pending file -- still under the limit of 2
        factories.PendingFileFactory.create(user=user)

        resp = client.post(
            URL,
            headers={"X-SGG-Token": user_auth_token},
            json={"file_name": "ok.txt", "mime_type": "text/plain"},
        )
        assert resp.status_code == 200

    def test_other_users_pending_files_do_not_count(
        self,
        client,
        user,
        user_auth_token,
        aws_mocks,
        monkeypatch,
    ):
        monkeypatch.setenv("PENDING_FILE_UPLOAD_RATE_LIMIT", "2")
        other_user = factories.UserFactory.create()
        factories.PendingFileFactory.create_batch(size=5, user=other_user)

        resp = client.post(
            URL,
            headers={"X-SGG-Token": user_auth_token},
            json={"file_name": "ok.txt", "mime_type": "text/plain"},
        )
        assert resp.status_code == 200
