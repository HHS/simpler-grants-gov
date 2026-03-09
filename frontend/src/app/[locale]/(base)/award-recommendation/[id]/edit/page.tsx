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
import {
  Alert,
  CharacterCount,
  Grid,
  GridContainer,
  Label,
} from "@trussworks/react-uswds";

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
    title: t("AwardRecommendation.pageTitleEdit", {
      defaultValue: "Edit your recommendation",
    }),
    description: t("AwardRecommendation.metaDescriptionEdit", {
      defaultValue: "Edit your award recommendations",
    }),
  };
  return meta;
}

export const dynamic = "force-dynamic";

export type AwardRecommendationPageProps = {
  params: Promise<{ locale: string; id?: string }>;
} & WithFeatureFlagProps;

interface OpportunitySectionProps {
  opportunityData: OpportunityDetail;
  locale: string;
}

const OpportunitySectionComponent = ({
  opportunityData,
  locale: _locale,
}: OpportunitySectionProps) => {
  const t = useTranslations("AwardRecommendation");
  const fundingOppName =
    opportunityData.opportunity_title || "Funding Opportunity";
  const fundingOppNumber = opportunityData.opportunity_number || "--";
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
                    Funding opp name
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
                    Funding opp #
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
                  <div>No summary available</div>
                )}
              </div>
              <div className="margin-bottom-3">
                <Label htmlFor="other-opportunity-info">
                  {t("otherOpportunityInfo.label")}
                </Label>
                <p className="text-base margin-top-1 margin-bottom-2">
                  {t("otherOpportunityInfo.description")}
                </p>
                <CharacterCount
                  id="other-opportunity-info"
                  name="other-opportunity-info"
                  maxLength={1000}
                  isTextArea
                  defaultValue=""
                  rows={6}
                  className="maxw-full"
                />
              </div>
            </div>
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

async function AwardRecommendationEditPageContent({
  params,
}: AwardRecommendationPageProps) {
  const { locale, id: awardRecommendationId } = await params;

  const t = await getTranslations({
    locale,
    namespace: "AwardRecommendation",
  });
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
        <h1 className="margin-top-9 margin-bottom-7">
          {t("pageTitleEdit", { defaultValue: "Edit your recommendation" })}
        </h1>

        {opportunityData && (
          <OpportunitySectionComponent
            opportunityData={opportunityData}
            locale={locale}
          />
        )}
      </GridContainer>
    </>
  );
}

export default withFeatureFlag<AwardRecommendationPageProps, never>(
  AwardRecommendationEditPageContent,
  "awardRecommendationOff",
  () => redirect("/maintenance"),
);
