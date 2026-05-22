import json
import uuid

import boto3
import pytest

import tests.src.db.models.factories as factories
from src.adapters.aws.dynamodb_adapter import DynamoDBClient
from src.constants.lookup_constants import FileScanStatus


@pytest.fixture(autouse=True)
def fast_stream_config(monkeypatch):
    # Keep tests well under a second - both env vars are floats so 0 is fine
    monkeypatch.setenv("FILE_SCAN_RESULTS_POLL_INTERVAL_SECONDS", "0")
    monkeypatch.setenv("FILE_SCAN_RESULTS_MAX_DURATION_SECONDS", "0.5")


@pytest.fixture
def dynamodb_boto_client(file_scan_dynamodb_table):
    """Boto3 client used to seed records. Shares moto state with the route's client."""
    return boto3.client("dynamodb", region_name="us-east-1")


def _build_url(pending_file_id: uuid.UUID) -> str:
    return f"/v1/files/{pending_file_id}/results"


def _put_scan_record(
    boto_client,
    table_name: str,
    pending_file_id: uuid.UUID,
    user_id: uuid.UUID,
    status: FileScanStatus,
) -> None:
    boto_client.put_item(
        TableName=table_name,
        Item={
            "file_id": {"S": str(pending_file_id)},
            "user_id": {"S": str(user_id)},
            "status": {"S": status.value},
        },
    )


def _parse_chunks(resp) -> list[dict]:
    body = resp.get_data(as_text=True)
    return [json.loads(line) for line in body.splitlines() if line.strip()]


class TestGetFileScanResultsSuccess:
    def test_terminal_status_complete_yields_once(
        self,
        client,
        user,
        user_auth_token,
        dynamodb_boto_client,
        file_scan_dynamodb_table,
    ):
        pending_file_id = uuid.uuid4()
        _put_scan_record(
            dynamodb_boto_client,
            file_scan_dynamodb_table,
            pending_file_id,
            user.user_id,
            FileScanStatus.COMPLETE,
        )

        resp = client.get(
            _build_url(pending_file_id),
            headers={"X-SGG-Token": user_auth_token},
        )

        assert resp.status_code == 200
        assert resp.mimetype == "application/x-ndjson"
        chunks = _parse_chunks(resp)
        assert chunks == [{"data": {"status": FileScanStatus.COMPLETE.value}}]

    def test_terminal_status_infected_yields_once(
        self,
        client,
        user,
        user_auth_token,
        dynamodb_boto_client,
        file_scan_dynamodb_table,
    ):
        pending_file_id = uuid.uuid4()
        _put_scan_record(
            dynamodb_boto_client,
            file_scan_dynamodb_table,
            pending_file_id,
            user.user_id,
            FileScanStatus.INFECTED,
        )

        resp = client.get(
            _build_url(pending_file_id),
            headers={"X-SGG-Token": user_auth_token},
        )

        assert resp.status_code == 200
        chunks = _parse_chunks(resp)
        assert chunks == [{"data": {"status": FileScanStatus.INFECTED.value}}]

    def test_pending_then_terminal_yields_both(
        self,
        client,
        user,
        user_auth_token,
        dynamodb_boto_client,
        file_scan_dynamodb_table,
        monkeypatch,
    ):
        """When the record transitions mid-stream we yield each status."""
        pending_file_id = uuid.uuid4()
        _put_scan_record(
            dynamodb_boto_client,
            file_scan_dynamodb_table,
            pending_file_id,
            user.user_id,
            FileScanStatus.PENDING,
        )

        # We monkeypatch DynamoDBClient.get_item not to mock its behavior
        # (the real moto-backed call still runs) but to use it as a hook for
        # mutating the underlying record between polls. This drives the
        # polling loop through deterministic status transitions without
        # relying on real time / sleep.
        real_get_item = DynamoDBClient.get_item
        transitions = iter([FileScanStatus.IN_PROGRESS, FileScanStatus.COMPLETE])

        def wrapped_get_item(self, *args, **kwargs):
            result = real_get_item(self, *args, **kwargs)
            next_status = next(transitions, None)
            if next_status is not None:
                _put_scan_record(
                    dynamodb_boto_client,
                    file_scan_dynamodb_table,
                    pending_file_id,
                    user.user_id,
                    next_status,
                )
            return result

        monkeypatch.setattr(DynamoDBClient, "get_item", wrapped_get_item)

        resp = client.get(
            _build_url(pending_file_id),
            headers={"X-SGG-Token": user_auth_token},
        )

        assert resp.status_code == 200
        chunks = _parse_chunks(resp)
        assert chunks == [
            {"data": {"status": FileScanStatus.PENDING.value}},
            {"data": {"status": FileScanStatus.IN_PROGRESS.value}},
            {"data": {"status": FileScanStatus.COMPLETE.value}},
        ]

    def test_stream_ends_when_max_duration_reached(
        self,
        client,
        user,
        user_auth_token,
        dynamodb_boto_client,
        file_scan_dynamodb_table,
        monkeypatch,
    ):
        """If the status never reaches terminal, the loop ends when max duration elapses."""
        monkeypatch.setenv("FILE_SCAN_RESULTS_MAX_DURATION_SECONDS", "0")
        pending_file_id = uuid.uuid4()
        _put_scan_record(
            dynamodb_boto_client,
            file_scan_dynamodb_table,
            pending_file_id,
            user.user_id,
            FileScanStatus.PENDING,
        )

        resp = client.get(
            _build_url(pending_file_id),
            headers={"X-SGG-Token": user_auth_token},
        )

        assert resp.status_code == 200
        chunks = _parse_chunks(resp)
        # With max_duration=0, we yield the first status and exit on the
        # elapsed-time check before sleeping or re-querying.
        assert chunks == [{"data": {"status": FileScanStatus.PENDING.value}}]

    def test_record_disappearing_mid_stream_logs_error(
        self,
        client,
        user,
        user_auth_token,
        dynamodb_boto_client,
        file_scan_dynamodb_table,
        monkeypatch,
        caplog,
    ):
        """If the record is deleted between polls, we log at ERROR and end the stream."""
        pending_file_id = uuid.uuid4()
        _put_scan_record(
            dynamodb_boto_client,
            file_scan_dynamodb_table,
            pending_file_id,
            user.user_id,
            FileScanStatus.PENDING,
        )

        real_get_item = DynamoDBClient.get_item
        first_call = {"done": False}

        def wrapped_get_item(self, *args, **kwargs):
            result = real_get_item(self, *args, **kwargs)
            if not first_call["done"]:
                first_call["done"] = True
                dynamodb_boto_client.delete_item(
                    TableName=file_scan_dynamodb_table,
                    Key={"file_id": {"S": str(pending_file_id)}},
                )
            return result

        monkeypatch.setattr(DynamoDBClient, "get_item", wrapped_get_item)

        with caplog.at_level("ERROR"):
            resp = client.get(
                _build_url(pending_file_id),
                headers={"X-SGG-Token": user_auth_token},
            )
            chunks = _parse_chunks(resp)

        assert resp.status_code == 200
        # First chunk was emitted before the record vanished; nothing after.
        assert chunks == [{"data": {"status": FileScanStatus.PENDING.value}}]

        disappeared_records = [
            r
            for r in caplog.records
            if r.message == "File scan record disappeared during stream, ending stream"
        ]
        assert len(disappeared_records) == 1
        record = disappeared_records[0]
        assert record.levelname == "ERROR"
        assert record.pending_file_id == pending_file_id
        assert record.user_id == user.user_id

    def test_logs_terminal_status_reached(
        self,
        client,
        user,
        user_auth_token,
        dynamodb_boto_client,
        file_scan_dynamodb_table,
        caplog,
    ):
        pending_file_id = uuid.uuid4()
        _put_scan_record(
            dynamodb_boto_client,
            file_scan_dynamodb_table,
            pending_file_id,
            user.user_id,
            FileScanStatus.COMPLETE,
        )

        with caplog.at_level("INFO"):
            resp = client.get(
                _build_url(pending_file_id),
                headers={"X-SGG-Token": user_auth_token},
            )
            # Consume the stream so the generator runs to completion and the
            # terminal-status log fires.
            _parse_chunks(resp)

        assert resp.status_code == 200

        terminal_records = [
            r
            for r in caplog.records
            if r.message == "File scan results stream reached terminal status"
        ]
        assert len(terminal_records) == 1
        record = terminal_records[0]
        assert record.pending_file_id == pending_file_id
        assert record.user_id == user.user_id
        assert record.file_scan_status == FileScanStatus.COMPLETE
        assert record.stream_duration_seconds >= 0


class TestGetFileScanResults401:
    def test_no_auth(self, client, enable_factory_create):
        resp = client.get(_build_url(uuid.uuid4()))
        assert resp.status_code == 401


class TestGetFileScanResults403:
    def test_user_id_mismatch_returns_403(
        self,
        client,
        user,
        user_auth_token,
        dynamodb_boto_client,
        file_scan_dynamodb_table,
    ):
        pending_file_id = uuid.uuid4()
        other_user_id = uuid.uuid4()
        _put_scan_record(
            dynamodb_boto_client,
            file_scan_dynamodb_table,
            pending_file_id,
            other_user_id,
            FileScanStatus.PENDING,
        )

        resp = client.get(
            _build_url(pending_file_id),
            headers={"X-SGG-Token": user_auth_token},
        )

        assert resp.status_code == 403
        assert resp.get_json()["message"] == "Forbidden"

    def test_other_user_with_api_key_gets_403(
        self,
        client,
        user_api_key,
        dynamodb_boto_client,
        file_scan_dynamodb_table,
    ):
        # Record belongs to a totally different user
        record_user = factories.UserFactory.create()
        pending_file_id = uuid.uuid4()
        _put_scan_record(
            dynamodb_boto_client,
            file_scan_dynamodb_table,
            pending_file_id,
            record_user.user_id,
            FileScanStatus.PENDING,
        )

        resp = client.get(
            _build_url(pending_file_id),
            headers={"X-API-Key": user_api_key.key_id},
        )

        assert resp.status_code == 403
        assert resp.get_json()["message"] == "Forbidden"


class TestGetFileScanResults404:
    def test_record_not_in_dynamodb_returns_404(
        self,
        client,
        user_auth_token,
        file_scan_dynamodb_table,
    ):
        pending_file_id = uuid.uuid4()
        # Intentionally do not put any item

        resp = client.get(
            _build_url(pending_file_id),
            headers={"X-SGG-Token": user_auth_token},
        )

        assert resp.status_code == 404
        assert resp.get_json()["message"] == "File scan record not found"


class TestGetFileScanResults500:
    """Malformed DynamoDB records are an infrastructure error -- fail fast."""

    def test_missing_user_id_returns_500(
        self,
        client,
        user_auth_token,
        dynamodb_boto_client,
        file_scan_dynamodb_table,
    ):
        pending_file_id = uuid.uuid4()
        dynamodb_boto_client.put_item(
            TableName=file_scan_dynamodb_table,
            Item={
                "file_id": {"S": str(pending_file_id)},
                "status": {"S": FileScanStatus.PENDING.value},
            },
        )

        resp = client.get(
            _build_url(pending_file_id),
            headers={"X-SGG-Token": user_auth_token},
        )

        assert resp.status_code == 500

    def test_missing_status_returns_500(
        self,
        client,
        user,
        user_auth_token,
        dynamodb_boto_client,
        file_scan_dynamodb_table,
    ):
        pending_file_id = uuid.uuid4()
        dynamodb_boto_client.put_item(
            TableName=file_scan_dynamodb_table,
            Item={
                "file_id": {"S": str(pending_file_id)},
                "user_id": {"S": str(user.user_id)},
            },
        )

        resp = client.get(
            _build_url(pending_file_id),
            headers={"X-SGG-Token": user_auth_token},
        )

        assert resp.status_code == 500

    def test_unknown_status_value_returns_500(
        self,
        client,
        user,
        user_auth_token,
        dynamodb_boto_client,
        file_scan_dynamodb_table,
    ):
        pending_file_id = uuid.uuid4()
        dynamodb_boto_client.put_item(
            TableName=file_scan_dynamodb_table,
            Item={
                "file_id": {"S": str(pending_file_id)},
                "user_id": {"S": str(user.user_id)},
                "status": {"S": "not-a-real-status"},
            },
        )

        resp = client.get(
            _build_url(pending_file_id),
            headers={"X-SGG-Token": user_auth_token},
        )

        assert resp.status_code == 500

    def test_malformed_record_mid_stream_logs_and_aborts(
        self,
        client,
        user,
        user_auth_token,
        dynamodb_boto_client,
        file_scan_dynamodb_table,
        monkeypatch,
        caplog,
    ):
        """A malformed record discovered mid-stream is logged and aborts the connection."""
        pending_file_id = uuid.uuid4()
        _put_scan_record(
            dynamodb_boto_client,
            file_scan_dynamodb_table,
            pending_file_id,
            user.user_id,
            FileScanStatus.PENDING,
        )

        # After the first valid lookup, corrupt the record so the next poll
        # raises InvalidFileScanRecordError.
        real_get_item = DynamoDBClient.get_item
        first_call = {"done": False}

        def wrapped_get_item(self, *args, **kwargs):
            result = real_get_item(self, *args, **kwargs)
            if not first_call["done"]:
                first_call["done"] = True
                dynamodb_boto_client.put_item(
                    TableName=file_scan_dynamodb_table,
                    Item={
                        "file_id": {"S": str(pending_file_id)},
                        "user_id": {"S": str(user.user_id)},
                        "status": {"S": "not-a-real-status"},
                    },
                )
            return result

        monkeypatch.setattr(DynamoDBClient, "get_item", wrapped_get_item)

        with caplog.at_level("ERROR"):
            try:
                resp = client.get(
                    _build_url(pending_file_id),
                    headers={"X-SGG-Token": user_auth_token},
                )
                # Consume what was emitted before the exception aborted the stream.
                body = resp.get_data(as_text=True)
            except Exception:
                # If the test client propagates the exception from inside the
                # generator (Flask's default behavior with TESTING=True), that
                # is equally acceptable -- the stream aborted loudly.
                body = ""

        abort_records = [
            r
            for r in caplog.records
            if r.message == "Invalid file scan record encountered mid-stream, aborting"
        ]
        assert len(abort_records) == 1
        record = abort_records[0]
        assert record.pending_file_id == pending_file_id
        assert record.user_id == user.user_id
        assert record.exc_info is not None

        # If the test client returned a response, it should only contain the
        # first (valid) chunk -- the abort happened before any further chunks
        # were yielded.
        if body:
            chunks = [json.loads(line) for line in body.splitlines() if line.strip()]
            assert chunks == [{"data": {"status": FileScanStatus.PENDING.value}}]
