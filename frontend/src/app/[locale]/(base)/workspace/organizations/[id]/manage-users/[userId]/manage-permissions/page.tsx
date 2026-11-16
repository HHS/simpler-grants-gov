import { Metadata } from "next";
import { ManagePermissionsPageContent } from "src/app/[locale]/(base)/workspace/organizations/[id]/manage-users/[userId]/manage-permissions/_components/ManagePermissionsPageContent";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { AuthorizationGate } from "src/components/core/AuthorizationGate";
import { UnauthorizedMessage } from "src/components/core/UnauthorizedMessage";

type ManagePermissionsPageProps = {
  params: Promise<{ locale: string; id: string; userId: string }>;
} & WithFeatureFlagProps;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("ManagePermissions.pageTitle"),
    description: t("Index.metaDescription"),
  };
}

async function ManagePermissionsPage({ params }: ManagePermissionsPageProps) {
  const { id: organizationId } = await params;

  // No resources are fetched yet, so the gate can't rely on a 403 from a fetch.
  // ManagePermissionsPageContent checks the privilege result itself.
  return (
    <AuthorizationGate
      requiredPrivileges={[
        {
          resourceId: organizationId,
          resourceType: "organization",
          privilege: "manage_org_members",
        },
      ]}
      onUnauthorized={() => <UnauthorizedMessage />}
    >
      <ManagePermissionsPageContent organizationId={organizationId} />
    </AuthorizationGate>
  );
}

// withFeatureFlag renders the wrapped component while the flag is off and
// calls onEnabled once it's on, so the page is only shown when the flag is on.
const FeatureDisabled = () => notFound();

export default withFeatureFlag<ManagePermissionsPageProps, React.JSX.Element>(
  FeatureDisabled,
  "enableExternalCollaborators",
  (props) => <ManagePermissionsPage {...props} />,
);
