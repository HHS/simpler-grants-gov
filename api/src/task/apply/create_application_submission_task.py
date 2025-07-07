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
import logging


logger = logging.getLogger(__name__)


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
        original_filename = file_name
        while file_name in self.file_names_in_zip:
            file_name = f"{i}-{original_filename}"
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
            try:
                self.process_application(application)
            except Exception:
                # If for whatever reason we fail to create an application
                # submission, we'll log an error and continue on, hoping
                # we can process a different one.
                logger.exception("Failed to create an application submission", extra={"application_id": application.application_id})

    def fetch_applications(self) -> Sequence[Application]:
        # TODO - fetch more
        return self.db_session.scalars(
            select(Application)
            .where(Application.application_status == ApplicationStatus.SUBMITTED)
            .options(
                selectinload(Application.application_attachments),
                selectinload(Application.application_forms),
                selectinload(Application.competition)
            )
        ).all()

    def process_application(self, application: Application) -> str: # TODO - don't return anything
        """TODO"""
        logger.info("Processing application submission", extra={"application_id": application.application_id})
        self.increment(self.Metrics.APPLICATION_PROCESSED_COUNT)

        s3_path = build_s3_application_submission_path(self.s3_config, application)
        with file_util.open_stream(s3_path, "wb") as outfile:
            with zipfile.ZipFile(outfile, "w") as submission_zip:

                submission_container = SubmissionContainer(application, submission_zip)
                # TODO - when we add PDF form logic, call it here.
                self.process_application_attachments(submission_container)
                # TODO - when we add the metadata logic, add it here

        # TODO - add submission path to the DB

        application.application_status = ApplicationStatus.ACCEPTED

        return s3_path

    def process_application_attachments(self, submission: SubmissionContainer) -> None:
        for application_attachment in submission.application.application_attachments:
            with file_util.open_stream(application_attachment.file_location, "rb") as attachment_file:

                # Copy the contents of the file to the ZIP, renaming the file if it has
                # the same filename as something already in the ZIP
                file_name_in_zip = submission.get_file_name_in_zip(application_attachment.file_name)
                with submission.submission_zip.open(file_name_in_zip, "w") as file_in_zip:
                    file_in_zip.write(attachment_file.read())

                # TODO - add metadata here about the file.

def build_s3_application_submission_path(s3_config: S3Config, application: Application) -> str:
    """TODO"""
    base_path = s3_config.draft_files_bucket_path

    return file_util.join(
        base_path,
        "applications",
        str(application.application_id),
        "submissions",
        #str() # TODO - submission ID should be here
        f"submission-{application.application_id}.zip"
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
