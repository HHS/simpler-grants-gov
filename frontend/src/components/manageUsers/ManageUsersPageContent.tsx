import { getOrganizationDetails } from "src/services/fetch/fetchers/organizationsFetcher";
import { Organization } from "src/types/applicationResponseTypes";
import { AuthorizedData, FetchedResource } from "src/types/authTypes";

import { getTranslations } from "next-intl/server";
import { Grid, GridContainer } from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/Breadcrumbs";
import { PageHeader } from "src/components/manageUsers/PageHeader";
import { ActiveUsersSection } from "./ActiveUsersSection";
import { InvitedUsersSection } from "./InvitedUsersSection";
import { InviteLegacyUsersButton } from "./InviteLegacyUsersButton";
import { UserOrganizationInvite } from "./UserOrganizationInvite";

export async function ManageUsersPageContent({
  organizationId,
  authorizedData,
}: {
  organizationId: string;
  authorizedData?: AuthorizedData;
}) {
  const t = await getTranslations("ManageUsers");
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
          {
            title: name ?? "Organization",
            path: `/organization/${organizationId}`,
          },
          {
            title: `${t("pageHeading")}`,
            path: `/organization/${organizationId}/manage-users`,
          },
        ]}
      />
      <Grid row>
        <Grid tablet={{ col: "fill" }}>
          <PageHeader organizationName={name} />
        </Grid>
        <Grid
          className="margin-top-auto margin-bottom-6"
          tablet={{ col: "auto" }}
        >
          <InviteLegacyUsersButton organizationId={organizationId} />
        </Grid>
      </Grid>
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
