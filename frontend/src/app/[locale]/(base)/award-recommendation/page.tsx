import { Metadata } from "next";
import AwardRecommendationsListContent from "src/app/[locale]/(base)/award-recommendation/_components/AwardRecommendationsListContent";
import TopLevelError from "src/app/[locale]/(base)/error/page";
import Unauthenticated from "src/app/[locale]/(base)/unauthenticated/page";
import { MissingAuthError } from "src/errors";
import { getSession } from "src/services/auth/session";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getUserAgencies } from "src/services/fetch/fetchers/agenciesFetcher";
import { LocalizedPageProps } from "src/types/intl";
import { RelevantAgencyRecord } from "src/types/search/searchFilterTypes";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Alert, GridContainer } from "@trussworks/react-uswds";

import AwardRecommendationHero from "src/components/award-recommendation/AwardRecommendationHero";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("AwardRecommendation.list.pageTitle"),
    description: t("AwardRecommendation.metaDescription"),
  };
  return meta;
}

export const dynamic = "force-dynamic";

export type AwardRecommendationsListPageProps = LocalizedPageProps &
  WithFeatureFlagProps;

async function AwardRecommendationsListPage({
  searchParams,
}: AwardRecommendationsListPageProps) {
  const t = await getTranslations("AwardRecommendation");

  const resolvedSearchParams: Record<string, string | string[] | undefined> =
    searchParams ? await searchParams : {};
  const selectedAgencyParam: string | string[] | undefined =
    resolvedSearchParams.agency;
  const selectedAgencyId: string | undefined = Array.isArray(
    selectedAgencyParam,
  )
    ? selectedAgencyParam[0]
    : selectedAgencyParam;

  const userSession = await getSession();
  if (!userSession?.token) {
    return <TopLevelError />;
  }

  let userAgencies: RelevantAgencyRecord[];
  try {
    userAgencies = await getUserAgencies(userSession.user_id);
  } catch (error) {
    if (error instanceof MissingAuthError) {
      return <Unauthenticated />;
    }
    return (
      <Alert heading={t("list.pageHeading")} headingLevel="h2" type="error">
        {t("errorMessage")}
      </Alert>
    );
  }

  if (!userAgencies.length) {
    return (
      <Alert heading={t("list.pageHeading")} headingLevel="h2" type="error">
        {t("list.noAgencies")}
      </Alert>
    );
  }

  const sortedUserAgencies = [...userAgencies].sort((a, b) =>
    a.agency_name.localeCompare(b.agency_name),
  );

  if (!selectedAgencyId) {
    redirect(`?agency=${sortedUserAgencies[0].agency_id}`);
  }

  const selectedAgency = sortedUserAgencies.find(
    (agency) => agency.agency_id.toString() === selectedAgencyId,
  );
  if (!selectedAgency) {
    return (
      <Alert heading={t("list.pageHeading")} headingLevel="h2" type="error">
        {t("list.agencyNotAuthorized")}
      </Alert>
    );
  }

  return (
    <>
      <AwardRecommendationHero
        heading={t("list.pageHeading")}
        showDateAndStatus={false}
      />
      <GridContainer>
        <div className="margin-top-6">
          <AwardRecommendationsListContent
            agencies={sortedUserAgencies}
            currentAgencyId={selectedAgencyId}
          />
        </div>
      </GridContainer>
    </>
  );
}

export default withFeatureFlag<AwardRecommendationsListPageProps, never>(
  AwardRecommendationsListPage,
  "awardRecommendationOff",
  () => redirect("/maintenance"),
);
