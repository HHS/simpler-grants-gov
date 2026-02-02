import apiflask.exceptions
import pytest

from src.constants.lookup_constants import Privilege
from src.constants.static_role_values import APPLICATION_OWNER
from src.db.models.user_models import ApplicationUserRole
from src.services.applications.create_application import create_application
from tests.src.db.models.factories import (
    CompetitionFactory,
    OrganizationFactory,
    OrganizationUserFactory,
    OrganizationUserRoleFactory,
    RoleFactory,
    UserFactory,
)


def test_create_application_assigns_owner_role_individual_application(
    db_session, enable_factory_create
):
    """Test that creating an application assigns the Application Owner role if individual application"""
    user = UserFactory.create()
    competition = CompetitionFactory.create()

    # Create application
    application = create_application(
        db_session=db_session,
        user=user,
        json_data={
            "competition_id": competition.competition_id,
            "application_name": "Test Application",
        },
    )

    # Verify ApplicationUser was created with owner flag
    application_user = (
        db_session.query(application.application_users[0].__class__)
        .filter_by(application_id=application.application_id, user_id=user.user_id)
        .first()
    )

    assert application_user is not None

    # Verify Application Owner role was assigned
    role_assignment = (
        db_session.query(ApplicationUserRole)
        .filter_by(
            application_user_id=application_user.application_user_id,
            role_id=APPLICATION_OWNER.role_id,
        )
        .first()
    )

    assert role_assignment is not None
    assert role_assignment.role_id == APPLICATION_OWNER.role_id


def test_create_application_with_intends_to_add_organization_true(
    db_session, enable_factory_create
):
    """Test creating an application with intends_to_add_organization=True"""
    user = UserFactory.create()
    competition = CompetitionFactory.create()

    application = create_application(
        db_session=db_session,
        user=user,
        json_data={
            "competition_id": competition.competition_id,
            "application_name": "Test Application",
            "intends_to_add_organization": True,
        },
    )

    db_session.flush()
    db_session.refresh(application)

    assert application.intends_to_add_organization is True
    assert application.organization_id is None


def test_create_application_with_intends_to_add_organization_false(
    db_session, enable_factory_create
):
    """Test creating an application with intends_to_add_organization=False"""
    user = UserFactory.create()
    competition = CompetitionFactory.create()

    application = create_application(
        db_session=db_session,
        user=user,
        json_data={
            "competition_id": competition.competition_id,
            "application_name": "Test Application",
            "intends_to_add_organization": False,
        },
    )

    db_session.flush()
    db_session.refresh(application)

    assert application.intends_to_add_organization is False
    assert application.organization_id is None


def test_create_application_with_intends_to_add_organization_none(
    db_session, enable_factory_create
):
    """Test creating an application with intends_to_add_organization=None (default)"""
    user = UserFactory.create()
    competition = CompetitionFactory.create()

    application = create_application(
        db_session=db_session,
        user=user,
        json_data={
            "competition_id": competition.competition_id,
            "application_name": "Test Application",
        },
    )

    db_session.flush()
    db_session.refresh(application)

    assert application.intends_to_add_organization is None
    assert application.organization_id is None


def test_create_application_rejects_both_organization_and_intends_to_add(
    db_session, enable_factory_create
):
    """Test that creating an application with both organization_id and intends_to_add_organization raises error"""
    user = UserFactory.create()
    competition = CompetitionFactory.create()
    organization = OrganizationFactory.create()

    # Give user permission to start applications for the organization
    OrganizationUserRoleFactory.create(
        organization_user=OrganizationUserFactory.create(user=user, organization=organization),
        role=RoleFactory.create(privileges=[Privilege.START_APPLICATION]),
    )

    with pytest.raises(apiflask.exceptions.HTTPError) as excinfo:
        create_application(
            db_session=db_session,
            user=user,
            json_data={
                "competition_id": competition.competition_id,
                "application_name": "Test Application",
                "organization_id": organization.organization_id,
                "intends_to_add_organization": True,
            },
        )

    assert excinfo.value.status_code == 422
    assert (
        "Cannot set both organization_id and intends_to_add_organization" in excinfo.value.message
    )
