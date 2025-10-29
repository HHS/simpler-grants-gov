import uuid

import apiflask.exceptions
import pytest

from src.constants.lookup_constants import (
    ApplicationFormStatus,
    ApplicationStatus,
    CompetitionOpenToApplicant,
    Privilege,
)
from src.services.applications.add_organization_to_application import (
    add_organization_to_application,
)
from tests.src.db.models.factories import (
    ApplicationFactory,
    ApplicationFormFactory,
    ApplicationUserFactory,
    ApplicationUserRoleFactory,
    CompetitionFactory,
    CompetitionFormFactory,
    FormFactory,
    OrganizationFactory,
    OrganizationUserFactory,
    OrganizationUserRoleFactory,
    RoleFactory,
    UserFactory,
)


def test_add_organization_to_application_success(enable_factory_create, db_session):
    """Test successfully adding an organization to an application."""
    # Create user with proper privileges
    user = UserFactory.create()

    # Create competition that allows both individual and organization applications
    competition = CompetitionFactory.create(
        open_to_applicants={
            CompetitionOpenToApplicant.INDIVIDUAL,
            CompetitionOpenToApplicant.ORGANIZATION,
        },
        competition_forms=[],
    )

    # Create a form with simple schema for testing pre-population
    form = FormFactory.create(
        form_json_schema={
            "type": "object",
            "properties": {"name": {"type": "string"}},
            "required": ["name"],
        }
    )
    competition_form = CompetitionFormFactory.create(competition=competition, form=form)

    # Create application without an organization
    application = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS,
        competition=competition,
        organization_id=None,
    )

    # Create application form for pre-population testing
    ApplicationFormFactory.create(
        application=application,
        competition_form=competition_form,
        application_response={},
    )

    # Associate user with application (giving them MODIFY_APPLICATION privilege)
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.MODIFY_APPLICATION]),
    )

    # Create organization and associate user with START_APPLICATION privilege
    organization = OrganizationFactory.create()
    OrganizationUserRoleFactory.create(
        organization_user=OrganizationUserFactory.create(user=user, organization=organization),
        role=RoleFactory.create(privileges=[Privilege.START_APPLICATION]),
    )

    # Verify application has users before the operation
    assert len(application.application_users) == 1

    # Call the function
    updated_application = add_organization_to_application(
        db_session, application.application_id, organization.organization_id, user
    )

    # Flush to ensure changes are applied
    db_session.flush()

    # Verify the organization was added
    assert updated_application.organization_id == organization.organization_id

    # Verify application users were removed
    db_session.refresh(application)
    assert len(application.application_users) == 0

    # Verify the application is still in progress
    assert updated_application.application_status == ApplicationStatus.IN_PROGRESS


def test_add_organization_application_not_found(enable_factory_create, db_session):
    """Test adding organization fails when application doesn't exist."""
    user = UserFactory.create()
    organization = OrganizationFactory.create()
    non_existent_id = uuid.uuid4()

    with pytest.raises(apiflask.exceptions.HTTPError) as excinfo:
        add_organization_to_application(
            db_session, non_existent_id, organization.organization_id, user
        )

    assert excinfo.value.status_code == 404
    assert "Application not found" in excinfo.value.message


def test_add_organization_organization_not_found(enable_factory_create, db_session):
    """Test adding organization fails when organization doesn't exist."""
    user = UserFactory.create()
    competition = CompetitionFactory.create()
    application = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS,
        competition=competition,
        organization_id=None,
    )

    # Associate user with application
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.MODIFY_APPLICATION]),
    )

    non_existent_org_id = uuid.uuid4()

    with pytest.raises(apiflask.exceptions.HTTPError) as excinfo:
        add_organization_to_application(
            db_session, application.application_id, non_existent_org_id, user
        )

    assert excinfo.value.status_code == 404
    assert f"Could not find Organization with ID {non_existent_org_id}" in excinfo.value.message


def test_add_organization_no_modify_application_privilege(enable_factory_create, db_session):
    """Test adding organization fails when user doesn't have MODIFY_APPLICATION privilege."""
    user = UserFactory.create()
    competition = CompetitionFactory.create()
    application = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS,
        competition=competition,
        organization_id=None,
    )

    # Associate user with application but without MODIFY_APPLICATION privilege
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.VIEW_APPLICATION]),
    )

    organization = OrganizationFactory.create()
    OrganizationUserRoleFactory.create(
        organization_user=OrganizationUserFactory.create(user=user, organization=organization),
        role=RoleFactory.create(privileges=[Privilege.START_APPLICATION]),
    )

    with pytest.raises(apiflask.exceptions.HTTPError) as excinfo:
        add_organization_to_application(
            db_session, application.application_id, organization.organization_id, user
        )

    assert excinfo.value.status_code == 403
    assert "Forbidden" in excinfo.value.message


def test_add_organization_no_start_application_privilege(enable_factory_create, db_session):
    """Test adding organization fails when user doesn't have START_APPLICATION privilege for org."""
    user = UserFactory.create()
    competition = CompetitionFactory.create(
        open_to_applicants={CompetitionOpenToApplicant.ORGANIZATION}
    )
    application = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS,
        competition=competition,
        organization_id=None,
    )

    # Associate user with application with MODIFY_APPLICATION privilege
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.MODIFY_APPLICATION]),
    )

    # Create organization but user doesn't have START_APPLICATION privilege
    organization = OrganizationFactory.create()
    OrganizationUserRoleFactory.create(
        organization_user=OrganizationUserFactory.create(user=user, organization=organization),
        role=RoleFactory.create(privileges=[Privilege.VIEW_ORG_MEMBERSHIP]),
    )

    with pytest.raises(apiflask.exceptions.HTTPError) as excinfo:
        add_organization_to_application(
            db_session, application.application_id, organization.organization_id, user
        )

    assert excinfo.value.status_code == 403
    assert "Forbidden" in excinfo.value.message


def test_add_organization_application_not_in_progress(enable_factory_create, db_session):
    """Test adding organization fails when application is not in progress."""
    user = UserFactory.create()
    competition = CompetitionFactory.create()
    application = ApplicationFactory.create(
        application_status=ApplicationStatus.SUBMITTED,  # Not in progress
        competition=competition,
        organization_id=None,
    )

    # Associate user with application
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.MODIFY_APPLICATION]),
    )

    organization = OrganizationFactory.create()

    with pytest.raises(apiflask.exceptions.HTTPError) as excinfo:
        add_organization_to_application(
            db_session, application.application_id, organization.organization_id, user
        )

    assert excinfo.value.status_code == 403
    assert "Cannot modify application" in excinfo.value.message


def test_add_organization_already_has_organization(enable_factory_create, db_session):
    """Test adding organization fails when application already has an organization."""
    user = UserFactory.create()
    competition = CompetitionFactory.create()
    existing_org = OrganizationFactory.create()
    new_org = OrganizationFactory.create()

    application = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS,
        competition=competition,
        organization_id=existing_org.organization_id,  # Already has an org
    )

    # Associate user with application
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.MODIFY_APPLICATION]),
    )

    # Associate user with new organization
    OrganizationUserRoleFactory.create(
        organization_user=OrganizationUserFactory.create(user=user, organization=new_org),
        role=RoleFactory.create(privileges=[Privilege.START_APPLICATION]),
    )

    with pytest.raises(apiflask.exceptions.HTTPError) as excinfo:
        add_organization_to_application(
            db_session, application.application_id, new_org.organization_id, user
        )

    assert excinfo.value.status_code == 422
    assert "Application already has an organization" in excinfo.value.message


def test_add_organization_competition_only_accepts_individuals(enable_factory_create, db_session):
    """Test adding organization fails when competition only accepts individual applications."""
    user = UserFactory.create()

    # Create competition that ONLY accepts individual applications
    competition = CompetitionFactory.create(
        open_to_applicants={CompetitionOpenToApplicant.INDIVIDUAL}
    )

    application = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS,
        competition=competition,
        organization_id=None,
    )

    # Associate user with application
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.MODIFY_APPLICATION]),
    )

    organization = OrganizationFactory.create()
    OrganizationUserRoleFactory.create(
        organization_user=OrganizationUserFactory.create(user=user, organization=organization),
        role=RoleFactory.create(privileges=[Privilege.START_APPLICATION]),
    )

    with pytest.raises(apiflask.exceptions.HTTPError) as excinfo:
        add_organization_to_application(
            db_session, application.application_id, organization.organization_id, user
        )

    assert excinfo.value.status_code == 422
    assert "This competition only accepts individual applications" in excinfo.value.message


def test_add_organization_removes_multiple_application_users(enable_factory_create, db_session):
    """Test that adding organization removes all application users."""
    user = UserFactory.create()
    other_user_1 = UserFactory.create()
    other_user_2 = UserFactory.create()

    competition = CompetitionFactory.create(
        open_to_applicants={CompetitionOpenToApplicant.ORGANIZATION}
    )
    application = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS,
        competition=competition,
        organization_id=None,
    )

    # Create multiple application users
    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.MODIFY_APPLICATION]),
    )
    ApplicationUserFactory.create(user=other_user_1, application=application)
    ApplicationUserFactory.create(user=other_user_2, application=application)

    # Verify we have 3 users
    assert len(application.application_users) == 3

    organization = OrganizationFactory.create()
    OrganizationUserRoleFactory.create(
        organization_user=OrganizationUserFactory.create(user=user, organization=organization),
        role=RoleFactory.create(privileges=[Privilege.START_APPLICATION]),
    )

    # Call the function
    with db_session.begin():
        updated_application = add_organization_to_application(
            db_session, application.application_id, organization.organization_id, user
        )

    # Verify all application users were removed
    db_session.refresh(application)
    assert len(application.application_users) == 0
    assert updated_application.organization_id == organization.organization_id


def test_add_organization_triggers_form_prepopulation(enable_factory_create, db_session):
    """Test that adding organization triggers pre-population on application forms."""
    user = UserFactory.create()

    competition = CompetitionFactory.create(
        open_to_applicants={CompetitionOpenToApplicant.ORGANIZATION},
        competition_forms=[],
    )

    # Create a form with simple schema
    form = FormFactory.create(
        form_json_schema={
            "type": "object",
            "properties": {"test_field": {"type": "string"}},
            "required": ["test_field"],
        }
    )
    competition_form = CompetitionFormFactory.create(competition=competition, form=form)

    application = ApplicationFactory.create(
        application_status=ApplicationStatus.IN_PROGRESS,
        competition=competition,
        organization_id=None,
    )

    # Create application form with incomplete data
    app_form = ApplicationFormFactory.create(
        application=application,
        competition_form=competition_form,
        application_response={},  # Empty response
    )

    ApplicationUserRoleFactory.create(
        application_user=ApplicationUserFactory.create(user=user, application=application),
        role=RoleFactory.create(privileges=[Privilege.MODIFY_APPLICATION]),
    )

    organization = OrganizationFactory.create()
    OrganizationUserRoleFactory.create(
        organization_user=OrganizationUserFactory.create(user=user, organization=organization),
        role=RoleFactory.create(privileges=[Privilege.START_APPLICATION]),
    )

    # Call the function
    add_organization_to_application(
        db_session, application.application_id, organization.organization_id, user
    )

    # Flush to ensure changes are applied
    db_session.flush()

    # Verify form validation was run (it would set the form status)
    db_session.refresh(app_form)
    # The form status should still be IN_PROGRESS since the form is incomplete
    assert app_form.application_form_status == ApplicationFormStatus.IN_PROGRESS
