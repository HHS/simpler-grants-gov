import logging
import uuid
import zipfile
from collections.abc import Sequence
from dataclasses import dataclass, field
from datetime import timedelta
from enum import StrEnum

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.adapters.aws import S3Config
from src.adapters.db import flask_db
from src.auth.internal_jwt_auth import create_jwt_for_internal_token
from src.constants.lookup_constants import ApplicationStatus
from src.db.models.competition_models import Application, ApplicationForm, ApplicationSubmission
from src.services.applications.application_validation import is_form_required
from src.services.pdf_generation.config import PdfGenerationConfig
from src.services.pdf_generation.models import PdfGenerationResponse
from src.services.pdf_generation.service import generate_application_form_pdf
from src.services.xml_generation.submission_xml_assembler import SubmissionXMLAssembler
from src.services.xml_generation.utils.attachment_mapping import create_attachment_mapping_from_list
from src.task.ecs_background_task import ecs_background_task
from src.task.task import Task
from src.task.task_blueprint import task_blueprint
from src.util import datetime_util, file_util
from src.util.env_config import PydanticBaseEnvConfig

logger = logging.getLogger(__name__)


@dataclass
class FileMetadata:
    file_name: str
    file_size_in_bytes: int


@dataclass
class SubmissionContainer:

    application: Application
    submission_zip: zipfile.ZipFile
    application_submission: ApplicationSubmission

    form_pdf_metadata: list[FileMetadata] = field(default_factory=list)
    attachment_metadata: list[FileMetadata] = field(default_factory=list)
    xml_metadata: FileMetadata | None = None

    file_names_in_zip: set[str] = field(default_factory=set)
    attachment_filename_overrides: dict[str, str] = field(default_factory=dict)

    def get_file_name_in_zip(self, file_name: str) -> str:
        if file_name not in self.file_names_in_zip:
            self.file_names_in_zip.add(file_name)
            return file_name

        i = 1
        original_filename = file_name
        while file_name in self.file_names_in_zip:
            file_name = f"{i}-{original_filename}"
            i += 1

        self.file_names_in_zip.add(file_name)
        return file_name


class ApplicationSubmissionConfig(PydanticBaseEnvConfig):

    application_submission_batch_size: int = 25  # APPLICATION_SUBMISSION_BATCH_SIZE
    application_submission_max_batches: int = 100  # APPLICATION_SUBMISSION_MAX_BATCHES

    enable_xml_generation: bool = False  # ENABLE_XML_GENERATION


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
        self.internal_token = self._create_internal_token()

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
        ).all()

    def _create_internal_token(self) -> str | None:
        """Create a single internal token for the entire job lifecycle.

        Returns:
            JWT token string, or None if using mocks
        """
        if self.pdf_generation_config.pdf_generation_use_mocks:
            return "mock-token"  # Always provide a token for testing consistency

        # Create token in its own transaction to avoid conflicts
        expires_at = datetime_util.utcnow() + timedelta(
            minutes=self.pdf_generation_config.short_lived_token_expiration_minutes
        )

        token, short_lived_token = create_jwt_for_internal_token(
            expires_at=expires_at, db_session=self.db_session
        )

        # Commit this token creation immediately in its own transaction
        self.db_session.commit()

        logger.info(
            "Created internal token for PDF generation",
            extra={
                "token_id": str(short_lived_token.short_lived_internal_token_id),
                "expires_at": expires_at.isoformat(),
            },
        )

        return token

    def get_pdf_for_app_form(
        self, application_id: uuid.UUID, application_form_id: uuid.UUID
    ) -> "PdfGenerationResponse":
        """Get PDF for an application form, handling errors appropriately.

        If PDF generation fails, we raise an error as we cannot create a submission
        without the required PDFs.
        """
        pdf_response = generate_application_form_pdf(
            db_session=self.db_session,
            application_id=application_id,
            application_form_id=application_form_id,
            use_mocks=self.pdf_generation_config.pdf_generation_use_mocks,
            token=self.internal_token,
        )

        if not pdf_response.success:
            raise Exception(
                f"Failed to generate PDF for application form {application_form_id}: {pdf_response.error_message}"
            )

        return pdf_response

    def process_application(self, application: Application) -> None:
        """Process an application and create an application submission"""
        logger.info(
            "Processing application submission",
            extra={
                "application_id": application.application_id,
                "competition_id": application.competition_id,
            },
        )
        self.increment(self.Metrics.APPLICATION_PROCESSED_COUNT)

        submission_id = uuid.uuid4()
        s3_path = build_s3_application_submission_path(self.s3_config, application, submission_id)

        # Get the tracking number from the sequence before creating the record
        tracking_number = self.db_session.scalar(ApplicationSubmission.legacy_tracking_number_seq)

        # Create the submission object (file size will be updated after zip creation)
        application_submission = ApplicationSubmission(
            application_submission_id=submission_id,
            application=application,
            file_location=s3_path,
            file_size_bytes=0,
            legacy_tracking_number=tracking_number,
        )

        with file_util.open_stream(s3_path, "wb") as outfile:
            with zipfile.ZipFile(outfile, "w") as submission_zip:

                submission_container = SubmissionContainer(
                    application, submission_zip, application_submission
                )

                self.process_application_forms(submission_container)
                self.process_application_attachments(submission_container)
                self.process_xml_generation(submission_container)
                self.create_manifest_file(submission_container)

        # Update the file size now that the zip is complete
        application_submission.file_size_bytes = file_util.get_file_length_bytes(s3_path)
        self.db_session.add(application_submission)

        # Mark the app as accepted
        application.application_status = ApplicationStatus.ACCEPTED

    def process_application_forms(self, submission: SubmissionContainer) -> None:
        """Turn an application form into a PDF and add to the zip file"""
        log_extra = {
            "application_id": submission.application.application_id,
            "competition_id": submission.application.competition_id,
        }
        logger.info("Processing application forms for application submission")
        for application_form in submission.application.application_forms:
            app_form_log_extra = log_extra | {
                "application_form_id": application_form.application_form_id
            }
            if (
                not is_form_required(application_form)
                and not application_form.is_included_in_submission
            ):
                logger.info(
                    "Skipping adding form to submission as it is not required, and marked as not being included in submission",
                    extra=app_form_log_extra,
                )
                continue

            logger.info(
                "Adding application form to application submission zip",
                extra=app_form_log_extra,
            )
            self.increment(self.Metrics.APPLICATION_FORM_COUNT)

            # Generate PDF from the application form
            pdf_response = self.get_pdf_for_app_form(
                submission.application.application_id,
                application_form.application_form_id,
            )

            app_form_file_name = f"{application_form.form.short_form_name}.pdf"
            file_name_in_zip = submission.get_file_name_in_zip(app_form_file_name)

            # PDF generation is now handled in get_pdf_for_app_form which raises on failure
            logger.info(
                "Successfully generated PDF for application form",
                extra=log_extra
                | {
                    "application_form_id": application_form.application_form_id,
                    "pdf_size_bytes": len(pdf_response.pdf_data),
                },
            )
            with submission.submission_zip.open(file_name_in_zip, "w") as file_in_zip:
                file_in_zip.write(pdf_response.pdf_data)

            file_size = submission.submission_zip.getinfo(file_name_in_zip).file_size
            submission.form_pdf_metadata.append(FileMetadata(file_name_in_zip, file_size))

    def process_application_attachments(self, submission: SubmissionContainer) -> None:
        """Add application attachments to the zip file"""
        log_extra = {
            "application_id": submission.application.application_id,
            "competition_id": submission.application.competition_id,
        }
        logger.info("Processing attachments for application submission", extra=log_extra)

        for application_attachment in submission.application.application_attachments:
            logger.info(
                "Adding attachment to application submission zip",
                extra=log_extra
                | {"application_attachment_id": application_attachment.application_attachment_id},
            )
            self.increment(self.Metrics.APPLICATION_ATTACHMENT_COUNT)

            with file_util.open_stream(
                application_attachment.file_location, "rb"
            ) as attachment_file:
                # Copy the contents of the file to the ZIP, renaming the file if it has
                # the same filename as something already in the ZIP
                file_name_in_zip = submission.get_file_name_in_zip(application_attachment.file_name)

                # Track filename overrides if the file was renamed
                if file_name_in_zip != application_attachment.file_name:
                    attachment_id_str = str(application_attachment.application_attachment_id)
                    submission.attachment_filename_overrides[attachment_id_str] = file_name_in_zip

                with submission.submission_zip.open(file_name_in_zip, "w") as file_in_zip:
                    file_in_zip.write(attachment_file.read())

                file_size = submission.submission_zip.getinfo(file_name_in_zip).file_size
                submission.attachment_metadata.append(FileMetadata(file_name_in_zip, file_size))

    def process_xml_generation(self, submission: SubmissionContainer) -> None:
        """Generate GrantApplication.xml and add to zip if feature flag enabled"""
        log_extra = {
            "application_id": submission.application.application_id,
            "competition_id": submission.application.competition_id,
        }
        if not self.app_submission_config.enable_xml_generation:
            logger.info(
                "Skipping XML generation - feature flag disabled",
                extra=log_extra,
            )
            return

        logger.info("Generating XML for application submission", extra=log_extra)

        # Create attachment mapping once for all forms
        attachment_mapping = create_attachment_mapping_from_list(
            submission.application.application_attachments,
            filename_overrides=submission.attachment_filename_overrides,
        )

        xml_assembler = SubmissionXMLAssembler(
            submission.application, submission.application_submission, attachment_mapping
        )

        xml_content = xml_assembler.generate_complete_submission_xml()

        if not xml_content:
            logger.warning(
                "XML generation returned empty content - skipping",
                extra=log_extra,
            )
            return

        file_name_in_zip = submission.get_file_name_in_zip("GrantApplication.xml")
        with submission.submission_zip.open(file_name_in_zip, "w") as file_in_zip:
            file_in_zip.write(xml_content.encode("utf-8"))

        file_size = submission.submission_zip.getinfo(file_name_in_zip).file_size
        submission.xml_metadata = FileMetadata(file_name_in_zip, file_size)

        logger.info(
            "Successfully added XML to application submission zip",
            extra=log_extra | {"xml_size_bytes": file_size},
        )

    def create_manifest_file(self, submission: SubmissionContainer) -> None:
        """Add a manifest file to the zip"""
        log_extra = {
            "application_id": submission.application.application_id,
            "competition_id": submission.application.competition_id,
        }
        logger.info("Adding manifest file to application submission zip", extra=log_extra)

        with submission.submission_zip.open("manifest.txt", "w") as metadata_file:
            text = create_manifest_text(submission)
            metadata_file.write(text.encode("utf-8"))


def build_s3_application_submission_path(
    s3_config: S3Config, application: Application, submission_id: uuid.UUID
) -> str:
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
        f"submission-{application.application_id}.zip",
    )


@task_blueprint.cli.command(
    "create-application-submission",
    help="Create application submissions for all submitted apps",
)
@flask_db.with_db_session()
@ecs_background_task(task_name="create-application-submission")
def create_application_submission(db_session: db.Session) -> None:
    CreateApplicationSubmissionTask(db_session).run()


def create_manifest_text(submission: SubmissionContainer) -> str:
    """Create a manifest file and put it in the ZIP

    This manifest contains a list of files present in the ZIP.

    This file is formatted like:

        Manifest for Grant Application # GRANT00838603

        Grant Application XML file (total 1):
         1. GrantApplication.xml. (size 13390 bytes)

        Forms Included in Zip File(total 2):
         1. Form SFLLL_2_0-V2.0.pdf (size 20927 bytes)
         2. Form SF424_Short_3_0-V3.0.pdf (size 21985 bytes)

        Attachments Included in Zip File (total 0):
    """
    sections = []

    # Add a header with tracking number
    tracking_num = f"GRANT{submission.application_submission.legacy_tracking_number:08d}"
    sections.append(f"Manifest for Grant Application # {tracking_num}")

    # Process the XML file first (to match grants.gov format)
    if submission.xml_metadata is not None:
        xml_lines = ["Grant Application XML file (total 1):"]
        xml_lines.append(
            f" 1. {submission.xml_metadata.file_name}. (size {submission.xml_metadata.file_size_in_bytes} bytes)"
        )
        sections.append("\n".join(xml_lines))

    # Process the forms
    if len(submission.form_pdf_metadata) > 0:
        form_lines = [f"Forms Included in Zip File(total {len(submission.form_pdf_metadata)}):"]
        for i, app_form in enumerate(submission.form_pdf_metadata, start=1):
            form_lines.append(
                f" {i}. Form {app_form.file_name} (size {app_form.file_size_in_bytes} bytes)"
            )
        sections.append("\n".join(form_lines))

    # Process the attachments
    attachment_lines = [
        f"Attachments Included in Zip File (total {len(submission.attachment_metadata)}):"
    ]
    if len(submission.attachment_metadata) > 0:
        for i, app_attachment in enumerate(submission.attachment_metadata, start=1):
            attachment_lines.append(
                f" {i}. {app_attachment.file_name} (size {app_attachment.file_size_in_bytes} bytes)"
            )
    sections.append("\n".join(attachment_lines))

    # Return all sections
    return "\n\n".join(sections)
