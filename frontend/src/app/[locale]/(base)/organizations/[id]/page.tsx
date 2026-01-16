import { Metadata } from "next";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import { getSession } from "src/services/auth/session";
import { getOrganizationDetails } from "src/services/fetch/fetchers/organizationsFetcher";

import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { OrganizationDetail } from "src/components/organization/OrganizationDetail";
import { AuthorizationGate } from "src/components/user/AuthorizationGate";
import { UnauthorizedMessage } from "src/components/user/UnauthorizedMessage";

type OrganizationDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale });
  let title = `${t("OrganizationDetail.pageTitle")}`;
  try {
    const session = await getSession();
    if (!session?.token) {
      throw new Error("not logged in");
    }
    const organizationDetails = await getOrganizationDetails(id);
    title = `${t("OrganizationDetail.pageTitle")} - ${organizationDetails.sam_gov_entity.legal_business_name || ""}`;
  } catch (error) {
    console.error("Failed to render page title due to API error", error);
    if (parseErrorStatus(error as ApiRequestError) === 404) {
      return notFound();
    }
  }
  return {
    title,
    description: t("Index.metaDescription"),
  };
}

async function OrganizationDetailPage({ params }: OrganizationDetailPageProps) {
  const { id } = await params;

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
      <OrganizationDetail organizationId={id} />
    </AuthorizationGate>
  );
}

export default OrganizationDetailPage;
