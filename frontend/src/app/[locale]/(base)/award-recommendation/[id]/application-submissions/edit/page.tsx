import { Metadata } from "next";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getAwardRecommendationDetails } from "src/services/fetch/fetchers/awardRecommendationFetcher";
import { AwardRecommendationDetails } from "src/types/awardRecommendationTypes";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Alert } from "@trussworks/react-uswds";

import AwardRecommendationHero from "src/components/award-recommendation/AwardRecommendationHero";
import EditRecommendationsTable from "src/components/award-recommendation/EditRecommendationsTable";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("AwardRecommendation.editRecommendations.pageTitle"),
    description: t("AwardRecommendation.editRecommendations.metaDescription"),
  };
  return meta;
}

export const dynamic = "force-dynamic";

export type EditRecommendationsPageProps = {
  params: Promise<{ locale: string; id: string }>;
} & WithFeatureFlagProps;

async function EditRecommendationsPageContent({
  params,
}: EditRecommendationsPageProps) {
  const { id: awardRecommendationId } = await params;

  const t = await getTranslations("AwardRecommendation");
  const tEdit = await getTranslations(
    "AwardRecommendation.editRecommendations",
  );

  let awardRecommendationDetails: AwardRecommendationDetails | null = null;
  try {
    awardRecommendationDetails = await getAwardRecommendationDetails(
      awardRecommendationId,
    );
  } catch (error) {
    console.error("Failed to fetch award recommendation details", error);
    const errorStatus = parseErrorStatus(error as ApiRequestError);

    if (errorStatus === 401 || errorStatus === 403) {
      return (
        <Alert
          heading={t("errorHeadingAuthentication")}
          headingLevel="h2"
          type="error"
          validation
        >
          {t("authenticationError")}
        </Alert>
      );
    }

    if (errorStatus === 404) {
      awardRecommendationDetails = null;
    } else {
      return (
        <Alert
          heading={t("errorHeadingAwardRecommendation")}
          headingLevel="h2"
          type="warning"
          validation
        >
          {t("awardRecommendationFetchError")}
        </Alert>
      );
    }
  }

  if (!awardRecommendationDetails) {
    return (
      <Alert
        heading={t("errorHeadingAwardRecommendation")}
        headingLevel="h2"
        type="warning"
        validation
      >
        {t("awardRecommendationNotFound")}
      </Alert>
    );
  }

  return (
    <>
      <Suspense
        fallback={
          <span data-testid="award-recommendation-hero-fallback"></span>
        }
      >
        <AwardRecommendationHero
          awardRecommendationDetails={awardRecommendationDetails}
          heading={tEdit("heading")}
          showDateAndStatus={false}
          additionalBreadcrumbs={[
            {
              title: tEdit("heading"),
              path: `/award-recommendation/${awardRecommendationId}/application-submissions/edit`,
            },
          ]}
        />
      </Suspense>

      <div className="grid-container">
        <div className="grid-row">
          <div className="desktop:grid-col-12">
            <h2 className="margin-top-4 margin-bottom-1 font-sans-md">
              {tEdit("pageHeading")}
            </h2>
            <p className="text-base-dark margin-top-0 margin-bottom-4">
              {tEdit("pageDescription")}
            </p>
          </div>
        </div>

        <div className="grid-row margin-top-2">
          <div className="desktop:grid-col-12">
            <EditRecommendationsTable
              awardRecommendationId={awardRecommendationId}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default withFeatureFlag<EditRecommendationsPageProps, never>(
  EditRecommendationsPageContent,
  "awardRecommendationOff",
  () => redirect("/maintenance"),
);
