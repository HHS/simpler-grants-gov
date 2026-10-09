import { MissingAuthError } from "src/errors";
import { getOrganizationRoles } from "src/services/fetch/fetchers/organizationsFetcher";
import { logger } from "src/services/logger/simplerLogger";
import { UserRole } from "src/types/userTypes";

import { getTranslations } from "next-intl/server";

import { UserInviteForm } from "./UserInviteForm";

export async function UserOrganizationInvite({
  organizationId,
}: {
  organizationId: string;
}) {
  // fetch roles for organization (this will happen in page gate eventually)
  const t = await getTranslations("ManageUsers.inviteUser");
  let organizationRoles: UserRole[] = [];
  try {
    organizationRoles = await getOrganizationRoles(organizationId);
  } catch (e) {
    if (e instanceof MissingAuthError) {
      logger.warn(
        { organizationId },
        "Unable to display user invites, not logged in",
      );
      return;
    }
    logger.error(
      { err: e, organizationId },
      "Unable to fetch organization roles",
    );
  }
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
}
