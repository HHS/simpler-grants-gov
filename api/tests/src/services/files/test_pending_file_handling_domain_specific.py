import uuid
from unittest.mock import patch

import pytest
from apiflask.exceptions import HTTPError

import tests.src.db.models.factories as factories
from src.constants.lookup_constants import FileScanStatus
from src.services.files.pending_file_handling_domain_specific import (
    fetch_and_validate_scan_complete_file,
    move_pending_file_to_destination,
)
from src.util import file_util
from tests.conftest import BaseTestClass


class TestValidateAndFetchPendingFile(BaseTestClass):
    @pytest.fixture
    def user(self, enable_factory_create):
        return factories.UserFactory.create()

    @pytest.fixture
    def other_user(self, enable_factory_create):
        return factories.UserFactory.create()

    @pytest.fixture
    def pending_file_complete(self, enable_factory_create, user):
        return factories.PendingFileFactory.create(
            user=user, file_scan_status=FileScanStatus.COMPLETE
        )

    def test_fetch_and_validate_scan_complete_file_success(
        self, db_session, user, pending_file_complete
    ):
        result = fetch_and_validate_scan_complete_file(
            db_session, pending_file_complete.pending_file_id, user
        )

        assert result.pending_file_id == pending_file_complete.pending_file_id
        assert result.user_id == user.user_id
        assert result.file_scan_status == FileScanStatus.COMPLETE

    def test_fetch_and_validate_scan_complete_file_not_found(self, db_session, user):
        non_existent_id = uuid.uuid4()

        with pytest.raises(HTTPError) as exc_info:
            fetch_and_validate_scan_complete_file(db_session, non_existent_id, user)

        assert exc_info.value.status_code == 404
        assert exc_info.value.message == "Pending file not found"

    def test_fetch_and_validate_scan_complete_file_wrong_user(
        self, db_session, other_user, pending_file_complete
    ):
        with pytest.raises(HTTPError) as exc_info:
            fetch_and_validate_scan_complete_file(
                db_session, pending_file_complete.pending_file_id, other_user
            )

        assert exc_info.value.status_code == 403
        assert "permission" in exc_info.value.message.lower()

    def test_fetch_and_validate_scan_complete_file_not_complete_pending(
        self, enable_factory_create, db_session, user
    ):
        pending_file = factories.PendingFileFactory.create(
            user=user, file_scan_status=FileScanStatus.PENDING
        )

        with pytest.raises(HTTPError) as exc_info:
            fetch_and_validate_scan_complete_file(db_session, pending_file.pending_file_id, user)

        assert exc_info.value.status_code == 422
        assert "pending" in exc_info.value.extra_data["file_status"].lower()

    def test_fetch_and_validate_scan_complete_file_not_complete_in_progress(
        self, enable_factory_create, db_session, user
    ):
        pending_file = factories.PendingFileFactory.create(
            user=user, file_scan_status=FileScanStatus.IN_PROGRESS
        )

        with pytest.raises(HTTPError) as exc_info:
            fetch_and_validate_scan_complete_file(db_session, pending_file.pending_file_id, user)

        assert exc_info.value.status_code == 422
        assert "in_progress" in exc_info.value.extra_data["file_status"].lower()

    def test_fetch_and_validate_scan_complete_file_not_complete_infected(
        self, enable_factory_create, db_session, user
    ):
        pending_file = factories.PendingFileFactory.create(
            user=user, file_scan_status=FileScanStatus.INFECTED
        )

        with pytest.raises(HTTPError) as exc_info:
            fetch_and_validate_scan_complete_file(db_session, pending_file.pending_file_id, user)

        assert exc_info.value.status_code == 422
        assert "infected" in exc_info.value.extra_data["file_status"].lower()

    def test_fetch_and_validate_scan_complete_file_already_processed(
        self, enable_factory_create, db_session, user
    ):
        pending_file = factories.PendingFileFactory.create(
            user=user, file_scan_status=FileScanStatus.PROCESSED
        )

        with pytest.raises(HTTPError) as exc_info:
            fetch_and_validate_scan_complete_file(db_session, pending_file.pending_file_id, user)

        assert exc_info.value.status_code == 422
        assert "processed" in exc_info.value.extra_data["file_status"].lower()


class TestMovePendingFileToDestination(BaseTestClass):
    @pytest.fixture
    def user(self, enable_factory_create):
        return factories.UserFactory.create()

    @pytest.fixture
    def pending_file_complete(self, enable_factory_create, user, mock_s3_bucket):
        source_location = f"s3://{mock_s3_bucket}/unscanned/test-file.pdf"
        file_util.write_to_file(source_location, "test file content")
        return factories.PendingFileFactory.create(
            user=user,
            file_scan_status=FileScanStatus.COMPLETE,
            file_location=source_location,
        )

    def test_move_pending_file_to_destination_success(
        self, db_session, pending_file_complete, mock_s3_bucket
    ):
        destination_path = f"s3://{mock_s3_bucket}/final/test-file.pdf"
        source_location = pending_file_complete.file_location

        # Verify source file exists before move
        assert file_util.file_exists(source_location)

        move_pending_file_to_destination(pending_file_complete, destination_path)
        db_session.commit()

        # Verify file was moved
        assert file_util.file_exists(destination_path)
        assert not file_util.file_exists(source_location)

        db_session.refresh(pending_file_complete)
        assert pending_file_complete.file_scan_status == FileScanStatus.PROCESSED

    def test_move_pending_file_to_destination_updates_status(
        self, db_session, pending_file_complete, mock_s3_bucket
    ):
        destination_path = f"s3://{mock_s3_bucket}/final/test-file.pdf"

        assert pending_file_complete.file_scan_status == FileScanStatus.COMPLETE

        move_pending_file_to_destination(pending_file_complete, destination_path)
        db_session.commit()

        assert pending_file_complete.file_scan_status == FileScanStatus.PROCESSED

    def test_move_pending_file_to_destination_move_file_called_with_correct_args(
        self, db_session, user, enable_factory_create, mock_s3_bucket
    ):
        source_location = f"s3://{mock_s3_bucket}/unscanned/file.pdf"
        destination_path = f"s3://{mock_s3_bucket}/final/file.pdf"

        # Create the source file in S3
        file_util.write_to_file(source_location, "test file content")

        pending_file = factories.PendingFileFactory.create(
            user=user,
            file_scan_status=FileScanStatus.COMPLETE,
            file_location=source_location,
        )

        # Verify source file exists before move
        assert file_util.file_exists(source_location)

        move_pending_file_to_destination(pending_file, destination_path)
        db_session.commit()

        # Verify file was moved (exists at destination, not at source)
        assert file_util.file_exists(destination_path)
        assert not file_util.file_exists(source_location)

        # Verify content is preserved
        moved_content = file_util.read_file(destination_path)
        assert moved_content == "test file content"

    @patch("src.services.files.pending_file_handling_domain_specific.file_util.move_file")
    def test_move_pending_file_to_destination_handles_move_failure(
        self, mock_move_file, db_session, user, enable_factory_create, mock_s3_bucket
    ):
        # For error testing, we still mock to simulate failure
        source_location = f"s3://{mock_s3_bucket}/unscanned/error-test.pdf"
        file_util.write_to_file(source_location, "test file content")

        pending_file = factories.PendingFileFactory.create(
            user=user,
            file_scan_status=FileScanStatus.COMPLETE,
            file_location=source_location,
        )

        mock_move_file.side_effect = Exception("S3 move failed")
        destination_path = f"s3://{mock_s3_bucket}/final/error-test.pdf"

        with pytest.raises(Exception) as exc_info:
            move_pending_file_to_destination(pending_file, destination_path)

        assert "S3 move failed" in str(exc_info.value)
        db_session.refresh(pending_file)
        assert pending_file.file_scan_status == FileScanStatus.COMPLETE


class TestIntegrationValidateAndMove(BaseTestClass):
    @pytest.fixture
    def user(self, enable_factory_create):
        return factories.UserFactory.create()

    @pytest.fixture
    def pending_file_complete(self, enable_factory_create, user, mock_s3_bucket):
        source_location = f"s3://{mock_s3_bucket}/unscanned/workflow-test.pdf"
        file_util.write_to_file(source_location, "workflow test content")
        return factories.PendingFileFactory.create(
            user=user,
            file_scan_status=FileScanStatus.COMPLETE,
            file_location=source_location,
        )

    def test_full_workflow_validate_then_move(
        self, db_session, user, pending_file_complete, mock_s3_bucket
    ):
        validated_file = fetch_and_validate_scan_complete_file(
            db_session, pending_file_complete.pending_file_id, user
        )

        assert validated_file.file_scan_status == FileScanStatus.COMPLETE
        source_location = validated_file.file_location

        destination_path = f"s3://{mock_s3_bucket}/final/workflow-test.pdf"
        move_pending_file_to_destination(validated_file, destination_path)
        db_session.commit()

        # Verify file was moved
        assert file_util.file_exists(destination_path)
        assert not file_util.file_exists(source_location)

        db_session.refresh(validated_file)
        assert validated_file.file_scan_status == FileScanStatus.PROCESSED
