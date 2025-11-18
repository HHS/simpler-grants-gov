import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { LocalizedPageProps } from "src/types/intl";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { ManageUsersPageContent } from "src/components/manageUsers/ManageUsersPageContent";

export type ManageUsersPageParams = LocalizedPageProps & {
  id: string;
};

interface ManageUsersPageProps {
  params: Promise<ManageUsersPageParams>;
}

export async function generateMetadata({ params }: ManageUsersPageParams) {
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

export default withFeatureFlag<ManageUsersPageProps, never>(
  ManageUsersPage,
  "manageUsersOff",
  () => redirect("/maintenance"),
);
