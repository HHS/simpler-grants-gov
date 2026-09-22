from src.constants.lookup_constants import ApplicationAuditEvent, ApplicationStatus, Privilege
from tests.lib.seed_orgs_and_users import _add_application
from tests.src.db.models.factories import (
    CompetitionFactory,
    OrganizationFactory,
    OrganizationUserFactory,
    OrganizationUserRoleFactory,
    RoleFactory,
    UserFactory,
)


def test_user(db_session, enable_factory_create, caplog):
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


def test_organization(db_session, enable_factory_create, caplog):
    organization = OrganizationFactory.create()
    OrganizationUserRoleFactory.create(
        organization_user=OrganizationUserFactory.create(organization=organization),
        role=RoleFactory.create(privileges=[Privilege.START_APPLICATION]),
    )
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
