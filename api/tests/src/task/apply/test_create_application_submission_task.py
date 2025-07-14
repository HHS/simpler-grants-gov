import zipfile
from io import BytesIO

import pytest
from sqlalchemy import update

from src.constants.lookup_constants import ApplicationStatus
from src.db.models.competition_models import Application
from src.task.apply.create_application_submission_task import (
    CreateApplicationSubmissionTask,
    SubmissionContainer,
)
from src.util import file_util
from tests.conftest import BaseTestClass
from tests.src.db.models.factories import ApplicationAttachmentFactory, ApplicationFactory


def validate_files_in_zip(zip_file_path, expected_file_mapping):
    with file_util.open_stream(zip_file_path, "rb") as f:
        with zipfile.ZipFile(f) as submission_zip:
            # Make sure the files we expect are present
            file_names_in_zip = {info.filename for info in submission_zip.infolist()}
            assert file_names_in_zip == expected_file_mapping.keys()

            # For each file in the zip, verify the contents match (if something passed in)
            for file_name, expected_contents in expected_file_mapping.items():
                with submission_zip.open(file_name) as file_in_zip:
                    if expected_contents is not None:
                        assert file_in_zip.read() == expected_contents.encode()
                    else:
                        assert file_in_zip.read() is not None


class TestCreateApplicationSubmissionTask(BaseTestClass):

    @pytest.fixture(autouse=True)
    def cleanup(self, db_session, enable_factory_create):
        # Rather than deleting apps from other tests, just
        # adjust their statuses so they don't get picked up by this test
        db_session.execute(
            update(Application).values(application_status=ApplicationStatus.ACCEPTED)
        )
        db_session.commit()

    @pytest.fixture
    def create_submission_task(self, db_session, s3_config):
        return CreateApplicationSubmissionTask(db_session)

    def test_run_task(self, db_session, create_submission_task):
        application_without_attachments = ApplicationFactory.create(
            with_forms=True, application_status=ApplicationStatus.SUBMITTED
        )

        application_with_attachments = ApplicationFactory.create(
            with_forms=True, application_status=ApplicationStatus.SUBMITTED
        )
        ApplicationAttachmentFactory.create(
            application=application_with_attachments,
            file_name="file_a.txt",
            file_contents="contents of file A",
        )
        ApplicationAttachmentFactory.create(
            application=application_with_attachments,
            file_name="file_b.txt",
            file_contents="contents of file B",
        )
        ApplicationAttachmentFactory.create(
            application=application_with_attachments,
            file_name="dupe_filename.txt",
            file_contents="contents of first dupe_filename.txt",
        )
        ApplicationAttachmentFactory.create(
            application=application_with_attachments,
            file_name="dupe_filename.txt",
            file_contents="contents of second dupe_filename.txt",
        )

        # These apps won't get picked up at all because of their status
        not_picked_up_app1 = ApplicationFactory.create(
            with_forms=True, application_status=ApplicationStatus.IN_PROGRESS
        )
        not_picked_up_app2 = ApplicationFactory.create(
            with_forms=True, application_status=ApplicationStatus.ACCEPTED
        )

        create_submission_task.run()

        # Validate the submission without attachments
        assert application_without_attachments.application_status == ApplicationStatus.ACCEPTED
        assert len(application_without_attachments.application_submissions) == 1
        no_attachment_submission = application_without_attachments.application_submissions[0]
        validate_files_in_zip(
            no_attachment_submission.file_location,
            {
                # No attachments (and no PDFs yet) - just a manifest
                "manifest.txt": "TODO"
            },
        )
        assert no_attachment_submission.file_size_bytes > 0

        # Validate the submission with attachments
        assert application_with_attachments.application_status == ApplicationStatus.ACCEPTED
        assert len(application_with_attachments.application_submissions) == 1
        attachment_submission = application_with_attachments.application_submissions[0]

        validate_files_in_zip(
            attachment_submission.file_location,
            {
                "file_a.txt": "contents of file A",
                "file_b.txt": "contents of file B",
                "dupe_filename.txt": "contents of first dupe_filename.txt",
                "1-dupe_filename.txt": "contents of second dupe_filename.txt",
                "manifest.txt": "TODO",
            },
        )

        # These weren't picked up
        assert len(not_picked_up_app1.application_submissions) == 0
        assert len(not_picked_up_app2.application_submissions) == 0

        metrics = create_submission_task.metrics
        assert metrics[create_submission_task.Metrics.APPLICATION_PROCESSED_COUNT] == 2
        assert metrics[create_submission_task.Metrics.APPLICATION_ATTACHMENT_COUNT] == 4
        apps_processed = [application_with_attachments, application_without_attachments]
        assert metrics[create_submission_task.Metrics.APPLICATION_FORM_COUNT] == sum(
            [len(app.application_forms) for app in apps_processed]
        )

    def test_run_task_with_erroring_application(
        self, db_session, create_submission_task, monkeypatch
    ):
        application = ApplicationFactory.create(
            with_forms=True, application_status=ApplicationStatus.SUBMITTED
        )

        def erroring_function():
            raise Exception("It errors")

        monkeypatch.setattr(
            create_submission_task, "process_application_attachments", erroring_function
        )

        create_submission_task.run_task()

        # App was not updated
        db_session.refresh(application)
        assert application.application_status == ApplicationStatus.SUBMITTED
        assert len(application.application_submissions) == 0

        metrics = create_submission_task.metrics
        assert metrics[create_submission_task.Metrics.APPLICATION_PROCESSED_COUNT] == 1
        assert metrics[create_submission_task.Metrics.ERROR_COUNT] == 1


def test_get_file_name_in_zip():
    container = SubmissionContainer(
        ApplicationFactory.build(), zipfile.ZipFile(BytesIO(), mode="w")
    )

    assert container.get_file_name_in_zip("my_file.txt") == "my_file.txt"
    assert container.get_file_name_in_zip("my_file.txt") == "1-my_file.txt"
    assert container.get_file_name_in_zip("my_file.txt") == "2-my_file.txt"
    assert container.get_file_name_in_zip("my_file.txt") == "3-my_file.txt"
    assert container.get_file_name_in_zip("2-my_file.txt") == "1-2-my_file.txt"

    assert container.get_file_name_in_zip("no_suffix") == "no_suffix"
    assert container.get_file_name_in_zip("no_suffix") == "1-no_suffix"

    assert container.get_file_name_in_zip("multiple_suffix.txt.zip") == "multiple_suffix.txt.zip"
    assert container.get_file_name_in_zip("multiple_suffix.txt.zip") == "1-multiple_suffix.txt.zip"
