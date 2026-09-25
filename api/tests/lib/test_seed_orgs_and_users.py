import uuid
from unittest.mock import patch

from sqlalchemy import select

from src.constants.lookup_constants import (
    ApplicationAuditEvent,
    ApplicationFormStatus,
    ApplicationStatus,
)
from src.constants.static_role_values import APPLICATION_OWNER
from src.db.models.competition_models import ApplicationSubmission
from src.db.models.user_models import ApplicationUser
from tests.lib.seed_orgs_and_users import _add_application
from tests.src.db.models.factories import CompetitionFactory, OrganizationFactory, UserFactory


def test_static_application_id_is_assigned_when_add_application_is_called(
    db_session, enable_factory_create, caplog
):
    app_owner = UserFactory.create()
    competition = CompetitionFactory.create()
    static_id = uuid.uuid4()
    application = _add_application(
        db_session,
        competition,
        "XYZ",
        app_owner,
        static_application_id=static_id,
        application_status=ApplicationStatus.IN_PROGRESS,
    )
    assert application.application_id == static_id


def test_audit_events_and_ownership_when_user_adds_application(
    db_session, enable_factory_create, caplog
):
    app_owner = UserFactory.create()
    competition = CompetitionFactory.create()
    application = _add_application(
        db_session,
        competition,
        "XYZ",
        app_owner,
        application_status=ApplicationStatus.IN_PROGRESS,
    )
    assert len(application.application_audits) == 2
    events = [x.application_audit_event for x in application.application_audits]
    assert ApplicationAuditEvent.APPLICATION_CREATED in events
    assert ApplicationAuditEvent.USER_ADDED in events
    application_user = (
        db_session.execute(
            select(ApplicationUser).where(
                ApplicationUser.user_id == app_owner.user_id,
                ApplicationUser.application_id == application.application_id,
            )
        )
        .scalars()
        .one_or_none()
    )
    assert application_user is not None
    assert APPLICATION_OWNER.role_id in [x.role_id for x in application_user.application_user_roles]


def test_organization_added_audit_event_when_organization_is_added_to_application_when_add_application_called(
    db_session, enable_factory_create, caplog
):
    organization = OrganizationFactory.create()
    app_owner = organization
    competition = CompetitionFactory.create()
    application = _add_application(
        db_session,
        competition,
        "XYZ",
        app_owner=app_owner,
        application_status=ApplicationStatus.IN_PROGRESS,
    )
    assert len(application.application_audits) == 2
    events = [x.application_audit_event for x in application.application_audits]
    assert ApplicationAuditEvent.APPLICATION_CREATED in events
    assert ApplicationAuditEvent.ORGANIZATION_ADDED in events


def test_application_status_can_be_set_to_submitted_when_add_application_called(
    db_session, enable_factory_create, caplog
):
    organization = OrganizationFactory.create()
    app_owner = organization
    competition = CompetitionFactory.create()
    application = _add_application(
        db_session,
        competition,
        "XYZ",
        app_owner=app_owner,
        application_status=ApplicationStatus.SUBMITTED,
    )
    application_form = application.application_forms[0]
    assert application_form.application_form_status == ApplicationFormStatus.IN_PROGRESS
    assert application.application_status == ApplicationStatus.SUBMITTED


def test_application_status_can_be_set_to_accepted_when_add_application_called(
    db_session, enable_factory_create, caplog
):
    organization = OrganizationFactory.create()
    app_owner = organization
    competition = CompetitionFactory.create()
    mock_uuid = uuid.uuid4()
    with patch.object(uuid, "uuid4", return_value=mock_uuid):
        application = _add_application(
            db_session,
            competition,
            "XYZ",
            app_owner=app_owner,
            application_status=ApplicationStatus.ACCEPTED,
        )
    assert application.application_status == ApplicationStatus.ACCEPTED
    # If the status is ACCEPTED then an application submission should be created
    submission = (
        db_session.execute(
            select(ApplicationSubmission).where(
                ApplicationSubmission.application_id == application.application_id
            )
        )
        .scalars()
        .one_or_none()
    )
    assert submission is not None
    assert (
        submission.file_location
        == f"s3://local-mock-public-bucket/applications/{application.application_id}/submissions/{mock_uuid}/submission.zip"
    )
