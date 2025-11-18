import withFeatureFlagProps from "src/services/featureFlags/withFeatureFlag";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { ManageUsersPageContent } from "src/components/manageUsers/ManageUsersPageContent";

interface ManageUsersPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
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

  return <ManageUsersPageContent organizationId={organizationId} />;
}

export default withFeatureFlagProps<ManageUsersPageProps, never>(
  ManageUsersPage,
  "manageUsersOff",
  () => redirect("/maintenance"),
);
