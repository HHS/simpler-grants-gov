import { Metadata } from "next";
import EditRiskForm from "src/app/[locale]/(base)/award-recommendation/[id]/risks/[riskId]/edit/_components/EditRiskForm";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import {
  getAwardRecommendationDetails,
  getAwardRecommendationRisk,
  getAwardRecommendationSubmissionsForRisk,
} from "src/services/fetch/fetchers/awardRecommendationFetcher";
import { AwardRecommendationDetails } from "src/types/awardRecommendationTypes";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Alert, Grid, GridContainer } from "@trussworks/react-uswds";

import AwardRecommendationHero from "src/components/award-recommendation/AwardRecommendationHero";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string; riskId: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("AwardRecommendation.risks.editPageTitle"),
    description: t("AwardRecommendation.risks.editMetaDescription"),
  };
  return meta;
}

export const dynamic = "force-dynamic";

export type EditRiskPageProps = {
  params: Promise<{ locale: string; id: string; riskId: string }>;
} & WithFeatureFlagProps;

async function EditRiskPageContent({ params }: EditRiskPageProps) {
  const { id: awardRecommendationId, riskId } = await params;
  const t = await getTranslations("AwardRecommendation");

  let awardRecommendationDetails: AwardRecommendationDetails | null = null;

  try {
    const [details, risk] = await Promise.all([
      getAwardRecommendationDetails(awardRecommendationId),
      getAwardRecommendationRisk(awardRecommendationId, riskId),
    ]);

    awardRecommendationDetails = details;

    if (!risk) {
      return (
        <Alert
          heading={t("errorHeadingAwardRecommendationRisk")}
          headingLevel="h2"
          type="warning"
          validation
        >
          {t("awardRecommendationRiskFetchError")}
        </Alert>
      );
    }

    const riskNumber =
      risk.award_recommendation_risk_number || String(risk.risk_number);
    const heroHeading = t("risks.editRiskTitle", { riskNumber });
    const submissions = await getAwardRecommendationSubmissionsForRisk(
      awardRecommendationId,
      risk.award_recommendation_application_submission_ids,
    );

    return (
      <>
        <Suspense
          fallback={
            <span data-testid="award-recommendation-hero-fallback"></span>
          }
        >
          <AwardRecommendationHero
            awardRecommendationDetails={awardRecommendationDetails}
            heading={heroHeading}
            showDateAndStatus={false}
            additionalBreadcrumbs={[
              {
                title: t("risks.editTitle"),
                path: `/award-recommendation/${awardRecommendationId}/risks`,
              },
              {
                title: heroHeading,
                path: `/award-recommendation/${awardRecommendationId}/risks/${riskId}/edit`,
              },
            ]}
          />
        </Suspense>
        <GridContainer>
          <Grid row>
            <Grid col={12}>
              <div className="margin-top-4">
                <EditRiskForm
                  awardRecommendationId={awardRecommendationId}
                  risk={risk}
                  submissions={submissions}
                />
              </div>
            </Grid>
          </Grid>
        </GridContainer>
      </>
    );
  } catch (error) {
    console.error("Failed to fetch award recommendation risk details", error);
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

export default withFeatureFlag<EditRiskPageProps, never>(
  EditRiskPageContent,
  "awardRecommendationOff",
  () => redirect("/maintenance"),
);
