import uuid
import zipfile
from pathlib import Path
from typing import Sequence

from src.adapters.aws import S3Config
from src.adapters.db import flask_db
from src.constants.lookup_constants import ApplicationStatus
from src.db.models.competition_models import Application, ApplicationAttachment
from src.task import task_blueprint
from src.task.ecs_background_task import ecs_background_task
from src.task.task import Task
from enum import StrEnum
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.util import file_util
from dataclasses import dataclass, field
import src.adapters.db as db

@dataclass
class SubmissionContainer:

    application: Application
    submission_zip: zipfile.ZipFile

    manifest_text: str = ""

    file_names_in_zip: set[str] = field(default_factory=set)

    def get_file_name_in_zip(self, file_name: str) -> str:
        if file_name not in self.file_names_in_zip:
            self.file_names_in_zip.add(file_name)
            return file_name

        i = 1
        file_path = Path(file_name)
        while file_name in self.file_names_in_zip:
            file_name = file_path.stem + f"-{i}" + "".join(file_path.suffixes)
            i+= 1

        self.file_names_in_zip.add(file_name)
        return file_name

class CreateApplicationSubmissionTask(Task):

    def __init__(self, db_session: db.Session, s3_config: S3Config | None = None):
        super().__init__(db_session)
        if s3_config is None:
            s3_config = S3Config()
        self.s3_config = s3_config

    class Metrics(StrEnum):
        APPLICATION_PROCESSED_COUNT = "application_processed_count"

    def run_task(self) -> None:
        submitted_applications = self.fetch_applications()

        for application in submitted_applications:
            self.process_application(application)

    def fetch_applications(self) -> Sequence[Application]:
        # TODO - fetch more
        return self.db_session.scalars(select(Application).where(Application.application_status == ApplicationStatus.SUBMITTED)).all()

    def process_application(self, application: Application) -> None:
        """TODO"""
        self.increment(self.Metrics.APPLICATION_PROCESSED_COUNT)

        s3_path = build_s3_application_submission_path(self.s3_config, application)
        with file_util.open_stream(s3_path, "wb") as outfile:
            with zipfile.ZipFile(outfile, "w") as submission_zip:

                submission_container = SubmissionContainer(application, submission_zip)

                self.process_application_attachments(submission_container)

        # TODO
        # application.application_status = ApplicationStatus.ACCEPTED


    def process_application_attachments(self, submission: SubmissionContainer) -> None:
        for application_attachment in submission.application.application_attachments:
            with file_util.open_stream(application_attachment.file_location, "rb") as attachment_file:

                # Handle duplicate file names in zip

                with submission.submission_zip.open(application_attachment.file_name, "w") as file_in_zip:
                    file_in_zip.write(attachment_file.read())


def build_s3_application_submission_path(s3_config: S3Config, application: Application) -> str:
    """TODO"""
    base_path = s3_config.draft_files_bucket_path

    return file_util.join(
        base_path,
        "applications",
        str(application.application_id),
        "submissions",
        #str() # TODO - submission ID should be here
        "submission-123.zip" # TODO - actual name from something
    )

def adjust_file_name_for_dupes(file_name: str) -> str:
    """We make certain files aren't duplicate
    by adjusting the filename to include a random UUID

    For example "my_file.txt" becomes "my_file-11c70823-3277-4f23-96b8-aef946e97b83.txt
    """

    file_path = Path(file_name)

    return file_path.stem + f"-{uuid.uuid4()}" + file_path.suffix



@task_blueprint.cli.command(
    "create-application-submission",
    help="Create application submissions for all submitted apps",
)
@flask_db.with_db_session()
@ecs_background_task(task_name="create-application-submission")
def create_application_submission(db_session: db.Session) -> None:
    CreateApplicationSubmissionTask(db_session).run()
