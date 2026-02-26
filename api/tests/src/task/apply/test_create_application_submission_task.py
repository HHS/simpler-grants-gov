import zipfile
from io import BytesIO

import pytest
from sqlalchemy import update

from src.constants.lookup_constants import ApplicationAuditEvent, ApplicationStatus
from src.db.models.competition_models import Application
from src.services.pdf_generation.config import PdfGenerationConfig
from src.task.apply.create_application_submission_task import (
    ApplicationSubmissionConfig,
    CreateApplicationSubmissionTask,
    FileMetadata,
    SubmissionContainer,
    create_manifest_text,
)
from src.util import file_util
from tests.conftest import BaseTestClass
from tests.src.db.models.factories import (
    ApplicationAttachmentFactory,
    ApplicationFactory,
    ApplicationFormFactory,
    ApplicationSubmissionFactory,
)


def validate_manifest_contents(contents_of_manifest: str, expected_files: list[str]):
    # We don't validate the structure, just that
    # the files we expected are present.
    assert contents_of_manifest.startswith("Manifest for Grant Application")

    for expected_file in expected_files:
        assert expected_file in contents_of_manifest


def validate_files_in_zip(zip_file_path, expected_file_mapping: dict[str, str | list[str] | None]):
    with file_util.open_stream(zip_file_path, "rb") as f:
        with zipfile.ZipFile(f) as submission_zip:
            # Make sure the files we expect are present
            file_names_in_zip = {info.filename for info in submission_zip.infolist()}
            assert file_names_in_zip == expected_file_mapping.keys()

            # For each file in the zip, verify the contents match (if something passed in)
            for file_name, expected_contents in expected_file_mapping.items():
                with submission_zip.open(file_name) as file_in_zip:
                    if file_name == "manifest.txt":
                        contents_of_manifest = file_in_zip.read()
                        validate_manifest_contents(contents_of_manifest.decode(), expected_contents)
                    elif expected_contents is not None:
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
        # Create a mock PDF generation config to avoid requiring environment variables
        pdf_config = PdfGenerationConfig(
            frontend_url="http://localhost:3000",
            docraptor_api_key="test-key",
            docraptor_test_mode=True,
            docraptor_api_url="https://docraptor.com/docs",
            short_lived_token_expiration_minutes=60,
            pdf_generation_use_mocks=True,  # Use mocks in tests
        )
        return CreateApplicationSubmissionTask(db_session, pdf_generation_config=pdf_config)

    def test_run_task(self, db_session, create_submission_task):
        application_without_attachments = ApplicationFactory.create(
            with_forms=True,
            application_status=ApplicationStatus.SUBMITTED,
            has_submitted_by_user=True,
        )
        app_without_attachments_form_file_names = [
            f"{f.form.short_form_name}.pdf"
            for f in application_without_attachments.application_forms
        ]
        # Add another application form that is not required and was marked to not be included in submission
        skipped_app_form = ApplicationFormFactory.create(
            application=application_without_attachments,
            competition_form__competition=application_without_attachments.competition,
            competition_form__is_required=False,
            is_included_in_submission=False,
        )
        application_without_attachments.application_forms.append(skipped_app_form)

        application_with_attachments = ApplicationFactory.create(
            with_forms=True, application_status=ApplicationStatus.SUBMITTED
        )
        app_with_attachments_form_file_names = [
            f"{f.form.short_form_name}.pdf" for f in application_with_attachments.application_forms
        ]
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
        # Add an application attachment that is deleted and won't be picked up
        ApplicationAttachmentFactory.create(
            application=application_with_attachments, file_name="deleted_file.txt", is_deleted=True
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
            {"manifest.txt": app_without_attachments_form_file_names}
            | {f: None for f in app_without_attachments_form_file_names},
        )
        assert no_attachment_submission.file_size_bytes > 0

        # Verify audit event added
        assert len(application_without_attachments.application_audits) == 1
        assert (
            application_without_attachments.application_audits[0].application_audit_event
            == ApplicationAuditEvent.SUBMISSION_CREATED
        )
        assert (
            application_without_attachments.application_audits[0].user_id
            == application_without_attachments.submitted_by
        )

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
                "manifest.txt": [
                    "file_a.txt",
                    "file_b.txt",
                    "dupe_filename.txt",
                    "1-dupe_filename.txt",
                ]
                + app_with_attachments_form_file_names,
            }
            | {f: None for f in app_with_attachments_form_file_names},
        )
        # No user attached, no audit event added
        assert len(application_with_attachments.application_audits) == 0

        # These weren't picked up
        assert len(not_picked_up_app1.application_submissions) == 0
        assert len(not_picked_up_app2.application_submissions) == 0

        metrics = create_submission_task.metrics
        assert metrics[create_submission_task.Metrics.APPLICATION_PROCESSED_COUNT] == 2
        assert metrics[create_submission_task.Metrics.APPLICATION_ATTACHMENT_COUNT] == 4
        apps_processed = [application_with_attachments, application_without_attachments]
        assert (
            metrics[create_submission_task.Metrics.APPLICATION_FORM_COUNT]
            == sum([len(app.application_forms) for app in apps_processed]) - 1
        )  # Not counting the one app form that we skip

    def test_run_task_with_erroring_application(
        self, db_session, create_submission_task, monkeypatch
    ):
        application = ApplicationFactory.create(
            with_forms=True, application_status=ApplicationStatus.SUBMITTED
        )

        def erroring_function(submission):
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

    def test_xml_generation_unsupported_form(self, db_session, enable_factory_create, s3_config):
        """Test that submission succeeds gracefully when form doesn't support XML."""
        # Create application with a form that doesn't support XML
        application = ApplicationFactory.create(
            with_forms=True,
            application_status=ApplicationStatus.SUBMITTED,
        )

        # Create task with XML generation ENABLED
        pdf_config = PdfGenerationConfig(
            frontend_url="http://localhost:3000",
            docraptor_api_key="test-key",
            docraptor_test_mode=True,
            docraptor_api_url="https://docraptor.com/docs",
            short_lived_token_expiration_minutes=60,
            pdf_generation_use_mocks=True,
        )
        app_submission_config = ApplicationSubmissionConfig()
        task = CreateApplicationSubmissionTask(
            db_session, s3_config=s3_config, pdf_generation_config=pdf_config
        )
        task.app_submission_config = app_submission_config

        task.run()

        # Verify submission was still created successfully
        db_session.refresh(application)
        assert application.application_status == ApplicationStatus.ACCEPTED
        assert len(application.application_submissions) == 1

        # Verify NO XML file in zip (since form doesn't support it)
        submission = application.application_submissions[0]
        with file_util.open_stream(submission.file_location, "rb") as f:
            with zipfile.ZipFile(f) as submission_zip:
                file_names = [info.filename for info in submission_zip.infolist()]
                assert "GrantApplication.xml" not in file_names
                # Should only have PDF and manifest
                assert "manifest.txt" in file_names


def test_get_file_name_in_zip():
    container = SubmissionContainer(
        ApplicationFactory.build(),
        zipfile.ZipFile(BytesIO(), mode="w"),
        ApplicationSubmissionFactory.build(),
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


def test_create_manifest_text_empty():
    # Create a mock submission with just the fields we need
    from collections import namedtuple

    MockSubmission = namedtuple("MockSubmission", ["legacy_tracking_number"])
    mock_submission = MockSubmission(legacy_tracking_number=12345678)

    container = SubmissionContainer(
        ApplicationFactory.build(),
        zipfile.ZipFile(BytesIO(), mode="w"),
        mock_submission,
    )
    text = create_manifest_text(container)
    expected_text = """Manifest for Grant Application # GRANT12345678

Attachments Included in Zip File (total 0):"""
    assert text == expected_text


def test_create_manifest_text_full():
    # Create a mock submission with just the fields we need
    from collections import namedtuple

    MockSubmission = namedtuple("MockSubmission", ["legacy_tracking_number"])
    mock_submission = MockSubmission(legacy_tracking_number=87654321)

    container = SubmissionContainer(
        ApplicationFactory.build(),
        zipfile.ZipFile(BytesIO(), mode="w"),
        mock_submission,
    )
    container.form_pdf_metadata.append(FileMetadata("form-A.pdf", 123))
    container.form_pdf_metadata.append(FileMetadata("form-B.pdf", 222))
    container.form_pdf_metadata.append(FileMetadata("form-XYZ.pdf", 100))

    container.attachment_metadata.append(FileMetadata("my-attachment.txt", 500))
    container.attachment_metadata.append(FileMetadata("research-plan.docx", 1001))
    container.attachment_metadata.append(FileMetadata("magic.pptx", 456))
    container.attachment_metadata.append(FileMetadata("something_else.pdf", 777))

    text = create_manifest_text(container)
    expected_text = """Manifest for Grant Application # GRANT87654321

Forms Included in Zip File(total 3):
 1. Form form-A.pdf (size 123 bytes)
 2. Form form-B.pdf (size 222 bytes)
 3. Form form-XYZ.pdf (size 100 bytes)

Attachments Included in Zip File (total 4):
 1. my-attachment.txt (size 500 bytes)
 2. research-plan.docx (size 1001 bytes)
 3. magic.pptx (size 456 bytes)
 4. something_else.pdf (size 777 bytes)"""
    assert text == expected_text


def test_create_manifest_text_with_xml():
    # Create a mock submission with just the fields we need
    from collections import namedtuple

    MockSubmission = namedtuple("MockSubmission", ["legacy_tracking_number"])
    mock_submission = MockSubmission(legacy_tracking_number=11223344)

    container = SubmissionContainer(
        ApplicationFactory.build(),
        zipfile.ZipFile(BytesIO(), mode="w"),
        mock_submission,
    )
    container.form_pdf_metadata.append(FileMetadata("form-A.pdf", 123))
    container.xml_metadata = FileMetadata("GrantApplication.xml", 5000)

    text = create_manifest_text(container)
    expected_text = """Manifest for Grant Application # GRANT11223344

Grant Application XML file (total 1):
 1. GrantApplication.xml. (size 5000 bytes)

Forms Included in Zip File(total 1):
 1. Form form-A.pdf (size 123 bytes)

Attachments Included in Zip File (total 0):"""
    assert text == expected_text
