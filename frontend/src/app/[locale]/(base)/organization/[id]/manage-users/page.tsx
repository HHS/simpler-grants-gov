import { Metadata } from "next";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import { getSession } from "src/services/auth/session";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getOrganizationDetails } from "src/services/fetch/fetchers/organizationsFetcher";

import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { ManageUsersPageContent } from "src/components/manageUsers/ManageUsersPageContent";
import { AuthorizationGate } from "src/components/user/AuthorizationGate";
import { UnauthorizedMessage } from "src/components/user/UnauthorizedMessage";

interface ManageUsersPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
    const meta: Metadata = {
    title: t("ManageUsers.pageTitle"),
    description: t("Index.metaDescription"),
  };

  return meta
}

async function ManageUsersPage({ params }: ManageUsersPageProps) {
  const session = await getSession();
  const { id } = await params;
  return (
    <AuthorizationGate
      resourcePromises={{
        organizationDetails: getOrganizationDetails(session?.token || "", id),
      }}
      requiredPrivileges={[
        {
          resourceId: id,
          resourceType: "organization",
          privilege: "manage_org_members",
        },
      ]}
      onUnauthorized={() => <UnauthorizedMessage />}
    >
      <ManageUsersPageContent organizationId={id} />
    </AuthorizationGate>
  );
}

export default withFeatureFlag<ManageUsersPageProps, never>(
  ManageUsersPage,
  "manageUsersOff",
  () => redirect("/maintenance"),
);