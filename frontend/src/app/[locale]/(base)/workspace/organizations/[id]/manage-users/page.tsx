import { ManageUsersPageContent } from "src/app/[locale]/(base)/workspace/organizations/[id]/manage-users/_components/ManageUsersPageContent";
import { featureFlagsManager } from "src/services/featureFlags/FeatureFlagManager";
import {
  getOrganizationPendingInvitations,
  getOrganizationRoles,
  getOrganizationUsers,
} from "src/services/fetch/fetchers/organizationsFetcher";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";

import { AuthorizationGate } from "src/components/core/AuthorizationGate";
import { UnauthorizedMessage } from "src/components/core/UnauthorizedMessage";

interface ManageUsersPageProps extends WithFeatureFlagProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("ManageUsers.pageTitle"),
    description: t("Index.metaDescription"),
  };
}

async function ManageUsersPage({ params, searchParams }: ManageUsersPageProps) {
  const { id: organizationId } = await params;
  // Search params are passed so a flag set with ?_ff= applies on the first load
  const externalCollaboratorsEnabled = featureFlagsManager.isFeatureEnabled(
    "enableExternalCollaborators",
    await cookies(),
    searchParams ? await searchParams : undefined,
  );

  return (
    <AuthorizationGate
      resourcePromises={{
        invitedUsersList: getOrganizationPendingInvitations(organizationId),
        activeUsersList: getOrganizationUsers(organizationId),
        organizationRolesList: getOrganizationRoles(organizationId),
      }}
      requiredPrivileges={[
        {
          resourceId: organizationId,
          resourceType: "organization",
          privilege: "manage_org_members",
        },
      ]}
      onUnauthorized={() => <UnauthorizedMessage />}
    >
      <ManageUsersPageContent
        organizationId={organizationId}
        externalCollaboratorsEnabled={externalCollaboratorsEnabled}
      />
    </AuthorizationGate>
  );
}

export default ManageUsersPage;
