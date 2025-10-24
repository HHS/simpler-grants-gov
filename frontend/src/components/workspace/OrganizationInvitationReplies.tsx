"use client";

import { OrganizationInvitation } from "src/types/userTypes";

import { useCallback, useState } from "react";

import { OrganizationInvitationReply } from "./OrganizationInvitationReply";

export const OrganizationInvitationReplies = ({
  userInvitations,
}: {
  userInvitations: OrganizationInvitation[];
}) => {
  const [activeInvitations, setActiveInvitations] = useState(userInvitations);
  const temporarilyDismissInvitationFor = useCallback(
    (userOrganization: OrganizationInvitation) => () => {
      return setActiveInvitations(
        activeInvitations.filter(
          (invitation) =>
            invitation.organization_invitation_id !==
            userOrganization.organization_invitation_id,
        ),
      );
    },
    [activeInvitations, setActiveInvitations],
  );
  return (
    <ul className="usa-list--unstyled">
      {activeInvitations.map((userInvitation) => (
        <OrganizationInvitationReply
          key={userInvitation.organization_invitation_id}
          userInvitation={userInvitation}
          onDismiss={temporarilyDismissInvitationFor(userInvitation)}
        />
      ))}
    </ul>
  );
};
