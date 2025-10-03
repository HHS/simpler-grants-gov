import { Metadata } from "next";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import { getSession } from "src/services/auth/session";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getOrganizationDetails } from "src/services/fetch/fetchers/organizationsFetcher";
import { SamGovEntity } from "src/types/applicationResponseTypes";

import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { ErrorMessage, Grid, GridContainer } from "@trussworks/react-uswds";

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
    const organizationDetails = await getOrganizationDetails(
      session.token,
      session.user_id,
      id,
    );
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

const OrganizationInfo = ({
  organizationDetails,
}: {
  organizationDetails: SamGovEntity;
}) => {
  const t = useTranslations("OrganizationDetail");
  const {
    ebiz_poc_email,
    ebiz_poc_first_name,
    ebiz_poc_last_name,
    expiration_date,
    uei,
  } = organizationDetails;
  return (
    <Grid row>
      <Grid tablet={{ col: 3 }}>
        <span className="text-bold padding-right-2">{t("ebizPoc")}:</span>
        <span>
          {ebiz_poc_first_name} {ebiz_poc_last_name}
        </span>
      </Grid>
      <Grid tablet={{ col: 3 }}>
        <span className="text-bold padding-right-2">{t("contact")}:</span>
        <span>{ebiz_poc_email}</span>
      </Grid>
      <Grid tablet={{ col: 3 }}>
        <span className="text-bold padding-right-2">{t("uei")}:</span>
        <span>{uei}</span>
      </Grid>
      <Grid tablet={{ col: 3 }}>
        <span className="text-bold padding-right-2">{t("expiration")}:</span>
        <span>{expiration_date}</span>
      </Grid>
    </Grid>
  );
};

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
    organizationDetails = await getOrganizationDetails(
      session.token,
      session.user_id,
      id,
    );
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
