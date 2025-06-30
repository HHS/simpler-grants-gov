import zipfile
from io import BytesIO

import pytest

from src.db.models.competition_models import Application
from src.task.apply.create_application_submission_task import SubmissionContainer
from tests.conftest import BaseTestClass
from tests.src.db.models.factories import ApplicationFactory


class TestCreateApplicationSubmissionTask(BaseTestClass):

    @pytest.fixture(autouse=True)
    def cleanup(self, db_session):
        pass # TODO


def test_get_file_name_in_zip():
    with BytesIO() as bytes_stream:
        container = SubmissionContainer(ApplicationFactory.build(), zipfile.ZipFile(bytes_stream, mode="w"))

        assert container.get_file_name_in_zip("my_file.txt") == "my_file.txt"
        assert container.get_file_name_in_zip("my_file.txt") == "my_file-1.txt"
        assert container.get_file_name_in_zip("my_file.txt") == "my_file-2.txt"

        assert container.get_file_name_in_zip("no_suffix") == "no_suffix"
        assert container.get_file_name_in_zip("no_suffix") == "no_suffix-1"


        assert container.get_file_name_in_zip("multiple_suffix.txt.zip") == "multiple_suffix.txt.zip"
        assert container.get_file_name_in_zip("multiple_suffix.txt.zip") == "multiple_suffix-1.txt.zip"
