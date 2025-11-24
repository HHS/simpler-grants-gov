import { getOrganizationDetails } from "src/services/fetch/fetchers/organizationsFetcher";
import { Organization } from "src/types/applicationResponseTypes";
import { AuthorizedData, FetchedResource } from "src/types/authTypes";

import { GridContainer } from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/Breadcrumbs";
import { PageHeader } from "src/components/manageUsers/PageHeader";
import { ActiveUsersSection } from "./ActiveUsersSection";
import { InvitedUsersSection } from "./InvitedUsersSection";
import { UserOrganizationInvite } from "./UserOrganizationInvite";

export async function ManageUsersPageContent({
  organizationId,
  authorizedData,
}: {
  organizationId: string;
  authorizedData?: AuthorizedData;
}) {
  let userOrganizations: Organization | undefined;

  if (!authorizedData) {
    throw new Error(
      "ManageUsersPageContent must be wrapped in AuthorizationGate",
    );
  }

  const { fetchedResources } = authorizedData;

  const { activeUsersList, organizationRolesList, invitedUsersList } =
    fetchedResources as {
      activeUsersList: FetchedResource;
      organizationRolesList: FetchedResource;
      invitedUsersList: FetchedResource;
    };

  try {
    userOrganizations = await getOrganizationDetails(organizationId);
  } catch (error) {
    console.error("Unable to fetch organization information", error);
  }
  const name = userOrganizations?.sam_gov_entity?.legal_business_name;
  return (
    <GridContainer className="padding-top-1">
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
      <ActiveUsersSection
        organizationId={organizationId}
        activeUsers={activeUsersList}
        roles={organizationRolesList}
      />
      <InvitedUsersSection invitedUsers={invitedUsersList} />
    </GridContainer>
  );
}
