from datetime import timedelta

import pytest
from apiflask.exceptions import HTTPError

from src.services.applications.create_application import _validate_organization_expiration
from src.util.datetime_util import get_now_us_eastern_date
from tests.src.db.models.factories import OrganizationFactory, SamGovEntityFactory


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
