import logging
from collections.abc import Sequence
from enum import StrEnum

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.adapters.aws import S3Config
from src.adapters.db import flask_db
from src.constants.lookup_constants import ApplicationStatus, JobType
from src.db.models.competition_models import Application, ApplicationForm
from src.services.applications.create_application_submission import (
    ApplicationSubmissionBuilder,
    create_internal_token_for_pdf_generation,
)
from src.services.pdf_generation.config import PdfGenerationConfig
from src.task.ecs_background_task import ecs_background_task
from src.task.task import Task
from src.task.task_blueprint import task_blueprint
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


class ApplicationSubmissionConfig(PydanticBaseEnvConfig):

    application_submission_batch_size: int = 25  # APPLICATION_SUBMISSION_BATCH_SIZE
    application_submission_max_batches: int = 100  # APPLICATION_SUBMISSION_MAX_BATCHES


class CreateApplicationSubmissionTask(Task):

    def __init__(
        self,
        db_session: db.Session,
        s3_config: S3Config | None = None,
        pdf_generation_config: PdfGenerationConfig | None = None,
    ):
        super().__init__(db_session)
        if s3_config is None:
            s3_config = S3Config()
        self.s3_config = s3_config

        self.app_submission_config = ApplicationSubmissionConfig()
        if pdf_generation_config is None:
            pdf_generation_config = PdfGenerationConfig()
        self.pdf_generation_config = pdf_generation_config
        self.has_more_to_process = True

        # Create a single internal token for the entire job lifecycle
        self.internal_token = create_internal_token_for_pdf_generation(
            db_session, self.pdf_generation_config
        )

        # The builder holds the actual submission-building logic, shared
        # with the application submission workflow.
        self.submission_builder = ApplicationSubmissionBuilder(
            db_session=db_session,
            s3_config=self.s3_config,
            pdf_generation_config=self.pdf_generation_config,
            internal_token=self.internal_token,
            increment=self.increment,
        )

    class Metrics(StrEnum):
        APPLICATION_PROCESSED_COUNT = "application_processed_count"
        APPLICATION_FORM_COUNT = "application_form_count"
        APPLICATION_ATTACHMENT_COUNT = "application_attachment_count"

        ERROR_COUNT = "error_count"

    def run_task(self) -> None:
        batch_num = 0
        while self.has_more_to_process:
            batch_num += 1
            with self.db_session.begin():
                self.process_batch()

                # If we process more batches than the configured max
                # break just in case our logic allowed for an infinite loop
                if batch_num > self.app_submission_config.application_submission_max_batches:
                    logger.error(
                        "Application submission job has run %s batches, stopping furhter processing in case job is stuck",
                        self.app_submission_config.application_submission_max_batches,
                    )
                    break

            # As a safety net, expire all references in session after running
            # This evicts the cache of SQLAlchemy so it pulls from the DB
            # regardless of any internal cache it might have on subsequent loops.
            self.db_session.expire_all()

    def process_batch(self) -> None:
        """Process a batch of application submissions"""
        submitted_applications = self.fetch_applications()

        for application in submitted_applications:
            try:
                self.process_application(application)
            except Exception:
                # If for whatever reason we fail to create an application
                # submission, we'll log an error and continue on, hoping
                # we can process a different one.
                logger.exception(
                    "Failed to create an application submission",
                    extra={"application_id": application.application_id},
                )
                self.increment(self.Metrics.ERROR_COUNT)

        # Assume if we had fewer than the batch size, we don't have anything else to process
        if (
            len(submitted_applications)
            < self.app_submission_config.application_submission_batch_size
        ):
            self.has_more_to_process = False

    def fetch_applications(self) -> Sequence[Application]:
        """Fetch the applications that have been submitted"""
        return self.db_session.scalars(
            select(Application)
            .where(Application.application_status == ApplicationStatus.SUBMITTED)
            .options(
                selectinload(Application.application_attachments),
                selectinload(Application.application_forms).selectinload(
                    ApplicationForm.competition_form
                ),
                selectinload(Application.competition),
            )
            # We only fetch a limited number of apps in a batch so that we're
            # processing and committing them quicker.
            .limit(self.app_submission_config.application_submission_batch_size)
            # Skip any application currently locked by the application submission
            # workflow so we never build the same submission twice. Anything
            # skipped is either about to be ACCEPTED by the workflow or will be
            # picked up on our next run.
            .with_for_update(skip_locked=True)
        ).all()

    def process_application(self, application: Application) -> None:
        """Process an application and create an application submission"""
        self.submission_builder.build_submission(application)


@task_blueprint.cli.command(
    "create-application-submission",
    help="Create application submissions for all submitted apps",
)
@flask_db.with_db_session()
@ecs_background_task(task_name=JobType.CREATE_APPLICATION_SUBMISSION)
def create_application_submission(db_session: db.Session) -> None:
    CreateApplicationSubmissionTask(db_session).run()
