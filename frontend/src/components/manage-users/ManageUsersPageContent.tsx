import { getSession } from "src/services/auth/session";
import {
  getOrganizationRoles,
  getOrganizationUsers,
  getUserOrganizations,
} from "src/services/fetch/fetchers/organizationsFetcher";
import { Organization } from "src/types/applicationResponseTypes";
import { UserDetail, UserRole } from "src/types/userTypes";

import { getTranslations } from "next-intl/server";
import { ErrorMessage, GridContainer } from "@trussworks/react-uswds";

import { ManageUsersTables } from "./ManageUsersTables";
import { PageHeader } from "./PageHeader";

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
        <ErrorMessage>
          {t("errors.notLoggedInMessage") ?? "not logged in"}
        </ErrorMessage>
      </GridContainer>
    );
  }

  let users: UserDetail[] | undefined;
  let userOrganizations: Organization[] | undefined;
  let roles: UserRole[] | undefined;
  try {
    const [usersResult, organizationsResult, rolesResult] = await Promise.all([
      getOrganizationUsers(session.token, organizationId),
      getUserOrganizations(session.token, session.user_id),
      getOrganizationRoles(session.token, organizationId),
    ]);
    users = usersResult;
    userOrganizations = organizationsResult;
    roles = rolesResult;
  } catch (error) {
    console.error("Unable to fetch organization users", error);
  }
  const organization = (userOrganizations ?? []).find(
    (org) => org.organization_id === organizationId,
  );
  const name = organization?.sam_gov_entity?.legal_business_name;

  return (
    <GridContainer className="padding-top-2 tablet:padding-y-6">
      <PageHeader organizationName={name ?? ""} pageHeader={t("pageHeading")} />
      {users ? (
        <ManageUsersTables
          organizationId={organizationId}
          roles={roles ?? []}
          activeUsers={users}
          grantsGovUsers={[]}
          pendingUsers={[]}
          labels={{
            activeTitle: t("activeUsersHeading"),
            activeDescription: t("activeUsersTableDescription"),
            grantsTitle: t("grantsGovUsersHeading"),
            grantsDescription: t("grantsGovUsersTableDescription"),
            pendingTitle: t("pendingUsersHeading"),
            pendingDescription: t("pendingUsersTableDescription"),
          }}
        />
      ) : (
        <ErrorMessage>{t("errors.fetchError")}</ErrorMessage>
      )}
    </GridContainer>
  );
}
