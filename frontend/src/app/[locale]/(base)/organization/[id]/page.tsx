import { Metadata } from "next";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import { getSession } from "src/services/auth/session";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getOrganizationDetails } from "src/services/fetch/fetchers/organizationsFetcher";

import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { ErrorMessage, GridContainer } from "@trussworks/react-uswds";

import { OrganizationInfo } from "src/components/organization/OrganizationInfo";

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
    const organizationDetails = await getOrganizationDetails(session.token, id);
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

async function OrganizationDetail({ params }: OrganizationDetailPageProps) {
  const t = await getTranslations("OrganizationDetail");
  const { id } = await params;

  const session = await getSession();
  if (!session?.token) {
    return (
      <GridContainer className="padding-top-2 tablet:padding-y-6">
        <div>not logged in</div>
      </GridContainer>
    );
  }
  let organizationDetails;
  try {
    organizationDetails = await getOrganizationDetails(session.token, id);
  } catch (e) {
    console.error("Unable to fetch user details", e);
  }

  if (!organizationDetails) {
    return (
      <GridContainer className="padding-top-2 tablet:padding-y-6">
        <ErrorMessage>{t("fetchError")}</ErrorMessage>
      </GridContainer>
    );
  }

  return (
    <GridContainer className="padding-top-2 tablet:padding-y-6">
      <h1>{organizationDetails.sam_gov_entity.legal_business_name}</h1>
      <OrganizationInfo
        organizationDetails={organizationDetails.sam_gov_entity}
      />
    </GridContainer>
  );
}

export default withFeatureFlag<OrganizationDetailPageProps, never>(
  OrganizationDetail,
  "userAdminOff",
  () => redirect("/maintenance"),
);
