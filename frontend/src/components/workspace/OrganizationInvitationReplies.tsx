"use client";

import { OrganizationInvitation } from "src/types/userTypes";

import { OrganizationInvitationReply } from "./OrganizationInvitationReply";

export const OrganizationInvitationReplies = ({
  userInvitations,
}: {
  userInvitations: OrganizationInvitation[];
}) => {
  return (
    <ul className="usa-list--unstyled">
      {userInvitations.map((userInvitation) => (
        <OrganizationInvitationReply
          key={userInvitation.organization_invitation_id}
          userInvitation={userInvitation}
        />
      ))}
    </ul>
  );
};
