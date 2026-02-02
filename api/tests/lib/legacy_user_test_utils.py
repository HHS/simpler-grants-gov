"""Test utilities for legacy user-related tests."""

from datetime import UTC, datetime, timedelta

from src.constants.lookup_constants import LegacyUserStatus
from tests.src.db.models.factories import (
    LinkExternalUserFactory,
    OrganizationInvitationFactory,
    OrganizationUserFactory,
    StagingTuserProfileFactory,
    StagingVuserAccountFactory,
    UserFactory,
)


def create_legacy_user_with_status(
    uei: str,
    email: str,
    status: LegacyUserStatus = LegacyUserStatus.AVAILABLE,
    organization=None,
    inviter=None,
    created_date: datetime | None = None,
    first_name: str | None = None,
    last_name: str | None = None,
    **kwargs,
):
    """Create a legacy user in staging tables with specified status.

    This utility reduces boilerplate when creating legacy users for testing.
    It creates the required staging records and optionally sets up relationships
    for MEMBER or PENDING_INVITATION statuses.

    Args:
        uei: UEI for the user's profile
        email: User's email address
        status: LegacyUserStatus (AVAILABLE, MEMBER, or PENDING_INVITATION)
        organization: Organization for MEMBER/PENDING_INVITATION status (required for those statuses)
        inviter: User who sent invitation (required for PENDING_INVITATION status)
        created_date: Optional creation date for the user account
        first_name: User's first name (defaults to "User")
        last_name: User's last name (defaults to email)
        **kwargs: Additional arguments passed to StagingVuserAccountFactory

    Returns:
        The created VuserAccount staging record

    Raises:
        ValueError: If required parameters for status are missing

    Example:
        # Create an available user
        create_legacy_user_with_status(uei, "user@example.com")

        # Create a member
        create_legacy_user_with_status(
            uei, "member@example.com",
            status=LegacyUserStatus.MEMBER,
            organization=org
        )

        # Create a user with pending invitation
        create_legacy_user_with_status(
            uei, "pending@example.com",
            status=LegacyUserStatus.PENDING_INVITATION,
            organization=org,
            inviter=admin_user
        )
    """
    # Create staging user account
    account_kwargs = {
        "email": email,
        "first_name": first_name or "User",
        "last_name": last_name or email,
        "is_active": "Y",
        "is_deleted_legacy": "N",
        **kwargs,
    }
    if created_date:
        account_kwargs["created_date"] = created_date

    vuseraccount = StagingVuserAccountFactory.create(**account_kwargs)

    # Create staging user profile
    StagingTuserProfileFactory.create(
        user_account_id=vuseraccount.user_account_id,
        profile_duns=uei,
        profile_type_id=4,
        is_deleted_legacy="N",
    )

    # Set up relationships based on status
    if status == LegacyUserStatus.MEMBER:
        if not organization:
            raise ValueError("organization parameter is required for MEMBER status")

        # Create user and link to organization
        member_user = UserFactory.create()
        LinkExternalUserFactory.create(user=member_user, email=email)
        OrganizationUserFactory.create(user=member_user, organization=organization)

    elif status == LegacyUserStatus.PENDING_INVITATION:
        if not organization:
            raise ValueError("organization parameter is required for PENDING_INVITATION status")
        if not inviter:
            raise ValueError("inviter parameter is required for PENDING_INVITATION status")

        # Create pending invitation
        OrganizationInvitationFactory.create(
            organization=organization,
            inviter_user=inviter,
            invitee_email=email,
            expires_at=datetime.now(UTC) + timedelta(days=7),
            accepted_at=None,
            rejected_at=None,
        )

    return vuseraccount
