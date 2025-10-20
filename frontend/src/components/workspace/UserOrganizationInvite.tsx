import { getSession } from "src/services/auth/session";
import { getOrganizationRoles } from "src/services/fetch/fetchers/organizationsFetcher";
import { UserRole } from "src/types/userTypes";

import { useTranslations } from "next-intl";

import { UserInviteForm } from "./UserInviteForm";

export async function UserOrganizationInvite({
  organizationId,
}: {
  organizationId: string;
}) {
  // fetch roles for organization (this will happen in page gate eventually)
  const t = useTranslations("ManageUsers.inviteUser");
  const session = await getSession();
  if (!session?.token) {
    console.error("unable to display user invites, not logged in");
    return;
  }
  let organizationRoles: UserRole[] = [];
  try {
    organizationRoles = await getOrganizationRoles(
      session.token,
      organizationId,
    );
  } catch (e) {
    console.error("unable to fetch organization roles", e);
  }
  return (
    <>
      <h3>{t("heading")}</h3>
      <div>{t("description")}</div>
      <UserInviteForm
        organizationId={organizationId}
        roles={organizationRoles}
      />
    </>
  );
}
