import { getSession } from "src/services/auth/session";
import {
  getOrganizationDetails,
  getOrganizationRoles,
  getOrganizationUsers,
} from "src/services/fetch/fetchers/organizationsFetcher";
import { Organization } from "src/types/applicationResponseTypes";
import { UserDetail, UserRole } from "src/types/userTypes";

import { getTranslations } from "next-intl/server";
import { ErrorMessage, GridContainer } from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/Breadcrumbs";
import { PageHeader } from "src/components/manageUsers/PageHeader";
import { ManageUsersClient } from "./ManageUsersClient";

export async function ManageUsersPageContent({
  organizationId,
}: {
  organizationId: string;
}) {
  const t = await getTranslations("ManageUsers");

  const session = await getSession();
  if (!session?.token) {
    return (
      <GridContainer className="padding-top-2 tablet:padding-y-6">
        <ErrorMessage>{t("errors.notLoggedInMessage")}</ErrorMessage>
      </GridContainer>
    );
  }

  const [usersResult, orgsResult, rolesResult] = await Promise.allSettled([
    getOrganizationUsers(session.token, organizationId),
    getOrganizationDetails(session.token, organizationId),
    getOrganizationRoles(session.token, organizationId),
  ]);

  let users: UserDetail[] = [];
  let userOrganization: Organization | undefined;
  let roles: UserRole[] = [];

  if (usersResult.status === "fulfilled") {
    users = usersResult.value;
  } else {
    console.error("Unable to fetch organization users", usersResult.reason);
  }

  if (orgsResult.status === "fulfilled") {
    userOrganization = orgsResult.value;
  } else {
    console.error("Unable to fetch user organizations", orgsResult.reason);
  }

  if (rolesResult.status === "fulfilled") {
    roles = rolesResult.value;
  } else {
    console.error("Unable to fetch organization roles", rolesResult.reason);
  }

  const organizationName = userOrganization?.sam_gov_entity.legal_business_name;

  return (
    <GridContainer className="padding-top-2 tablet:padding-y-6">
      <Breadcrumbs
        breadcrumbList={[
          { title: "home", path: "/" },
          {
            title: "Workspace",
            path: `/user/workspace`,
          },
          {
            title: name ?? "Organization",
            path: `/organization/${organizationId}`,
          },
          {
            title: "Manage Users",
            path: `/organization/${organizationId}/manage-users`,
          },
        ]}
      />
      <PageHeader
        organizationName={organizationName ?? undefined}
        pageHeader={t("pageHeading")}
      />
      <ManageUsersClient
        organizationId={organizationId}
        roles={roles}
        activeUsers={users}
        legacySystemUsers={[]}
        pendingUsers={[]}
      />
    </GridContainer>
  );
}
