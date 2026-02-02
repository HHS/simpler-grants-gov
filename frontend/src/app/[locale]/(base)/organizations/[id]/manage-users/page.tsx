import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import {
  getOrganizationPendingInvitations,
  getOrganizationRoles,
  getOrganizationUsers,
} from "src/services/fetch/fetchers/organizationsFetcher";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { ManageUsersPageContent } from "src/components/manageUsers/ManageUsersPageContent";
import { AuthorizationGate } from "src/components/user/AuthorizationGate";
import { UnauthorizedMessage } from "src/components/user/UnauthorizedMessage";

interface ManageUsersPageProps {
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

async function ManageUsersPage({ params }: ManageUsersPageProps) {
  const { id: organizationId } = await params;

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
      <ManageUsersPageContent organizationId={organizationId} />
    </AuthorizationGate>
  );
}

export default withFeatureFlag<ManageUsersPageProps, never>(
  ManageUsersPage,
  "manageUsersOff",
  () => redirect("/maintenance"),
);
