import zipfile
from io import BytesIO

import pytest

from src.constants.lookup_constants import ApplicationStatus
from src.db.models.competition_models import Application
from src.task.apply.create_application_submission_task import SubmissionContainer, CreateApplicationSubmissionTask
from src.util import file_util
from tests.conftest import BaseTestClass
from tests.src.db.models.factories import ApplicationFactory, ApplicationAttachmentFactory


class TestCreateApplicationSubmissionTask(BaseTestClass):

    @pytest.fixture(autouse=True)
    def cleanup(self, db_session, enable_factory_create):
        pass # TODO

    @pytest.fixture
    def create_submission_task(self, db_session, s3_config):
        return CreateApplicationSubmissionTask(db_session)

    def test_run_task(self, db_session, create_submission_task):
        application_without_attachments = ApplicationFactory.create(with_forms=True, application_status=ApplicationStatus.SUBMITTED)


        application_with_attachments = ApplicationFactory.create(with_forms=True, application_status=ApplicationStatus.SUBMITTED)
        ApplicationAttachmentFactory.create(application=application_with_attachments, file_name="file_a.txt")
        ApplicationAttachmentFactory.create(application=application_with_attachments, file_name="file_b.txt")
        ApplicationAttachmentFactory.create(application=application_with_attachments, file_name="dupe_filename.txt")
        ApplicationAttachmentFactory.create(application=application_with_attachments, file_name="dupe_filename.txt")

        create_submission_task.run()

        print(create_submission_task.metrics)

    def test_process_application_with_attachments(self, db_session, create_submission_task):
        application_with_attachments = ApplicationFactory.create(with_forms=True, application_status=ApplicationStatus.SUBMITTED)
        ApplicationAttachmentFactory.create(application=application_with_attachments, file_name="file_a.txt", file_contents="contents of file A")
        ApplicationAttachmentFactory.create(application=application_with_attachments, file_name="file_b.txt", file_contents="contents of file B")
        ApplicationAttachmentFactory.create(application=application_with_attachments, file_name="dupe_filename.txt", file_contents="contents of first dupe_filename.txt")
        ApplicationAttachmentFactory.create(application=application_with_attachments, file_name="dupe_filename.txt", file_contents="contents of second dupe_filename.txt")


        path = create_submission_task.process_application(application_with_attachments)

        with file_util.open_stream(path, "rb") as f:
            with zipfile.ZipFile(f) as submission_zip:
                with submission_zip.open("file_a.txt") as myfile:
                    assert myfile.read() == b"contents of file A"

def test_get_file_name_in_zip():
    with BytesIO() as bytes_stream:
        container = SubmissionContainer(ApplicationFactory.build(), zipfile.ZipFile(bytes_stream, mode="w"))

        assert container.get_file_name_in_zip("my_file.txt") == "my_file.txt"
        assert container.get_file_name_in_zip("my_file.txt") == "1-my_file.txt"
        assert container.get_file_name_in_zip("my_file.txt") == "2-my_file.txt"
        assert container.get_file_name_in_zip("my_file.txt") == "3-my_file.txt"
        assert container.get_file_name_in_zip("2-my_file.txt") == "1-2-my_file.txt"

        assert container.get_file_name_in_zip("no_suffix") == "no_suffix"
        assert container.get_file_name_in_zip("no_suffix") == "1-no_suffix"


        assert container.get_file_name_in_zip("multiple_suffix.txt.zip") == "multiple_suffix.txt.zip"
        assert container.get_file_name_in_zip("multiple_suffix.txt.zip") == "1-multiple_suffix.txt.zip"
