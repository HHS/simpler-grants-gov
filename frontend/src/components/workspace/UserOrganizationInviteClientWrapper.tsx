"use client";

import { useFeatureFlags } from "src/hooks/useFeatureFlags";
import { UserRole } from "src/types/userTypes";

import { useTranslations } from "next-intl";

import { UserInviteForm } from "./UserInviteForm";

export const UserOrganizationInviteClientWrapper = ({
  organizationId,
  organizationRoles,
}: {
  organizationId: string;
  organizationRoles: UserRole[];
}) => {
  const t = useTranslations("ManageUsers.inviteUser");
  const { checkFeatureFlag } = useFeatureFlags();

  if (checkFeatureFlag("manageUsersOff")) {
    return (
      <div className="border-2px border-primary radius-md padding-x-2 padding-y-4">
        <h3>{t("heading")}</h3>
        <div>{t("description")}</div>
        <UserInviteForm
          organizationId={organizationId}
          roles={organizationRoles}
        />
      </div>
    );
  } else {
    return <></>;
  }
};
