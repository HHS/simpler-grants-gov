import zipfile
from typing import Sequence

from src.adapters.aws import S3Config
from src.constants.lookup_constants import ApplicationStatus
from src.db.models.competition_models import Application, ApplicationAttachment
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

class CreateApplicationSubmissionTask(Task):

    def __init__(self, db_session: db.Session, s3_config: S3Config):
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
                # TODO - file name stuff
                submission.submission_zip.write(attachment_file, arcname=application_attachment.file_name)


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