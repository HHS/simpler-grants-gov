"""Shared logic for building an application submission package.

This is the single implementation used by both:
* CreateApplicationSubmissionTask - the scheduled task that sweeps all
  SUBMITTED applications
* ApplicationSubmissionStateMachine - the workflow that builds a submission
  on-demand right after an application is submitted
"""

import logging
import secrets
import shutil
import string
import uuid
import zipfile
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import timedelta
from enum import StrEnum

import src.adapters.db as db
from src.adapters.aws import S3Config
from src.auth.internal_jwt_auth import create_jwt_for_internal_token
from src.constants.lookup_constants import ApplicationAuditEvent, ApplicationStatus
from src.db.models.competition_models import Application, ApplicationSubmission
from src.services.applications.application_audit import add_audit_event
from src.services.applications.application_validation import is_form_required
from src.services.applications.get_field_from_application import (
    get_project_title_from_application,
    get_requested_amount_from_application,
)
from src.services.pdf_generation.config import PdfGenerationConfig
from src.services.pdf_generation.models import PdfGenerationResponse
from src.services.pdf_generation.service import generate_application_form_pdf
from src.services.xml_generation.submission_xml_assembler import SubmissionXMLAssembler
from src.services.xml_generation.utils.attachment_mapping import (
    _collect_referenced_attachment_ids,
    create_attachment_mapping,
)
from src.util import datetime_util, file_util

logger = logging.getLogger(__name__)

ATTACHMENT_COPY_CHUNK_SIZE = 8 * 1024 * 1024  # 8MB


class ApplicationSubmissionMetric(StrEnum):
    """Metrics incremented while building a submission.

    The values intentionally match the metric names historically reported
    by CreateApplicationSubmissionTask so dashboards keep working.
    """

    APPLICATION_PROCESSED_COUNT = "application_processed_count"
    APPLICATION_FORM_COUNT = "application_form_count"
    APPLICATION_ATTACHMENT_COUNT = "application_attachment_count"


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


def create_internal_token_for_pdf_generation(
    db_session: db.Session, pdf_generation_config: PdfGenerationConfig
) -> str | None:
    """Create the internal JWT used to authenticate PDF generation calls.

    The PDF generation service validates this token by looking it up over its
    own database connection, so the token row must be committed before the
    caller's transaction finishes. We therefore create it on a separate
    session against the same engine rather than committing the caller's
    session mid-transaction.
    """
    if pdf_generation_config.pdf_generation_use_mocks:
        return "mock-token"  # Always provide a token for testing consistency

    expires_at = datetime_util.utcnow() + timedelta(
        minutes=pdf_generation_config.short_lived_token_expiration_minutes
    )

    with db.Session(bind=db_session.get_bind(), expire_on_commit=False) as token_session:
        with token_session.begin():
            token, short_lived_token = create_jwt_for_internal_token(
                expires_at=expires_at, db_session=token_session
            )
        token_id = short_lived_token.short_lived_internal_token_id

    logger.info(
        "Created internal token for PDF generation",
        extra={
            "token_id": str(token_id),
            "expires_at": expires_at.isoformat(),
        },
    )

    return token


class ApplicationSubmissionBuilder:
    """Builds the submission package (zip on S3 + ApplicationSubmission record) for one application.

    The caller owns the transaction - nothing is committed here. On success the
    application's status is set to ACCEPTED in the session.
    """

    def __init__(
        self,
        db_session: db.Session,
        s3_config: S3Config | None = None,
        pdf_generation_config: PdfGenerationConfig | None = None,
        internal_token: str | None = None,
        increment: Callable[[str], None] | None = None,
    ):
        self.db_session = db_session

        if s3_config is None:
            s3_config = S3Config()
        self.s3_config = s3_config

        if pdf_generation_config is None:
            pdf_generation_config = PdfGenerationConfig()
        self.pdf_generation_config = pdf_generation_config

        self.internal_token = internal_token

        if increment is None:
            # Metrics are optional - default to a no-op counter
            def increment(name: str) -> None:
                pass

        self._increment = increment

    def build_submission(self, application: Application) -> ApplicationSubmission:
        """Process an application and create an application submission"""
        logger.info(
            "Processing application submission",
            extra={
                "application_id": application.application_id,
                "competition_id": application.competition_id,
            },
        )
        self._increment(ApplicationSubmissionMetric.APPLICATION_PROCESSED_COUNT)

        submission_id = uuid.uuid4()
        s3_path = build_s3_application_submission_path(self.s3_config, application, submission_id)

        # Get the tracking number from the sequence before creating the record
        tracking_number = self.db_session.scalar(ApplicationSubmission.legacy_tracking_number_seq)

        # Create the submission object (file size will be updated after zip creation)
        application_submission = ApplicationSubmission(
            application_submission_id=submission_id,
            # We specify application_id instead of application directly
            # as SQLAlchemy will complain about this not being added to the DB session yet.
            # We don't want it in the DB session until we've finished processing
            # in case we hit an issue below.
            application_id=application.application_id,
            file_location=s3_path,
            file_size_bytes=0,
            legacy_tracking_number=tracking_number,
            application_submission_number=get_application_submission_number(application),
            project_title=get_project_title_from_application(application),
            total_requested_amount=get_requested_amount_from_application(application),
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

        # Add an audit event - we need a user for the audit event
        # So have it be the same user that submitted which shouldn't be null.
        if application.submitted_by_user:
            add_audit_event(
                db_session=self.db_session,
                application=application,
                user=application.submitted_by_user,
                audit_event=ApplicationAuditEvent.SUBMISSION_CREATED,
            )

        logger.info(
            "Finished processing application submission",
            extra={
                "application_id": application.application_id,
                "opportunity_id": application.competition.opportunity_id,
                "competition_id": application.competition_id,
                "application_submission_id": submission_id,
                "submission_location": s3_path,
                "submitted_by_user_id": application.submitted_by,
                "is_individual": application.organization_id is None,
                "organization_id": application.organization_id,
                "application_submission_number": application_submission.application_submission_number,
            },
        )

        return application_submission

    def get_pdf_for_app_form(
        self, application_id: uuid.UUID, application_form_id: uuid.UUID
    ) -> PdfGenerationResponse:
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

    def process_application_forms(self, submission: SubmissionContainer) -> None:
        """Turn an application form into a PDF and add to the zip file"""
        log_extra = {
            "application_id": submission.application.application_id,
            "competition_id": submission.application.competition_id,
        }
        logger.info("Processing application forms for application submission", extra=log_extra)
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
            self._increment(ApplicationSubmissionMetric.APPLICATION_FORM_COUNT)

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

        # Only include attachments that are referenced in form responses.
        # Orphaned attachments (not referenced anywhere) are excluded from the zip.
        referenced_ids = _collect_referenced_attachment_ids(submission.application)

        for application_attachment in submission.application.application_attachments:
            attachment_id_str = str(application_attachment.application_attachment_id)

            if attachment_id_str not in referenced_ids:
                logger.warning(
                    "Skipping orphaned attachment from submission zip - not referenced in any form response",
                    extra=log_extra
                    | {
                        "application_attachment_id": application_attachment.application_attachment_id,
                        "file_name": application_attachment.file_name,
                    },
                )
                continue

            logger.info(
                "Adding attachment to application submission zip",
                extra=log_extra
                | {"application_attachment_id": application_attachment.application_attachment_id},
            )
            self._increment(ApplicationSubmissionMetric.APPLICATION_ATTACHMENT_COUNT)

            with file_util.open_stream(
                application_attachment.file_location, "rb"
            ) as attachment_file:
                # Copy the contents of the file to the ZIP, renaming the file if it has
                # the same filename as something already in the ZIP
                file_name_in_zip = submission.get_file_name_in_zip(application_attachment.file_name)

                # Track filename overrides if the file was renamed
                if file_name_in_zip != application_attachment.file_name:
                    submission.attachment_filename_overrides[attachment_id_str] = file_name_in_zip

                # Stream in chunks rather than reading the whole attachment into
                # memory - attachments can be up to 200MB and the consumer builds
                # several submissions concurrently
                with submission.submission_zip.open(file_name_in_zip, "w") as file_in_zip:
                    shutil.copyfileobj(attachment_file, file_in_zip, ATTACHMENT_COPY_CHUNK_SIZE)

                file_size = submission.submission_zip.getinfo(file_name_in_zip).file_size
                submission.attachment_metadata.append(FileMetadata(file_name_in_zip, file_size))

    def process_xml_generation(self, submission: SubmissionContainer) -> None:
        """Generate GrantApplication.xml and add to zip if feature flag enabled"""
        log_extra = {
            "application_id": submission.application.application_id,
            "competition_id": submission.application.competition_id,
        }

        logger.info("Generating XML for application submission", extra=log_extra)

        # Create attachment mapping once for all forms
        # Orphaned attachments (not referenced in any form's application_response)
        # are automatically excluded by create_attachment_mapping.
        attachment_mapping = create_attachment_mapping(
            submission.application,
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


def get_application_submission_number(application: Application) -> str:
    """
    Create an application submission number which is calculated as:
        {opportunity_number}-{6 random uppercase characters/numbers}
    """
    opportunity_number = application.competition.opportunity.opportunity_number

    # This can technically happen due to the data model
    # but shouldn't ever happen in practice.
    if opportunity_number is None:
        logger.error(
            "Opportunity does not have an opportunity number",
            extra={
                "opportunity_id": application.competition.opportunity_id,
                "application_id": application.application_id,
            },
        )
        opportunity_number = "APP"

    # The submission number will a random
    submission_number = "".join(
        secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6)
    )

    return f"{opportunity_number}-{submission_number}"
