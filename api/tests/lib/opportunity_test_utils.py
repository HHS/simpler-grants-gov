"""Test utilities for opportunity-related tests."""

import uuid

from src.auth.api_jwt_auth import create_jwt_for_user
from src.constants.lookup_constants import OpportunityCategory
from src.db.models.agency_models import Agency
from tests.src.db.models.factories import (
    AgencyFactory,
    AgencyUserFactory,
    AgencyUserRoleFactory,
    RoleFactory,
    UserApiKeyFactory,
    UserFactory,
)


def create_user_with_agency_privileges(
    db_session, agency_id=None, privileges=None, email=None, **kwargs
) -> tuple:
    """Create a user with specified privileges for an agency.

    This utility function reduces the boilerplate of creating a user, agency,
    role, and all the necessary relationships for testing agency-related endpoints.

    Args:
        db_session: Database session for creating objects and JWT token
        agency_id: UUID of existing agency to use (creates new one if None)
        privileges: List of privileges to grant the user
        email: Optional email address for the user
        **kwargs: Additional arguments passed to factory creation

    Returns:
        tuple: (user, agency, token, api_key_id) - The created user, agency, JWT token, and API key ID
    """

    # Create user
    user = UserFactory.create()

    # Create or use existing agency
    if agency_id:
        existing_agency = db_session.query(Agency).filter_by(agency_id=uuid.UUID(agency_id)).first()

        if existing_agency:
            agency = existing_agency
        else:
            # Create a new agency with the specified ID
            agency = AgencyFactory.create(agency_id=uuid.UUID(agency_id))
    else:
        # Create a new agency
        agency = AgencyFactory.create()

    # Create role with specified privileges (only if privileges provided)
    if privileges:
        role = RoleFactory.create(privileges=privileges)
    else:
        role = None

    # Create agency-user relationship
    agency_user = AgencyUserFactory.create(user=user, agency=agency)

    # Assign role to agency-user if privileges were provided
    if privileges and role:
        AgencyUserRoleFactory.create(agency_user=agency_user, role=role)

    # Create API key for the user
    api_key = UserApiKeyFactory.create(user=user)

    # Create JWT token
    token, _ = create_jwt_for_user(user, db_session)
    db_session.commit()

    return user, agency, token, api_key.key_id


def create_opportunity_request(
    agency_id=None,
    opportunity_number=None,
    opportunity_title="Research Grant for Climate Innovation",
    category=OpportunityCategory.DISCRETIONARY,
    category_explanation="Competitive research grant",
):
    """Create a valid opportunity creation request.

    Args:
        agency_id: UUID of the agency (as string)
        **kwargs: Additional fields to include in the request

    Returns:
        dict: A valid opportunity creation request
    """

    if not agency_id:
        agency_id = uuid.uuid4()

    if not opportunity_number:
        opportunity_number = f"TEST-{uuid.uuid4().hex[:3]}"

    request = {
        "opportunity_number": opportunity_number,
        "opportunity_title": opportunity_title,
        "agency_id": str(agency_id),
        "category": OpportunityCategory.DISCRETIONARY,
        "category_explanation": category_explanation,
    }

    return request
