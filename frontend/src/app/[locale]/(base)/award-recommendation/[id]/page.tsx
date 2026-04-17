import { Metadata } from "next";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getAwardRecommendationDetails } from "src/services/fetch/fetchers/awardRecommendationFetcher";
import { AwardRecommendationDetails } from "src/types/awardRecommendationTypes";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Alert, Grid, GridContainer } from "@trussworks/react-uswds";

import AwardRecommendationHero, {
  HeroButtonConfig,
} from "src/components/award-recommendation/AwardRecommendationHero";
import { RecommendationSection } from "src/components/award-recommendation/RecommendationSection";
import { RecommendationSummarySection } from "src/components/award-recommendation/RecommendationSummarySection";
import { SummaryDescriptionDisplay } from "src/components/opportunity/OpportunityDescription";
import { submitAwardRecommendationForReview } from "./actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id?: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("AwardRecommendation.pageTitle"),
    description: t("AwardRecommendation.metaDescription"),
  };
  return meta;
}

export type AwardRecommendationPageProps = {
  params: Promise<{ locale: string; id?: string }>;
} & WithFeatureFlagProps;

interface OpportunitySectionProps {
  awardRecommendationDetails: AwardRecommendationDetails;
}

const OpportunitySection = ({
  awardRecommendationDetails,
}: OpportunitySectionProps) => {
  const t = useTranslations("AwardRecommendation");
  const opportunityData = awardRecommendationDetails.opportunity;
  const fundingOppName =
    opportunityData.opportunity_title || t("fundingOpportunityFallback");
  const fundingOppNumber =
    opportunityData.opportunity_number || t("noDataFallback");
  const summaryDescription = opportunityData.summary?.summary_description || "";
  const hasSummary = !!summaryDescription;

  return (
    <div>
      <Grid row className="grid-gap">
        <Grid col={9} tablet={{ col: 9 }}>
          <div className="margin-top-3 margin-bottom-3">
            <div className="margin-bottom-3">
              <h2 className="margin-top-0 margin-bottom-0">
                {t("opportunity")}
              </h2>
            </div>
            <div className="border radius-md border-base-lighter padding-3 bg-white">
              <div className="margin-bottom-4 display-flex gap-3">
                <div className="flex-1">
                  <p className="text-bold margin-bottom-1 font-sans-sm">
                    {t("fundingOppName")}
                  </p>
                  <Link
                    href={`/opportunity/${opportunityData.opportunity_id}`}
                    className="text-decoration-none"
                  >
                    <p className="text-primary-darker hover:text-primary margin-top-0">
                      {fundingOppName}
                    </p>
                  </Link>
                </div>
                <div className="flex-0">
                  <p className="text-bold margin-bottom-1 font-sans-sm">
                    {t("fundingOppNumber")}
                  </p>
                  {fundingOppNumber}
                </div>
              </div>
              <p className="text-bold margin-bottom-2">
                {t("opportunitySummary")}
              </p>
              <div className="margin-bottom-3">
                {hasSummary ? (
                  <SummaryDescriptionDisplay
                    summaryDescription={summaryDescription || ""}
                  />
                ) : (
                  <div>{t("noSummaryAvailable")}</div>
                )}
              </div>
              <p className="text-bold margin-bottom-2">
                {t("otherOpportunityInfo.label")}
              </p>
              <SummaryDescriptionDisplay
                summaryDescription={
                  awardRecommendationDetails.additional_info || ""
                }
              />
            </div>
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

async function AwardRecommendationPageContent({
  params,
}: AwardRecommendationPageProps) {
  const { id: awardRecommendationId } = await params;

  const t = await getTranslations("AwardRecommendation");

  // Define button configuration for preview page
  const heroButtons: HeroButtonConfig[] = [
    {
      type: "navigation",
      label: t("heroButtons.edit"),
      href: `/award-recommendation/${awardRecommendationId}/edit`,
      outline: true,
    },
    {
      type: "action",
      label: t("heroButtons.submitForReview"),
      formAction: submitAwardRecommendationForReview,
    },
  ];

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

      // Handle authentication errors specifically
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

  return (
    <form>
      {awardRecommendationDetails && (
        <Suspense
          fallback={
            <span data-testid="award-recommendation-hero-fallback"></span>
          }
        >
          <AwardRecommendationHero
            awardRecommendationDetails={awardRecommendationDetails}
            buttons={heroButtons}
          />
        </Suspense>
      )}
      <GridContainer>
        {awardRecommendationDetails && (
          <>
            <OpportunitySection
              awardRecommendationDetails={awardRecommendationDetails}
            />
            <RecommendationSection
              mode="view"
              recommendationMethod={
                awardRecommendationDetails.award_selection_method ===
                "merit-review-only"
                  ? t("recommendationMethod.meritReviewOnly")
                  : t("recommendationMethod.meritReviewOther")
              }
              recommendationMethodDetails={
                awardRecommendationDetails.selection_method_detail
              }
              otherKeyInformation={
                awardRecommendationDetails.other_key_information
              }
            />
            <RecommendationSummarySection
              summary={awardRecommendationDetails.award_recommendation_summary}
              fundingStrategy={awardRecommendationDetails.funding_strategy}
              viewMode={true}
            />
          </>
        )}
      </GridContainer>
    </form>
  );
}

export default withFeatureFlag<AwardRecommendationPageProps, never>(
  AwardRecommendationPageContent,
  "awardRecommendationOff",
  () => redirect("/maintenance"),
);
