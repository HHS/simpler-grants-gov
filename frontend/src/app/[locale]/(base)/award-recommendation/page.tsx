import { Metadata } from "next";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getOpportunityDetails } from "src/services/fetch/fetchers/opportunityFetcher";
import { LocalizedPageProps } from "src/types/intl";
import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Alert,
  ErrorMessage,
  Grid,
  GridContainer,
} from "@trussworks/react-uswds";

import OpportunityDescription from "src/components/opportunity/OpportunityDescription";

export async function generateMetadata({ params }: LocalizedPageProps) {
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

export const dynamic = "force-dynamic";

export type AwardRecommendationPageProps = LocalizedPageProps &
  WithFeatureFlagProps & {
    searchParams?: Promise<{ id?: string }>;
  };

interface OpportunitySectionProps {
  opportunityData: OpportunityDetail;
  locale: string;
}

const OpportunitySectionComponent = async ({
  opportunityData,
  locale,
}: OpportunitySectionProps) => {
  const t = await getTranslations({ locale, namespace: "AwardRecommendation" });
  const fundingOppName =
    opportunityData.opportunity_title || "Funding Opportunity";
  const fundingOppNumber = opportunityData.opportunity_number || "--";
  const summaryDescription = opportunityData.summary.summary_description || "";
  const hasSummary = !!summaryDescription;

  return (
    <div>
      <Grid row className="grid-gap">
        <Grid col={12} tablet={{ col: 9 }}>
          <div className="margin-top-5 margin-bottom-5">
            <div className="display-flex flex-align-center margin-bottom-3">
              <h2 className="flex-1 margin-top-0 margin-bottom-0">
                {t("opportunity", { defaultValue: "Opportunity" })}
              </h2>
              <Link
                href=""
                className="text-primary-darker hover:text-primary text-decoration-none"
              >
                {t("editOpportunityDetails", {
                  defaultValue: "Edit opportunity details",
                })}
              </Link>
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
                  <OpportunityDescription
                    summary={opportunityData.summary}
                    attachments={[]}
                    summaryOnly={true}
                  />
                ) : (
                  <div>No summary available</div>
                )}
              </div>
              <p className="text-bold margin-bottom-2">
                {t("selectionMethod")}
              </p>
              Merit Review
            </div>
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

async function AwardRecommendationPageContent({
  params,
  searchParams,
}: AwardRecommendationPageProps) {
  const { locale } = await params;

  const t = await getTranslations("AwardRecommendation");
  const resolvedSearchParams = (await (searchParams ||
    Promise.resolve({}))) as { id?: string };
  const opportunityId = resolvedSearchParams.id;

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
    <GridContainer>
      <h1 className="margin-top-9 margin-bottom-7">
        {t("pageTitle", { defaultValue: "Review your recommendation" })}
      </h1>

      {opportunityData && (
        <OpportunitySectionComponent
          opportunityData={opportunityData}
          locale={locale}
        />
      )}
    </GridContainer>
  );
}

export default withFeatureFlag<AwardRecommendationPageProps, never>(
  AwardRecommendationPageContent,
  "awardRecommendationOff",
  () => redirect("/maintenance"),
);
