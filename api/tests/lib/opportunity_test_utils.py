"""Test utilities for opportunity-related tests."""

import uuid

from src.adapters import db
from src.auth.api_jwt_auth import create_jwt_for_user
from src.constants.lookup_constants import OpportunityCategory, Privilege
from src.db.models.agency_models import Agency
from src.db.models.user_models import Role, User
from tests.src.db.models.factories import (
    AgencyFactory,
    AgencyUserFactory,
    AgencyUserRoleFactory,
    LinkExternalUserFactory,
    RoleFactory,
    UserApiKeyFactory,
    UserFactory,
    UserProfileFactory,
)


def create_user_in_agency(
    agency: Agency | None = None,
    role: Role | None = None,
    privileges: list[Privilege] | None = None,
    email: str | None = None,
    first_name: str | None = None,
    last_name: str | None = None,
) -> tuple[User, Agency]:
    user = UserFactory.create()

    link_kwargs = {"user": user}
    if email is not None:
        link_kwargs["email"] = email
    LinkExternalUserFactory.create(**link_kwargs)

    # Create user profile if first_name or last_name provided
    if first_name is not None or last_name is not None:
        profile_kwargs = {"user": user}
        if first_name is not None:
            profile_kwargs["first_name"] = first_name
        if last_name is not None:
            profile_kwargs["last_name"] = last_name
        UserProfileFactory.create(**profile_kwargs)

    if agency is None:
        agency = AgencyFactory.create()

    agency_user = AgencyUserFactory.create(user=user, agency=agency)

    if privileges:
        role = RoleFactory.create(privileges=privileges, is_agency_role=True)

    if role is not None:
        AgencyUserRoleFactory.create(agency_user=agency_user, role=role)

    return user, agency


def create_user_in_agency_with_jwt(
    db_session: db.Session,
    agency: Agency | None = None,
    role: Role | None = None,
    privileges: list[Privilege] | None = None,
    email: str | None = None,
    first_name: str | None = None,
    last_name: str | None = None,
) -> tuple[User, Agency, str]:
    user, agency = create_user_in_agency(
        agency=agency,
        role=role,
        privileges=privileges,
        email=email,
        first_name=first_name,
        last_name=last_name,
    )

    token, _ = create_jwt_for_user(user, db_session)
    db_session.commit()  # commit to push JWT to DB

    return user, agency, token


def create_user_in_agency_with_jwt_and_api_key(
    db_session: db.Session,
    agency: Agency | None = None,
    role: Role | None = None,
    privileges: list[Privilege] | None = None,
    email: str | None = None,
    first_name: str | None = None,
    last_name: str | None = None,
) -> tuple[User, Agency, str, str]:
    user, agency, token = create_user_in_agency_with_jwt(
        db_session=db_session,
        agency=agency,
        role=role,
        privileges=privileges,
        email=email,
        first_name=first_name,
        last_name=last_name,
    )

    # Create API key for the user
    api_key = UserApiKeyFactory.create(user=user)

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
        "category": category,
        "category_explanation": category_explanation,
    }

    return request
