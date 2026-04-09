import {
  getOrganizationDetails,
  getOrganizationLegacyUsers,
} from "src/services/fetch/fetchers/organizationsFetcher";
import { Organization } from "src/types/applicationResponseTypes";
import { AuthorizedData, FetchedResource } from "src/types/authTypes";
import { OrganizationLegacyUser } from "src/types/userTypes";

import { InviteLegacyUsersErrorPage } from "src/components/manageUsers/inviteLegacyUsers/InviteLegacyUsersErrorPage";
import { InviteLegacyUsersPageContent } from "src/components/manageUsers/inviteLegacyUsers/InviteLegacyUsersPageContent";
import { AuthorizationGate } from "src/components/user/AuthorizationGate";
import { UnauthorizedMessage } from "src/components/user/UnauthorizedMessage";

type InviteLegacyUsersPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

const LegacyUsersPageContentWithData = ({
  organizationId,
  authorizedData,
}: {
  organizationId: string;
  authorizedData?: AuthorizedData;
}) => {
  if (!authorizedData) {
    return <InviteLegacyUsersErrorPage organizationId={organizationId} />;
  }
  const { fetchedResources } = authorizedData;
  const { organizationDetailsResponse, organizationLegacyUsersResponse } =
    fetchedResources as {
      organizationDetailsResponse: FetchedResource;
      organizationLegacyUsersResponse: FetchedResource;
    };
  const organizationDetails = organizationDetailsResponse.data as Organization;
  const organizationLegacyUsers =
    organizationLegacyUsersResponse.data as OrganizationLegacyUser[];

  if (!organizationDetails || !organizationLegacyUsers) {
    return <InviteLegacyUsersErrorPage organizationId={organizationId} />;
  }

  return (
    <InviteLegacyUsersPageContent
      organizationDetails={organizationDetails}
      organizationLegacyUsers={organizationLegacyUsers}
    />
  );
};

async function InviteLegacyUsersPage({ params }: InviteLegacyUsersPageProps) {
  const { id: organizationId } = await params;
  return (
    <AuthorizationGate
      resourcePromises={{
        organizationDetailsResponse: getOrganizationDetails(organizationId),
        organizationLegacyUsersResponse:
          getOrganizationLegacyUsers(organizationId),
      }}
      requiredPrivileges={[
        {
          resourceId: organizationId,
          resourceType: "organization",
          privilege: "manage_org_members",
        },
      ]}
      onUnauthorized={() => <UnauthorizedMessage />}
      onError={() => (
        <InviteLegacyUsersErrorPage organizationId={organizationId} />
      )}
    >
      <LegacyUsersPageContentWithData organizationId={organizationId} />
    </AuthorizationGate>
  );
}

export default InviteLegacyUsersPage;
