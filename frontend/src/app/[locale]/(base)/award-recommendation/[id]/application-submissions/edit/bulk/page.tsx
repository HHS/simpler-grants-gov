import { Metadata } from "next";
import EditRecommendationsForm from "src/app/[locale]/(base)/award-recommendation/[id]/application-submissions/edit/bulk/_components/EditRecommendationsForm";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getAwardRecommendationDetails } from "src/services/fetch/fetchers/awardRecommendationFetcher";
import { AwardRecommendationDetails } from "src/types/awardRecommendationTypes";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Alert, Grid, GridContainer } from "@trussworks/react-uswds";

import AwardRecommendationHero, {
  HeroButtonConfig,
} from "src/components/award-recommendation/AwardRecommendationHero";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id?: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("AwardRecommendation.editRecommendations.bulkEditPageTitle"),
    description: t(
      "AwardRecommendation.editRecommendations.bulkEditMetaDescription",
    ),
  };
  return meta;
}

export const dynamic = "force-dynamic";

export type BulkEditRecommendationsPageProps = {
  params: Promise<{ locale: string; id?: string }>;
} & WithFeatureFlagProps;

async function BulkEditRecommendationsPageContent({
  params,
}: BulkEditRecommendationsPageProps) {
  const { id: awardRecommendationId } = await params;

  const t = await getTranslations("AwardRecommendation");

  const heroButtons: HeroButtonConfig[] = [
    {
      type: "navigation",
      label: t("heroButtons.backToSubmissions"),
      href: `/award-recommendation/${awardRecommendationId}/application-submissions/edit`,
      outline: true,
    },
  ];

  const heroHeading = t("editRecommendations.bulkEditTitle");

  let awardRecommendationDetails: AwardRecommendationDetails | null = null;
  if (awardRecommendationId) {
    try {
      awardRecommendationDetails = await getAwardRecommendationDetails(
        awardRecommendationId,
      );
    } catch (error) {
      console.error("Failed to fetch award recommendation details", error);
      const errorStatus = parseErrorStatus(error as ApiRequestError);

      if (errorStatus === 404) {
        awardRecommendationDetails = null;
      }

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
          buttons={heroButtons}
          heading={heroHeading}
          showDateAndStatus={false}
          additionalBreadcrumbs={[
            {
              title: t("editRecommendations.heading"),
              path: `/award-recommendation/${awardRecommendationId}/application-submissions/edit`,
            },
            {
              title: heroHeading,
              path: `/award-recommendation/${awardRecommendationId}/application-submissions/edit/bulk`,
            },
          ]}
        />
      </Suspense>
      <GridContainer>
        <Grid row>
          <Grid col={12}>
            <div className="margin-top-4">
              {awardRecommendationId && (
                <EditRecommendationsForm
                  awardRecommendationId={awardRecommendationId}
                />
              )}
            </div>
          </Grid>
        </Grid>
      </GridContainer>
    </>
  );
}

export default withFeatureFlag<BulkEditRecommendationsPageProps, never>(
  BulkEditRecommendationsPageContent,
  "awardRecommendationOff",
  () => redirect("/maintenance"),
);
