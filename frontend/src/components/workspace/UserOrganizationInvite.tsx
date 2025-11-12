import { getSession } from "src/services/auth/session";
import { getOrganizationRoles } from "src/services/fetch/fetchers/organizationsFetcher";
import { UserRole } from "src/types/userTypes";

import { UserOrganizationInviteClientWrapper } from "./UserOrganizationInviteClientWrapper";

export async function UserOrganizationInvite({
  organizationId,
}: {
  organizationId: string;
}) {
  // fetch roles for organization (this will happen in page gate eventually)
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
    <UserOrganizationInviteClientWrapper
      organizationId={organizationId}
      organizationRoles={organizationRoles}
    />
  );
}
