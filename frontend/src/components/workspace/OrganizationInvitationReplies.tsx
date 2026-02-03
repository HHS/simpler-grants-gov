"use client";

// we can remove the "use client" decorator after we remove the feature flag
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

  return (
    <ul className="usa-list--unstyled">
      {userInvitations.reduce((invitationsToShow, userInvitation) => {
        if (!completeStatuses.includes(userInvitation.status)) {
          invitationsToShow.push(
            <OrganizationInvitationReply
              key={userInvitation.organization_invitation_id}
              userInvitation={userInvitation}
            />,
          );
        }
        return invitationsToShow;
      }, [] as ReactNode[])}
    </ul>
  );
};
