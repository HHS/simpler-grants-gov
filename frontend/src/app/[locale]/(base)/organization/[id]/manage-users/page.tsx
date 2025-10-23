import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { use } from "react";

import { ManageUsersPageContent } from "src/components/manageUsers/ManageUsersPageContent";

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

function ManageUsersPage({ params }: ManageUsersPageProps) {
  const { id: organizationId } = use(params);
  return <ManageUsersPageContent organizationId={organizationId} />;
}

export default withFeatureFlag<ManageUsersPageProps, never>(
  ManageUsersPage,
  "userAdminOff",
  () => redirect("/maintenance"),
);
