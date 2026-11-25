import { PageHeader } from "src/app/[locale]/(base)/workspace/organizations/[id]/manage-users/_components/PageHeader";
import { getOrganizationDetails } from "src/services/fetch/fetchers/organizationsFetcher";
import { logger } from "src/services/logger/simplerLogger";
import { Organization } from "src/types/applicationResponseTypes";
import { AuthorizedData, FetchedResource } from "src/types/authTypes";
import { hasConfirmedPrivilege } from "src/utils/hasConfirmedPrivilege";

import { getTranslations } from "next-intl/server";
import { Grid, GridContainer } from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/core/Breadcrumbs";
import { ActiveUsersSection } from "./ActiveUsersSection";
import { InvitedUsersSection } from "./InvitedUsersSection";
import { InviteLegacyUsersButton } from "./InviteLegacyUsersButton";
import { UserOrganizationInvite } from "./UserOrganizationInvite";

export async function ManageUsersPageContent({
  organizationId,
  authorizedData,
  externalCollaboratorsEnabled = false,
}: {
  organizationId: string;
  authorizedData?: AuthorizedData;
  externalCollaboratorsEnabled?: boolean;
}) {
  const t = await getTranslations("ManageUsers");
  let userOrganizations: Organization | undefined;

  if (!authorizedData) {
    throw new Error(
      "ManageUsersPageContent must be wrapped in AuthorizationGate",
    );
  }

  const { fetchedResources, confirmedPrivileges } = authorizedData;

  // The gate only blocks on a 403 from a fetched resource, so the privilege
  // check result is read here to decide whether to show the permissions links
  const canManageMembers = hasConfirmedPrivilege(
    confirmedPrivileges,
    organizationId,
    "manage_org_members",
  );

  const { activeUsersList, organizationRolesList, invitedUsersList } =
    fetchedResources as {
      activeUsersList: FetchedResource;
      organizationRolesList: FetchedResource;
      invitedUsersList: FetchedResource;
    };

  try {
    userOrganizations = await getOrganizationDetails(organizationId);
  } catch (e) {
    logger.error(
      { err: e, organizationId },
      "Unable to fetch organization information",
    );
  }
  const name = userOrganizations?.sam_gov_entity?.legal_business_name;

  return (
    <GridContainer>
      <Breadcrumbs
        breadcrumbList={[
          {
            title: t("breadcrumbWorkspace"),
            path: `/workspace`,
          },
          {
            title: t("breadcrumbOrganizations"),
            path: `/workspace/organizations`,
          },
          {
            title: name ?? "Organization",
            path: `/workspace/organizations/${organizationId}`,
          },
          {
            title: t("pageHeading"),
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
      <ActiveUsersSection
        organizationId={organizationId}
        activeUsers={activeUsersList}
        roles={organizationRolesList}
        showManagePermissions={externalCollaboratorsEnabled && canManageMembers}
        showExternal={externalCollaboratorsEnabled}
      />
      <InvitedUsersSection invitedUsers={invitedUsersList} />
      <UserOrganizationInvite organizationId={organizationId} />
    </GridContainer>
  );
}
