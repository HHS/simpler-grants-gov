from datetime import timedelta

from src.constants.static_role_values import APPLICATION_OWNER
from src.db.models.user_models import ApplicationUserRole
from src.services.applications.application_validation import get_organization_expiration_errors
from src.services.applications.create_application import create_application
from src.util.datetime_util import get_now_us_eastern_date
from src.validation.validation_constants import ValidationErrorType
from tests.src.db.models.factories import (
    CompetitionFactory,
    OrganizationFactory,
    SamGovEntityFactory,
    UserFactory,
)


def test_validate_organization_expiration_no_sam_gov_entity():
    """Test validation returns error when organization has no SAM.gov entity"""
    organization = OrganizationFactory.build(sam_gov_entity=None)

    errors = get_organization_expiration_errors(organization)

    assert len(errors) == 1
    assert errors[0].type == ValidationErrorType.ORGANIZATION_NO_SAM_GOV_ENTITY
    assert (
        "This organization has no SAM.gov entity record and cannot be used for applications"
        in errors[0].message
    )


def test_validate_organization_expiration_inactive_entity():
    """Test validation returns error when SAM.gov entity is inactive"""
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=365)

    sam_gov_entity = SamGovEntityFactory.build(expiration_date=future_date, is_inactive=True)
    organization = OrganizationFactory.build(sam_gov_entity=sam_gov_entity)

    errors = get_organization_expiration_errors(organization)

    assert len(errors) == 1
    assert errors[0].type == ValidationErrorType.ORGANIZATION_INACTIVE_IN_SAM_GOV
    assert (
        "This organization is inactive in SAM.gov and cannot be used for applications"
        in errors[0].message
    )


def test_validate_organization_expiration_expired_entity():
    """Test validation returns error when SAM.gov entity has expired"""
    today = get_now_us_eastern_date()
    past_date = today - timedelta(days=30)

    sam_gov_entity = SamGovEntityFactory.build(expiration_date=past_date, is_inactive=False)
    organization = OrganizationFactory.build(sam_gov_entity=sam_gov_entity)

    errors = get_organization_expiration_errors(organization)

    assert len(errors) == 1
    assert errors[0].type == ValidationErrorType.ORGANIZATION_SAM_GOV_EXPIRED
    expected_message = f"This organization's SAM.gov registration expired on {past_date.strftime('%B %d, %Y')} and cannot be used for applications"
    assert expected_message in errors[0].message


def test_validate_organization_expiration_valid_entity():
    """Test validation passes when SAM.gov entity is valid"""
    today = get_now_us_eastern_date()
    future_date = today + timedelta(days=365)

    sam_gov_entity = SamGovEntityFactory.build(expiration_date=future_date, is_inactive=False)
    organization = OrganizationFactory.build(sam_gov_entity=sam_gov_entity)

    errors = get_organization_expiration_errors(organization)

    assert len(errors) == 0


def test_validate_organization_expiration_expires_today():
    """Test validation passes when SAM.gov entity expires today (not yet expired)"""
    today = get_now_us_eastern_date()

    sam_gov_entity = SamGovEntityFactory.build(expiration_date=today, is_inactive=False)
    organization = OrganizationFactory.build(sam_gov_entity=sam_gov_entity)

    errors = get_organization_expiration_errors(organization)

    # Should not have any errors since expiring today is still valid
    assert len(errors) == 0


def test_create_application_assigns_owner_role_individual_application(
    db_session, enable_factory_create
):
    """Test that creating an application assigns the Application Owner role if individual application"""
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
