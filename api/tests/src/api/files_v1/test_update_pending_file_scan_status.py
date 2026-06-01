import uuid

import boto3
import pytest

import tests.src.db.models.factories as factories
from src.constants.lookup_constants import FileScanStatus, Privilege, RoleType
from src.validation.validation_constants import ValidationErrorType

# Placeholder for tests where the request fails before the s3 existence check
# (auth, schema validation), so the path never actually gets dereferenced.
PLACEHOLDER_S3_PATH = "s3://example-bucket/scanned/abc/example.txt"


def _build_url(pending_file_id: uuid.UUID) -> str:
    return f"/v1/files/{pending_file_id}"


def _put_scanned_file(bucket: str, key: str, body: bytes = b"scanned content") -> str:
    boto3.client("s3").put_object(Bucket=bucket, Key=key, Body=body)
    return f"s3://{bucket}/{key}"


@pytest.fixture
def s3_scan_user_key(db_session, enable_factory_create):
    """Create a user with the internal_s3_scan privilege and return the API key."""
    api_key = factories.UserApiKeyFactory.create()

    role = factories.RoleFactory.create(privileges=[Privilege.INTERNAL_S3_SCAN])
    factories.LinkRoleRoleTypeFactory.create(role=role, role_type=RoleType.INTERNAL)
    factories.InternalUserRoleFactory.create(user=api_key.user, role=role)

    return api_key.key_id


class TestUpdateFileScanStatusSuccess:
    def test_update_scan_status_complete(
        self, client, db_session, s3_scan_user_key, mock_file_scan_s3_bucket
    ):
        pending_file = factories.PendingFileFactory.create(file_scan_status=FileScanStatus.PENDING)
        file_location = _put_scanned_file(mock_file_scan_s3_bucket, "scanned/abc/example.txt")

        resp = client.post(
            _build_url(pending_file.pending_file_id),
            headers={"X-API-Key": s3_scan_user_key},
            json={"file_scan_status": "complete", "file_location": file_location},
        )

        assert resp.status_code == 200

        db_session.refresh(pending_file)
        assert pending_file.file_scan_status == FileScanStatus.COMPLETE
        assert pending_file.file_location == file_location

    def test_update_scan_status_infected(
        self, client, db_session, s3_scan_user_key, mock_file_scan_s3_bucket
    ):
        pending_file = factories.PendingFileFactory.create(
            file_scan_status=FileScanStatus.IN_PROGRESS
        )
        file_location = _put_scanned_file(mock_file_scan_s3_bucket, "infected/abc/example.txt")

        resp = client.post(
            _build_url(pending_file.pending_file_id),
            headers={"X-API-Key": s3_scan_user_key},
            json={"file_scan_status": "infected", "file_location": file_location},
        )

        assert resp.status_code == 200

        db_session.refresh(pending_file)
        assert pending_file.file_scan_status == FileScanStatus.INFECTED
        assert pending_file.file_location == file_location

    def test_logs_scan_duration(
        self, client, db_session, s3_scan_user_key, mock_file_scan_s3_bucket, caplog
    ):
        pending_file = factories.PendingFileFactory.create(file_scan_status=FileScanStatus.PENDING)
        uploader_user_id = pending_file.user_id
        file_location = _put_scanned_file(mock_file_scan_s3_bucket, "scanned/abc/example.txt")

        with caplog.at_level("INFO"):
            resp = client.post(
                _build_url(pending_file.pending_file_id),
                headers={"X-API-Key": s3_scan_user_key},
                json={"file_scan_status": "complete", "file_location": file_location},
            )

        assert resp.status_code == 200

        log_records = [r for r in caplog.records if r.message == "Updated pending file scan status"]
        assert len(log_records) == 1

        record = log_records[0]
        assert record.pending_file_id == pending_file.pending_file_id
        assert record.scanner_user_id is not None
        assert record.uploader_user_id == uploader_user_id
        assert record.file_scan_status == FileScanStatus.COMPLETE
        assert record.scan_duration_seconds >= 0
        assert record.prior_file_scan_status == FileScanStatus.PENDING


class TestUpdateFileScanStatus401:
    def test_no_api_key(self, client, enable_factory_create):
        pending_file = factories.PendingFileFactory.create()

        resp = client.post(
            _build_url(pending_file.pending_file_id),
            json={
                "file_scan_status": "complete",
                "file_location": PLACEHOLDER_S3_PATH,
            },
        )

        assert resp.status_code == 401


class TestUpdateFileScanStatus403:
    def test_user_without_s3_scan_privilege(
        self, client, db_session, user_api_key_id, enable_factory_create
    ):
        pending_file = factories.PendingFileFactory.create()

        resp = client.post(
            _build_url(pending_file.pending_file_id),
            headers={"X-API-Key": user_api_key_id},
            json={
                "file_scan_status": "complete",
                "file_location": PLACEHOLDER_S3_PATH,
            },
        )

        assert resp.status_code == 403
        assert resp.get_json()["message"] == "Forbidden"


class TestUpdateFileScanStatus404:
    def test_pending_file_not_found(
        self, client, db_session, s3_scan_user_key, mock_file_scan_s3_bucket
    ):
        file_location = _put_scanned_file(mock_file_scan_s3_bucket, "scanned/abc/example.txt")

        resp = client.post(
            _build_url(uuid.uuid4()),
            headers={"X-API-Key": s3_scan_user_key},
            json={"file_scan_status": "complete", "file_location": file_location},
        )

        assert resp.status_code == 404
        assert "Pending file not found" in resp.get_json()["message"]


class TestUpdateFileScanStatus422:
    def test_missing_file_scan_status(self, client, db_session, s3_scan_user_key):
        pending_file = factories.PendingFileFactory.create()

        resp = client.post(
            _build_url(pending_file.pending_file_id),
            headers={"X-API-Key": s3_scan_user_key},
            json={"file_location": PLACEHOLDER_S3_PATH},
        )

        assert resp.status_code == 422

    def test_invalid_file_scan_status(self, client, db_session, s3_scan_user_key):
        pending_file = factories.PendingFileFactory.create()

        resp = client.post(
            _build_url(pending_file.pending_file_id),
            headers={"X-API-Key": s3_scan_user_key},
            json={
                "file_scan_status": "not_a_real_status",
                "file_location": PLACEHOLDER_S3_PATH,
            },
        )

        assert resp.status_code == 422

    def test_missing_file_location(self, client, db_session, s3_scan_user_key):
        pending_file = factories.PendingFileFactory.create()

        resp = client.post(
            _build_url(pending_file.pending_file_id),
            headers={"X-API-Key": s3_scan_user_key},
            json={"file_scan_status": "complete"},
        )

        assert resp.status_code == 422

    @pytest.mark.parametrize(
        "bad_value", ["", "not-an-s3-path", "/tmp/local/path.txt", "s3:///missing-bucket.txt"]
    )
    def test_invalid_file_location_format(self, client, db_session, s3_scan_user_key, bad_value):
        pending_file = factories.PendingFileFactory.create()

        resp = client.post(
            _build_url(pending_file.pending_file_id),
            headers={"X-API-Key": s3_scan_user_key},
            json={"file_scan_status": "complete", "file_location": bad_value},
        )

        assert resp.status_code == 422

    def test_file_not_at_s3_location(
        self, client, db_session, s3_scan_user_key, mock_file_scan_s3_bucket
    ):
        pending_file = factories.PendingFileFactory.create(file_scan_status=FileScanStatus.PENDING)
        prior_file_location = pending_file.file_location
        missing_location = f"s3://{mock_file_scan_s3_bucket}/scanned/abc/does-not-exist.txt"

        resp = client.post(
            _build_url(pending_file.pending_file_id),
            headers={"X-API-Key": s3_scan_user_key},
            json={"file_scan_status": "complete", "file_location": missing_location},
        )

        assert resp.status_code == 422
        body = resp.get_json()
        assert body["message"] == "File does not exist at the provided s3 path"
        assert len(body["errors"]) == 1
        assert body["errors"][0]["type"] == ValidationErrorType.FILE_NOT_FOUND_AT_LOCATION
        assert body["errors"][0]["field"] == "file_location"

        db_session.refresh(pending_file)
        assert pending_file.file_scan_status == FileScanStatus.PENDING
        assert pending_file.file_location == prior_file_location
