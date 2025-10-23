
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { ManageUsersPageContent } from "src/components/manage-users/ManageUsersPageContent";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";

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

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id: organizationId } = await params;
  return <ManageUsersWithFlag organizationId={organizationId} />;
}

const ManageUsersWithFlag = withFeatureFlag<{ organizationId: string }, never>(
  ManageUsersPageContent,
  "userAdminOff",
  () => redirect("/maintenance"),
);