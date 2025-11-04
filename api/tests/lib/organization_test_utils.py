"""Test utilities for organization-related tests."""

from src.auth.api_jwt_auth import create_jwt_for_user
from src.constants.lookup_constants import Privilege
from tests.src.db.models.factories import (
    LinkExternalUserFactory,
    OrganizationFactory,
    OrganizationUserFactory,
    OrganizationUserRoleFactory,
    RoleFactory,
    SamGovEntityFactory,
    UserFactory,
)


def create_user_in_org(
    db_session,
    organization=None,
    sam_gov_entity=None,
    role=None,
    privileges: list[Privilege] = None,
    **kwargs
) -> tuple:
    """Create a user in an organization with specified privileges.

    This utility function reduces the boilerplate of creating a user, organization,
    role, and all the necessary relationships for testing organization endpoints.

    Args:
        privileges: List of privileges to grant the user
        db_session: Database session for creating JWT token
        organization: Existing organization to use (creates new one if None)
        sam_gov_entity: SAM.gov entity to associate with organization
        role: Role to assign to user
        **kwargs: Additional arguments passed to factory creation

    Returns:
        tuple: (user, organization, token) - The created user, organization, and JWT token
    """
    # Create user with external login
    user = UserFactory.create()
    LinkExternalUserFactory.create(user=user)

    # Create organization if not provided
    if organization is None:
        org_kwargs = {}
        if sam_gov_entity is not None:
            org_kwargs["sam_gov_entity"] = sam_gov_entity
        elif kwargs.get("with_sam_gov_entity"):
            org_kwargs["sam_gov_entity"] = SamGovEntityFactory.create()
        elif kwargs.get("without_sam_gov_entity"):
            org_kwargs["sam_gov_entity"] = None

        organization = OrganizationFactory.create(**org_kwargs)

    # Create role with specified privileges (only if privileges provided)
    if privileges:
        role = RoleFactory.create(privileges=privileges, is_org_role=True)

    # Create organization-user relationship
    org_user = OrganizationUserFactory.create(user=user, organization=organization)

    # Assign role to organization-user if either a role or privileges were provided
    if privileges or role:
        OrganizationUserRoleFactory.create(organization_user=org_user, role=role)

    # Create JWT token
    token, _ = create_jwt_for_user(user, db_session)
    db_session.commit()

    return user, organization, token


def create_user_not_in_org(db_session) -> tuple:
    """Create a user that is NOT a member of any organization.

    Args:
        db_session: Database session for creating JWT token

    Returns:
        tuple: (user, token) - The created user and JWT token
    """
    # Create user with external login
    user = UserFactory.create()
    LinkExternalUserFactory.create(user=user)

    # Create JWT token
    token, _ = create_jwt_for_user(user, db_session)
    db_session.commit()

    return user, token
