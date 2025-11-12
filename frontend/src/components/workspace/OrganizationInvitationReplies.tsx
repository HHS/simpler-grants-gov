"use client";

import { useFeatureFlags } from "src/hooks/useFeatureFlags";
import { completeStatuses, OrganizationInvitation } from "src/types/userTypes";

import { ReactNode } from "react";

import { OrganizationInvitationReply } from "./OrganizationInvitationReply";

// display prompts for all active organization invitations for a user
export const OrganizationInvitationReplies = ({
  userInvitations,
}: {
  userInvitations: OrganizationInvitation[];
}) => {
  const { checkFeatureFlag } = useFeatureFlags();

  if (checkFeatureFlag("manageUsersOff")) {
    return null;
  }

  return (
    <ul className="usa-list--unstyled">
      {userInvitations.reduce((nodes, userInvitation) => {
        if (!completeStatuses.includes(userInvitation.status)) {
          nodes.push(
            <OrganizationInvitationReply
              key={userInvitation.organization_invitation_id}
              userInvitation={userInvitation}
            />,
          );
        }
        return nodes;
      }, [] as ReactNode[])}
    </ul>
  );
};
