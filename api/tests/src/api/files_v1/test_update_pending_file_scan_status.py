import uuid

import pytest

import tests.src.db.models.factories as factories
from src.constants.lookup_constants import FileScanStatus, Privilege, RoleType


def _build_url(pending_file_id: uuid.UUID) -> str:
    return f"/v1/files/{pending_file_id}"


@pytest.fixture
def s3_scan_user_key(db_session, enable_factory_create):
    """Create a user with the internal_s3_scan privilege and return the API key."""
    api_key = factories.UserApiKeyFactory.create()

    role = factories.RoleFactory.create(privileges=[Privilege.INTERNAL_S3_SCAN])
    factories.LinkRoleRoleTypeFactory.create(role=role, role_type=RoleType.INTERNAL)
    factories.InternalUserRoleFactory.create(user=api_key.user, role=role)

    return api_key.key_id


class TestUpdateFileScanStatusSuccess:
    def test_update_scan_status_complete(self, client, db_session, s3_scan_user_key):
        pending_file = factories.PendingFileFactory.create(file_scan_status=FileScanStatus.PENDING)

        resp = client.post(
            _build_url(pending_file.pending_file_id),
            headers={"X-API-Key": s3_scan_user_key},
            json={"file_scan_status": "complete"},
        )

        assert resp.status_code == 200

        db_session.refresh(pending_file)
        assert pending_file.file_scan_status == FileScanStatus.COMPLETE

    def test_update_scan_status_infected(self, client, db_session, s3_scan_user_key):
        pending_file = factories.PendingFileFactory.create(
            file_scan_status=FileScanStatus.IN_PROGRESS
        )

        resp = client.post(
            _build_url(pending_file.pending_file_id),
            headers={"X-API-Key": s3_scan_user_key},
            json={"file_scan_status": "infected"},
        )

        assert resp.status_code == 200

        db_session.refresh(pending_file)
        assert pending_file.file_scan_status == FileScanStatus.INFECTED

    def test_logs_scan_duration(self, client, db_session, s3_scan_user_key, caplog):
        pending_file = factories.PendingFileFactory.create(file_scan_status=FileScanStatus.PENDING)

        with caplog.at_level("INFO"):
            resp = client.post(
                _build_url(pending_file.pending_file_id),
                headers={"X-API-Key": s3_scan_user_key},
                json={"file_scan_status": "complete"},
            )

        assert resp.status_code == 200

        log_records = [r for r in caplog.records if r.message == "Updated pending file scan status"]
        assert len(log_records) == 1

        record = log_records[0]
        assert record.pending_file_id == pending_file.pending_file_id
        assert record.user_id is not None
        assert record.file_scan_status == FileScanStatus.COMPLETE
        assert record.scan_duration_seconds >= 0


class TestUpdateFileScanStatus401:
    def test_no_api_key(self, client, enable_factory_create):
        pending_file = factories.PendingFileFactory.create()

        resp = client.post(
            _build_url(pending_file.pending_file_id),
            json={"file_scan_status": "complete"},
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
            json={"file_scan_status": "complete"},
        )

        assert resp.status_code == 403
        assert resp.get_json()["message"] == "Forbidden"


class TestUpdateFileScanStatus404:
    def test_pending_file_not_found(self, client, db_session, s3_scan_user_key):
        resp = client.post(
            _build_url(uuid.uuid4()),
            headers={"X-API-Key": s3_scan_user_key},
            json={"file_scan_status": "complete"},
        )

        assert resp.status_code == 404
        assert "Pending file not found" in resp.get_json()["message"]


class TestUpdateFileScanStatus422:
    def test_missing_file_scan_status(self, client, db_session, s3_scan_user_key):
        pending_file = factories.PendingFileFactory.create()

        resp = client.post(
            _build_url(pending_file.pending_file_id),
            headers={"X-API-Key": s3_scan_user_key},
            json={},
        )

        assert resp.status_code == 422

    def test_invalid_file_scan_status(self, client, db_session, s3_scan_user_key):
        pending_file = factories.PendingFileFactory.create()

        resp = client.post(
            _build_url(pending_file.pending_file_id),
            headers={"X-API-Key": s3_scan_user_key},
            json={"file_scan_status": "not_a_real_status"},
        )

        assert resp.status_code == 422
