import DOMPurify from "isomorphic-dompurify";
import { Metadata } from "next";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getOpportunityDetails } from "src/services/fetch/fetchers/opportunityFetcher";
import { LocalizedPageProps } from "src/types/intl";
import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";
import { WithFeatureFlagProps } from "src/types/uiTypes";
import { splitMarkup } from "src/utils/generalUtils";

import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Grid, GridContainer } from "@trussworks/react-uswds";

import ContentDisplayToggle from "src/components/ContentDisplayToggle";

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

const SummaryDescriptionDisplay = ({
  summaryDescription = "",
  showCallToAction,
  hideCallToAction,
}: {
  summaryDescription: string;
  showCallToAction: string;
  hideCallToAction: string;
}) => {
  if (summaryDescription?.length < 750) {
    return (
      <div
        dangerouslySetInnerHTML={{
          __html: summaryDescription
            ? DOMPurify.sanitize(summaryDescription)
            : "--",
        }}
      />
    );
  }

  const purifiedSummary = DOMPurify.sanitize(summaryDescription);
  const { preSplit, postSplit } = splitMarkup(purifiedSummary, 600);

  if (!postSplit) {
    return (
      <div
        dangerouslySetInnerHTML={{
          __html: summaryDescription
            ? DOMPurify.sanitize(summaryDescription)
            : "--",
        }}
      />
    );
  }

  return (
    <>
      <div
        dangerouslySetInnerHTML={{
          __html: preSplit + "...",
        }}
      />
      <ContentDisplayToggle
        showCallToAction={showCallToAction}
        hideCallToAction={hideCallToAction}
        positionButtonBelowContent={false}
      >
        <div
          dangerouslySetInnerHTML={{
            __html: postSplit,
          }}
        />
      </ContentDisplayToggle>
    </>
  );
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
  const summary =
    opportunityData.summary.summary_description || "No summary available";

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
                  <p>{fundingOppNumber}</p>
                </div>
              </div>

              <p className="text-bold margin-bottom-2">
                {t("opportunitySummary")}
              </p>
              <div className="margin-bottom-3">
                <SummaryDescriptionDisplay
                  summaryDescription={summary}
                  showCallToAction={t("readMore", {
                    defaultValue: "Read more",
                  })}
                  hideCallToAction={t("showLess", {
                    defaultValue: "Show less",
                  })}
                />
              </div>
              <p className="text-bold margin-bottom-2">
                {t("selectionMethod")}
              </p>
              <p>Merit Review</p>
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
