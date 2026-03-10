import { Metadata } from "next";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getOpportunityDetails } from "src/services/fetch/fetchers/opportunityFetcher";
import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Alert, Grid, GridContainer } from "@trussworks/react-uswds";

import AwardRecommendationHero from "src/components/award-recommendation/AwardRecommendationHero";
import { SummaryDescriptionDisplay } from "src/components/opportunity/OpportunityDescription";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id?: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("AwardRecommendation.pageTitle", {
      defaultValue: "Review your recommendation",
    }),
    description: t("AwardRecommendation.metaDescription", {
      defaultValue: "View your award recommendations",
    }),
  };
  return meta;
}

export type AwardRecommendationPageProps = {
  params: Promise<{ locale: string; id?: string }>;
} & WithFeatureFlagProps;

interface OpportunitySectionProps {
  opportunityData: OpportunityDetail;
  locale: string;
}

const OpportunitySection = ({
  opportunityData,
  locale: _locale,
}: OpportunitySectionProps) => {
  const t = useTranslations("AwardRecommendation");
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
          <div className="margin-top-5 margin-bottom-5">
            <div className="margin-bottom-3">
              <h2 className="margin-top-0 margin-bottom-0">
                {t("opportunity", { defaultValue: "Opportunity" })}
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
                    <p className="text-primary-darker hover:text-primary">
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
                {t("selectionMethod")}
              </p>
              {t("meritReview")}
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
  const { locale, id: awardRecommendationId } = await params;

  const t = await getTranslations("AwardRecommendation");
  const opportunityId = "6a483cd8-9169-418a-8dfb-60fa6e6f51e5";

  let opportunityData: OpportunityDetail | null = null;
  if (opportunityId) {
    try {
      const response = await getOpportunityDetails(opportunityId);
      opportunityData = response.data;
    } catch (error) {
      console.error("Failed to fetch opportunity details", error);
      if (parseErrorStatus(error as ApiRequestError) === 404) {
        opportunityData = null;
      }
      return (
        <Alert
          heading={t("errorHeadingOppurtunity")}
          headingLevel="h2"
          type="warning"
          validation
        >
          {t("oppurtunityFetchError")}
        </Alert>
      );
    }
  }

  return (
    <>
      {awardRecommendationId && (
        <Suspense
          fallback={
            <span data-testid="award-recommendation-hero-fallback"></span>
          }
        >
          <AwardRecommendationHero
            awardRecommendationId={awardRecommendationId}
          />
        </Suspense>
      )}
      <GridContainer>
        {opportunityData && (
          <OpportunitySection
            opportunityData={opportunityData}
            locale={locale}
          />
        )}
      </GridContainer>
    </>
  );
}

export default withFeatureFlag<AwardRecommendationPageProps, never>(
  AwardRecommendationPageContent,
  "awardRecommendationOff",
  () => redirect("/maintenance"),
);
