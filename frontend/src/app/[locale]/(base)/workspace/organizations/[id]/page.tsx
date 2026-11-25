import { Metadata } from "next";
import { OrganizationDetail } from "src/app/[locale]/(base)/workspace/organizations/[id]/_components/OrganizationDetail";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import { featureFlagsManager } from "src/services/featureFlags/FeatureFlagManager";
import { getOrganizationDetails } from "src/services/fetch/fetchers/organizationsFetcher";
import { logger } from "src/services/logger/simplerLogger";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { AuthorizationGate } from "src/components/core/AuthorizationGate";
import { UnauthorizedMessage } from "src/components/core/UnauthorizedMessage";

type OrganizationDetailPageProps = {
  params: Promise<{ id: string }>;
} & WithFeatureFlagProps;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale });
  let title = `${t("OrganizationDetail.pageTitle")} | Simpler.Grants.gov`;
  try {
    const organizationDetails = await getOrganizationDetails(id);
    title = `${t("OrganizationDetail.pageTitle")}: ${organizationDetails.sam_gov_entity.legal_business_name || ""} | Simpler.Grants.gov`;
  } catch (e) {
    logger.error(
      { err: e, organizationId: id },
      "Failed to render page title due to API error",
    );
    if (parseErrorStatus(e as ApiRequestError) === 404) {
      return notFound();
    }
  }
  return {
    title,
    description: t("Index.metaDescription"),
  };
}

async function OrganizationDetailPage({
  params,
  searchParams,
}: OrganizationDetailPageProps) {
  const { id } = await params;
  // Search params are passed so a flag set with ?_ff= applies on the first load
  const externalCollaboratorsEnabled = featureFlagsManager.isFeatureEnabled(
    "enableExternalCollaborators",
    await cookies(),
    searchParams ? await searchParams : undefined,
  );

  return (
    <AuthorizationGate
      resourcePromises={{
        organizationDetails: getOrganizationDetails(id),
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
      <OrganizationDetail
        organizationId={id}
        externalCollaboratorsEnabled={externalCollaboratorsEnabled}
      />
    </AuthorizationGate>
  );
}

export default OrganizationDetailPage;
