import { getSession } from "src/services/auth/session";
import { getOrganizationDetails } from "src/services/fetch/fetchers/organizationsFetcher";
import { Organization } from "src/types/applicationResponseTypes";

import { getTranslations } from "next-intl/server";
import { ErrorMessage, GridContainer } from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/Breadcrumbs";
import { PageHeader } from "src/components/manageUsers/PageHeader";
import { UserOrganizationInvite } from "./UserOrganizationInvite";

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
  let userOrganizations: Organization | undefined;
  try {
    userOrganizations = await getOrganizationDetails(
      session.token,
      organizationId,
    );
  } catch (error) {
    console.error("Unable to fetch organization information", error);
  }

  const name = userOrganizations?.sam_gov_entity?.legal_business_name;

  return (
    <GridContainer className="padding-top-2 tablet:padding-y-6">
      <Breadcrumbs
        breadcrumbList={[
          { title: "home", path: "/" },
          {
            title: "Workspace",
            path: `/dashboard`,
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
      <PageHeader organizationName={name} pageHeader={t("pageHeading")} />
      <UserOrganizationInvite organizationId={organizationId} />
    </GridContainer>
  );
}
