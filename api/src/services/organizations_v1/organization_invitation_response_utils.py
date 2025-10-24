"""Shared utilities for organization invitation endpoints.

This module contains data classes and transformation logic shared between
organization invitation list and get endpoints.
"""

import uuid
from dataclasses import dataclass
from datetime import datetime

from src.db.models.entity_models import OrganizationInvitation


@dataclass
class InviterData:
    """Data class for inviter user information"""

    user_id: uuid.UUID
    email: str | None
    first_name: str | None
    last_name: str | None


@dataclass
class InviteeData:
    """Data class for invitee user information"""

    user_id: uuid.UUID | None
    email: str | None
    first_name: str | None
    last_name: str | None


@dataclass
class RoleData:
    """Data class for role information"""

    role_id: uuid.UUID
    role_name: str
    privileges: list[str]


@dataclass
class OrganizationInvitationData:
    """Data class for organization invitation response"""

    organization_invitation_id: uuid.UUID
    invitee_email: str
    status: str
    created_at: datetime
    expires_at: datetime
    accepted_at: datetime | None
    rejected_at: datetime | None
    inviter: InviterData
    invitee: InviteeData | None
    roles: list[RoleData]


def transform_invitation_to_response(
    invitation: OrganizationInvitation,
) -> OrganizationInvitationData:
    """Transform OrganizationInvitation model to OrganizationInvitationData.

    This function is shared between list and get invitation endpoints to ensure
    consistent data serialization.

    Args:
        invitation: The OrganizationInvitation model instance to transform

    Returns:
        OrganizationInvitationData with all fields populated from the model
    """
    return OrganizationInvitationData(
        organization_invitation_id=invitation.organization_invitation_id,
        invitee_email=invitation.invitee_email,
        status=invitation.status,
        created_at=invitation.created_at,
        expires_at=invitation.expires_at,
        accepted_at=invitation.accepted_at,
        rejected_at=invitation.rejected_at,
        inviter=InviterData(
            user_id=invitation.inviter_user.user_id,
            email=invitation.inviter_user.email,
            first_name=invitation.inviter_user.first_name,
            last_name=invitation.inviter_user.last_name,
        ),
        invitee=(
            InviteeData(
                user_id=invitation.invitee_user.user_id,
                email=invitation.invitee_user.email,
                first_name=invitation.invitee_user.first_name,
                last_name=invitation.invitee_user.last_name,
            )
            if invitation.invitee_user
            else None
        ),
        roles=[
            RoleData(
                role_id=role.role_id,
                role_name=role.role_name,
                privileges=[privilege for privilege in role.privileges],
            )
            for role in invitation.roles
        ],
    )
