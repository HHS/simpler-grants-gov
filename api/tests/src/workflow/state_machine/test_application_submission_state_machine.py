import uuid
import zipfile

import pytest
from sqlalchemy import select

from src.constants.lookup_constants import ApplicationStatus, WorkflowType
from src.db.models.competition_models import ApplicationSubmission, Form
from src.form_schema.registry.form_template_registry import form_template_registry
from src.util import file_util
from src.workflow.handler.event_handler import EventHandler
from src.workflow.state_machine.application_submission_state_machine import (
    ApplicationSubmissionState,
)
from src.workflow.workflow_errors import (
    ConcurrentWorkflowError,
    EntityNotReadyError,
    InactiveWorkflowError,
    InvalidEventError,
)
from tests.src.db.models.factories import (
    ApplicationFactory,
    ApplicationFormFactory,
    UserFactory,
    WorkflowFactory,
)
from tests.src.workflow.workflow_test_util import build_start_workflow_event, send_process_event


@pytest.fixture
def submission_workflow_env(
    monkeypatch, mock_s3_bucket, other_mock_s3_bucket, mock_file_scan_s3_bucket
):
    """Set the env vars the state machine reads when constructing its configs.

    Unlike the scheduled task, the state machine can't take configs in its
    constructor (the event handler instantiates it generically), so it builds
    S3Config / PdfGenerationConfig from the environment.
    """
    monkeypatch.setenv("PUBLIC_FILES_BUCKET", f"s3://{mock_s3_bucket}")
    monkeypatch.setenv("DRAFT_FILES_BUCKET", f"s3://{other_mock_s3_bucket}")
    monkeypatch.setenv("FILE_SCAN_BUCKET", f"s3://{mock_file_scan_s3_bucket}")

    monkeypatch.setenv("FRONTEND_URL", "http://localhost:3000")
    monkeypatch.setenv("DOCRAPTOR_API_KEY", "test-key")
    monkeypatch.setenv("DOCRAPTOR_TEST_MODE", "true")
    monkeypatch.setenv("DOCRAPTOR_API_URL", "https://docraptor.com/docs")
    monkeypatch.setenv("SHORT_LIVED_TOKEN_EXPIRATION_MINUTES", "60")
    monkeypatch.setenv("PDF_GENERATION_USE_MOCKS", "true")


@pytest.fixture
def registered_form():
    """Register a simple form with the template registry, cleaning up afterwards."""
    registry_keys_before = set(form_template_registry._registry.keys())
    form = Form(
        form_id=uuid.uuid4(),
        form_name="Workflow Test Form",
        short_form_name="workflow_test",
        form_version="1.0",
        agency_code="TEST",
        form_json_schema={},
        form_ui_schema={},
        json_to_xml_schema=None,
    )
    form_template_registry.register(form, major_version=1)
    yield form
    for key in set(form_template_registry._registry.keys()) - registry_keys_before:
        del form_template_registry._registry[key]


def build_submitted_application(registered_form):
    application = ApplicationFactory.create(
        with_forms=False,
        application_status=ApplicationStatus.SUBMITTED,
        has_submitted_by_user=True,
        competition__competition_forms=[],
    )
    ApplicationFormFactory.create(
        application=application,
        competition_form__competition=application.competition,
        competition_form__form=registered_form,
    )
    return application


def get_submissions(db_session, application_id):
    return (
        db_session.scalars(
            select(ApplicationSubmission).where(
                ApplicationSubmission.application_id == application_id
            )
        )
        .unique()
        .all()
    )


def test_application_submission_workflow_happy_path(
    db_session, enable_factory_create, submission_workflow_env, registered_form
):
    """A start_workflow event builds the submission and runs the workflow to completion."""
    application = build_submitted_application(registered_form)
    user = application.submitted_by_user

    sqs_container = build_start_workflow_event(
        workflow_type=WorkflowType.APPLICATION_SUBMISSION,
        user=user,
        entity=application,
    )

    with db_session.begin():
        state_machine = EventHandler(db_session, sqs_container).process()

    db_session.refresh(application)
    assert application.application_status == ApplicationStatus.ACCEPTED

    workflow = state_machine.workflow
    assert workflow.current_workflow_state == ApplicationSubmissionState.END
    assert workflow.is_active is False
    assert workflow.application_id == application.application_id

    # No approvals for this workflow
    assert len(workflow.workflow_approvals) == 0

    # Just one event
    assert len(workflow.workflow_event_history) == 1
    assert workflow.workflow_event_history[0].is_successfully_processed is True

    # The event transitions fire automatically in sequence
    assert len(workflow.workflow_audits) == 3
    audits = sorted(workflow.workflow_audits, key=lambda audit: audit.created_at)

    assert audits[0].source_state == ApplicationSubmissionState.START
    assert audits[0].target_state == ApplicationSubmissionState.PENDING_SUBMISSION_CREATION

    assert audits[1].source_state == ApplicationSubmissionState.PENDING_SUBMISSION_CREATION
    assert audits[1].target_state == ApplicationSubmissionState.SUBMISSION_CREATED

    assert audits[2].source_state == ApplicationSubmissionState.SUBMISSION_CREATED
    assert audits[2].target_state == ApplicationSubmissionState.END

    # A submission record was created with a real zip behind it
    submissions = get_submissions(db_session, application.application_id)
    assert len(submissions) == 1
    submission = submissions[0]
    assert submission.file_size_bytes > 0

    with file_util.open_stream(submission.file_location, "rb") as f:
        with zipfile.ZipFile(f) as submission_zip:
            file_names_in_zip = {info.filename for info in submission_zip.infolist()}
            assert file_names_in_zip == {"workflow_test.pdf", "manifest.txt"}


def test_application_submission_workflow_already_processed(
    db_session, enable_factory_create, submission_workflow_env, registered_form
):
    """An event for an already-accepted application completes as a no-op."""
    application = build_submitted_application(registered_form)
    application.application_status = ApplicationStatus.ACCEPTED
    db_session.commit()

    sqs_container = build_start_workflow_event(
        workflow_type=WorkflowType.APPLICATION_SUBMISSION,
        user=application.submitted_by_user,
        entity=application,
    )

    with db_session.begin():
        state_machine = EventHandler(db_session, sqs_container).process()

    # The workflow still runs to completion, it just doesn't build anything
    assert state_machine.workflow.current_workflow_state == ApplicationSubmissionState.END
    assert state_machine.workflow.is_active is False

    assert len(get_submissions(db_session, application.application_id)) == 0


def test_application_submission_workflow_not_ready(
    db_session, enable_factory_create, submission_workflow_env, registered_form
):
    """An event for an in-progress application raises a retryable error."""
    application = build_submitted_application(registered_form)
    application.application_status = ApplicationStatus.IN_PROGRESS
    db_session.commit()

    sqs_container = build_start_workflow_event(
        workflow_type=WorkflowType.APPLICATION_SUBMISSION,
        user=application.submitted_by_user,
        entity=application,
    )

    with pytest.raises(EntityNotReadyError, match="Application is not in the submitted status"):
        with db_session.begin():
            EventHandler(db_session, sqs_container).process()

    assert len(get_submissions(db_session, application.application_id)) == 0


def test_application_submission_workflow_rejects_concurrent_start(
    db_session, enable_factory_create, submission_workflow_env, registered_form
):
    """A second start event while a workflow is active errors non-retryably."""
    application = build_submitted_application(registered_form)

    WorkflowFactory.create(
        workflow_type=WorkflowType.APPLICATION_SUBMISSION,
        current_workflow_state=ApplicationSubmissionState.PENDING_SUBMISSION_CREATION,
        application=application,
        is_active=True,
    )

    sqs_container = build_start_workflow_event(
        workflow_type=WorkflowType.APPLICATION_SUBMISSION,
        user=application.submitted_by_user,
        entity=application,
    )

    with pytest.raises(
        ConcurrentWorkflowError, match="An active workflow of this type already exists"
    ):
        with db_session.begin():
            EventHandler(db_session, sqs_container).process()

    assert len(get_submissions(db_session, application.application_id)) == 0


@pytest.mark.parametrize(
    "current_workflow_state,event_to_send",
    [
        (ApplicationSubmissionState.START, "not-a-real-event"),
        (ApplicationSubmissionState.START, "finish_submission"),
        (ApplicationSubmissionState.END, "start_workflow"),
    ],
)
def test_application_submission_workflow_invalid_events(
    db_session,
    enable_factory_create,
    submission_workflow_env,
    registered_form,
    current_workflow_state,
    event_to_send,
):
    application = build_submitted_application(registered_form)
    user = UserFactory.create()

    workflow = WorkflowFactory.create(
        workflow_type=WorkflowType.APPLICATION_SUBMISSION,
        current_workflow_state=current_workflow_state,
        application=application,
        is_active=current_workflow_state != ApplicationSubmissionState.END,
    )

    expected_error: type[Exception] = InvalidEventError
    expected_match = "Event is not valid for workflow"
    if current_workflow_state == ApplicationSubmissionState.END:
        # A workflow at END is inactive and rejected before event validation
        expected_error = InactiveWorkflowError
        expected_match = "Workflow is not active"

    with pytest.raises(expected_error, match=expected_match):
        send_process_event(
            db_session=db_session,
            event_to_send=event_to_send,
            workflow_id=workflow.workflow_id,
            user=user,
            # This won't matter as we won't check it due to the error
            expected_state=ApplicationSubmissionState.START,
        )

    assert len(get_submissions(db_session, application.application_id)) == 0
