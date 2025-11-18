import { getOrganizationDetails } from "src/services/fetch/fetchers/organizationsFetcher";
import { Organization } from "src/types/applicationResponseTypes";

import { GridContainer } from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/Breadcrumbs";
import { PageHeader } from "src/components/manageUsers/PageHeader";
import { PendingUsersSection } from "./PendingUsersSection";
import { UserOrganizationInvite } from "./UserOrganizationInvite";

export async function ManageUsersPageContent({
  organizationId,
}: {
  organizationId: string;
}) {
  let userOrganizations: Organization | undefined;
  try {
    userOrganizations = await getOrganizationDetails(organizationId);
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
      <PageHeader organizationName={name} />
      <UserOrganizationInvite organizationId={organizationId} />
      <PendingUsersSection organizationId={organizationId} />
    </GridContainer>
  );
}
