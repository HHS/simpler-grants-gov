from datetime import timedelta

import pytest
from apiflask.exceptions import HTTPError

from src.constants.static_role_values import APPLICATION_OWNER
from src.db.models.user_models import ApplicationUserRole
from src.services.applications.create_application import (
    _assign_application_owner_role,
    _validate_organization_expiration,
    create_application,
)
from src.util.datetime_util import get_now_us_eastern_date
from tests.src.db.models.factories import (
    ApplicationUserFactory,
    CompetitionFactory,
    OrganizationFactory,
    SamGovEntityFactory,
    UserFactory,
)


def test_validate_organization_expiration_no_sam_gov_entity():
    """Test validation fails when organization has no SAM.gov entity"""
    organization = OrganizationFactory.build(sam_gov_entity=None)

    with pytest.raises(HTTPError) as exc_info:
        _validate_organization_expiration(organization)

    # Should call raise_flask_error with 422 status
    assert exc_info.value.status_code == 422
    assert (
        "This organization has no SAM.gov entity record and cannot be used for applications"
        in exc_info.value.message
    )


def test_validate_organization_expiration_inactive_entity():
    """Test validation fails when SAM.gov entity is inactive"""
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=365)

    sam_gov_entity = SamGovEntityFactory.build(expiration_date=future_date, is_inactive=True)
    organization = OrganizationFactory.build(sam_gov_entity=sam_gov_entity)

    with pytest.raises(HTTPError) as exc_info:
        _validate_organization_expiration(organization)

    assert exc_info.value.status_code == 422
    assert (
        "This organization is inactive in SAM.gov and cannot be used for applications"
        in exc_info.value.message
    )


def test_validate_organization_expiration_expired_entity():
    """Test validation fails when SAM.gov entity has expired"""
    today = get_now_us_eastern_date()
    past_date = today - timedelta(days=30)

    sam_gov_entity = SamGovEntityFactory.build(expiration_date=past_date, is_inactive=False)
    organization = OrganizationFactory.build(sam_gov_entity=sam_gov_entity)

    with pytest.raises(HTTPError) as exc_info:
        _validate_organization_expiration(organization)

    assert exc_info.value.status_code == 422
    expected_message = f"This organization's SAM.gov registration expired on {past_date.strftime('%B %d, %Y')} and cannot be used for applications"
    assert expected_message in exc_info.value.message


def test_validate_organization_expiration_valid_entity():
    """Test validation passes when SAM.gov entity is valid"""
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=365)

    sam_gov_entity = SamGovEntityFactory.build(expiration_date=future_date, is_inactive=False)
    organization = OrganizationFactory.build(sam_gov_entity=sam_gov_entity)

    # Should not raise any exception
    _validate_organization_expiration(organization)


def test_validate_organization_expiration_expires_today():
    """Test validation passes when SAM.gov entity expires today (not yet expired)"""
    today = get_now_us_eastern_date()

    sam_gov_entity = SamGovEntityFactory.build(expiration_date=today, is_inactive=False)
    organization = OrganizationFactory.build(sam_gov_entity=sam_gov_entity)

    # Should not raise any exception since expiring today is still valid
    _validate_organization_expiration(organization)


def test_assign_application_owner_role_new_role(db_session, enable_factory_create):
    """Test assigning Application Owner role to a user who doesn't have it"""
    application_user = ApplicationUserFactory.create(is_application_owner=True)

    # Verify no role exists initially
    role_count = (
        db_session.query(ApplicationUserRole)
        .filter_by(
            application_user_id=application_user.application_user_id,
            role_id=APPLICATION_OWNER.role_id,
        )
        .count()
    )
    assert role_count == 0

    # Assign the role
    _assign_application_owner_role(db_session, application_user)

    # Verify role was created
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


def test_create_application_assigns_owner_role(db_session, enable_factory_create):
    """Test that creating an application assigns the Application Owner role"""
    user = UserFactory.create()
    competition = CompetitionFactory.create()

    # Create application
    application = create_application(
        db_session=db_session,
        competition_id=competition.competition_id,
        user=user,
        application_name="Test Application",
    )

    # Verify ApplicationUser was created with owner flag
    application_user = (
        db_session.query(application.application_users[0].__class__)
        .filter_by(application_id=application.application_id, user_id=user.user_id)
        .first()
    )

    assert application_user is not None
    assert application_user.is_application_owner is True

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
