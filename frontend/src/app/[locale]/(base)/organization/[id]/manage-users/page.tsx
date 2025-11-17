import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { ManageUsersPageContent } from "src/components/manageUsers/ManageUsersPageContent";
import { LocalizedPageProps } from "src/types/intl";

export type ManageUsersPageParams = LocalizedPageProps & {
  id: string;
};

interface ManageUsersPageProps {
  params: ManageUsersPageParams;
}


export async function generateMetadata({
  params,
}: ManageUsersPageParams) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("ManageUsers.pageTitle"),
    description: t("Index.metaDescription"),
  };
}

function ManageUsersPage({ params }: ManageUsersPageProps) {
  return <ManageUsersPageContent params={params} />;
}

export default withFeatureFlag<ManageUsersPageProps, never>(
  ManageUsersPage,
  "manageUsersOff",
  () => redirect("/maintenance"),
);
