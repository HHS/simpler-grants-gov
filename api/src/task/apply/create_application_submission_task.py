import uuid
import zipfile
from typing import Sequence

from src.adapters.aws import S3Config
from src.adapters.db import flask_db
from src.constants.lookup_constants import ApplicationStatus
from src.db.models.competition_models import Application, ApplicationSubmission
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

from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


@dataclass
class SubmissionContainer:

    application: Application
    submission_zip: zipfile.ZipFile

    # TODO - when we build the manifest file, we might not want to
    # just build raw text, but will leave that to that particular ticket to sort out.
    manifest_text: str = "TODO"

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

class ApplicationSubmissionConfig(PydanticBaseEnvConfig):
    pass

class CreateApplicationSubmissionTask(Task):

    def __init__(self, db_session: db.Session, s3_config: S3Config | None = None):
        super().__init__(db_session)
        if s3_config is None:
            s3_config = S3Config()
        self.s3_config = s3_config



    class Metrics(StrEnum):
        APPLICATION_PROCESSED_COUNT = "application_processed_count"
        APPLICATION_FORM_COUNT = "application_form_count"
        APPLICATION_ATTACHMENT_COUNT = "application_attachment_count"

        ERROR_COUNT = "error_count"


    def run_task(self) -> None:
        # TODO - batch this
        with self.db_session.begin():
            submitted_applications = self.fetch_applications()

            for application in submitted_applications:
                try:
                    self.process_application(application)
                except Exception:
                    # If for whatever reason we fail to create an application
                    # submission, we'll log an error and continue on, hoping
                    # we can process a different one.
                    logger.exception("Failed to create an application submission", extra={"application_id": application.application_id})
                    self.increment(self.Metrics.ERROR_COUNT)

    def run_batch(self):
        submitted_applications = self.fetch_applications()

        for application in submitted_applications:
            try:
                self.process_application(application)
            except Exception:
                # If for whatever reason we fail to create an application
                # submission, we'll log an error and continue on, hoping
                # we can process a different one.
                logger.exception("Failed to create an application submission", extra={"application_id": application.application_id})
                self.increment(self.Metrics.ERROR_COUNT)

    def fetch_applications(self) -> Sequence[Application]:
        """Fetch the applications that have been submitted"""

        # TODO - I should batch this in some way
        return self.db_session.scalars(
            select(Application)
            .where(Application.application_status == ApplicationStatus.SUBMITTED)
            .options(
                selectinload(Application.application_attachments),
                selectinload(Application.application_forms),
                selectinload(Application.competition)
            )
        ).all()

    def process_application(self, application: Application) -> None:
        """Process an application and create an application submission"""
        logger.info("Processing application submission", extra={"application_id": application.application_id, "competition_id": application.competition_id})
        self.increment(self.Metrics.APPLICATION_PROCESSED_COUNT)

        submission_id = uuid.uuid4()
        s3_path = build_s3_application_submission_path(self.s3_config, application, submission_id)
        with file_util.open_stream(s3_path, "wb") as outfile:
            with zipfile.ZipFile(outfile, "w") as submission_zip:

                submission_container = SubmissionContainer(application, submission_zip)

                self.process_application_forms(submission_container)
                self.process_application_attachments(submission_container)
                self.create_manifest_file(submission_container)

        # Get the size of the zip from s3
        zip_length = file_util.get_file_length_bytes(s3_path)

        # Create the submission record in the DB and mark the app as accepted
        application_submission = ApplicationSubmission(
            application_submission_id=submission_id,
            application=application,
            file_location=s3_path,
            file_size_bytes=zip_length
        )
        self.db_session.add(application_submission)
        application.application_status = ApplicationStatus.ACCEPTED


    def process_application_forms(self, submission: SubmissionContainer) -> None:
        """Turn an application form into a PDF and add to the zip file"""
        log_extra = {"application_id": submission.application.application_id, "competition_id": submission.application.competition_id}
        logger.info("Processing application forms for application submission")
        for application_form in submission.application.application_forms:
            logger.info("Adding application form to application submission zip", extra=log_extra | {"application_form_id": application_form.application_form_id})
            self.increment(self.Metrics.APPLICATION_FORM_COUNT)
            # TODO - when we add PDF form logic - do it here
            # TODO - when we add the manifest logic, add it here

    def process_application_attachments(self, submission: SubmissionContainer) -> None:
        """Add application attachments to the zip file"""
        log_extra = {"application_id": submission.application.application_id, "competition_id": submission.application.competition_id}
        logger.info("Processing attachments for application submission", extra=log_extra)

        for application_attachment in submission.application.application_attachments:
            logger.info("Adding attachment to application submission zip", extra=log_extra | {"application_attachment_id": application_attachment.application_attachment_id})
            self.increment(self.Metrics.APPLICATION_ATTACHMENT_COUNT)

            with file_util.open_stream(application_attachment.file_location, "rb") as attachment_file:
                # Copy the contents of the file to the ZIP, renaming the file if it has
                # the same filename as something already in the ZIP
                file_name_in_zip = submission.get_file_name_in_zip(application_attachment.file_name)
                with submission.submission_zip.open(file_name_in_zip, "w") as file_in_zip:
                    file_in_zip.write(attachment_file.read())

                # TODO - add metadata here about the file for the manifest.

    def create_manifest_file(self, submission: SubmissionContainer) -> None:
        """Add a manifest file to the zip"""
        log_extra = {"application_id": submission.application.application_id, "competition_id": submission.application.competition_id}
        logger.info("Adding manifest file to application submission zip", extra=log_extra)

        with submission.submission_zip.open("manifest.txt", "w") as metadata_file:
            metadata_file.write(submission.manifest_text.encode("utf-8"))

def build_s3_application_submission_path(s3_config: S3Config, application: Application, submission_id: uuid.UUID) -> str:
    """Construct a path to the application submission on s3

    Will be formatted like:

        s3://<bucket>/applications/<application_id>/submissions/<submission_id>/<file_name>
    """
    base_path = s3_config.draft_files_bucket_path

    return file_util.join(
        base_path,
        "applications",
        str(application.application_id),
        "submissions",
        str(submission_id),
        # In the future we may want to name the file with something a bit more human-readable
        # than a UUID, but that's what we're going with for now.
        f"submission-{application.application_id}.zip"
    )


@task_blueprint.cli.command(
    "create-application-submission",
    help="Create application submissions for all submitted apps",
)
@flask_db.with_db_session()
@ecs_background_task(task_name="create-application-submission")
def create_application_submission(db_session: db.Session) -> None:
    CreateApplicationSubmissionTask(db_session).run()
