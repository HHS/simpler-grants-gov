import { Metadata } from "next";
import NotFound from "src/app/[locale]/not-found";
import { OPPORTUNITY_CRUMBS } from "src/constants/breadcrumbs";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import withFeatureFlag from "src/services/featureFlags/withFeatureFlag";
import { getOpportunityDetails } from "src/services/fetch/fetchers/opportunityFetcher";
import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";
import { WithFeatureFlagProps } from "src/types/uiTypes";

import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import BetaAlert from "src/components/BetaAlert";
import Breadcrumbs from "src/components/Breadcrumbs";
import ContentLayout from "src/components/ContentLayout";
import OpportunityAwardInfo from "src/components/opportunity/OpportunityAwardInfo";
import OpportunityCTA from "src/components/opportunity/OpportunityCTA";
import OpportunityDescription from "src/components/opportunity/OpportunityDescription";
import OpportunityDocuments from "src/components/opportunity/OpportunityDocuments";
import OpportunityHistory from "src/components/opportunity/OpportunityHistory";
import OpportunityIntro from "src/components/opportunity/OpportunityIntro";
import OpportunityLink from "src/components/opportunity/OpportunityLink";
import OpportunityStatusWidget from "src/components/opportunity/OpportunityStatusWidget";
import { OpportunitySaveUserControl } from "src/components/user/OpportunitySaveUserControl";

type OpportunityListingProps = {
  params: Promise<{ id: string }>;
} & WithFeatureFlagProps;

export const revalidate = 600; // invalidate ten minutes
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const t = await getTranslations({ locale });
  let title = `${t("OpportunityListing.pageTitle")}`;
  try {
    const { data: opportunityData } = await getOpportunityDetails(id);
    title = `${t("OpportunityListing.pageTitle")} - ${opportunityData.opportunity_title || ""}`;
  } catch (error) {
    console.error("Failed to render page title due to API error", error);
    if (parseErrorStatus(error as ApiRequestError) === 404) {
      return notFound();
    }
  }
  const meta: Metadata = {
    title,
    description: t("OpportunityListing.metaDescription"),
  };
  return meta;
}

export function generateStaticParams() {
  return [];
}

function emptySummary() {
  return {
    additional_info_url: null,
    additional_info_url_description: null,
    agency_code: null,
    agency_contact_description: null,
    agency_email_address: null,
    agency_email_address_description: null,
    agency_name: null,
    agency_phone_number: null,
    applicant_eligibility_description: null,
    applicant_types: [],
    archive_date: null,
    award_ceiling: null,
    award_floor: null,
    close_date: null,
    close_date_description: null,
    estimated_total_program_funding: null,
    expected_number_of_awards: null,
    fiscal_year: null,
    forecasted_award_date: null,
    forecasted_close_date: null,
    forecasted_close_date_description: null,
    forecasted_post_date: null,
    forecasted_project_start_date: null,
    funding_categories: [],
    funding_category_description: null,
    funding_instruments: [],
    is_cost_sharing: false,
    is_forecast: false,
    post_date: null,
    summary_description: null,
    version_number: null,
  };
}

async function OpportunityListing({ params }: OpportunityListingProps) {
  const { id } = await params;
  const idForParsing = Number(id);
  const breadcrumbs = Object.assign([], OPPORTUNITY_CRUMBS);
  // Opportunity id needs to be a number greater than 1
  if (isNaN(idForParsing) || idForParsing < 1) {
    return <NotFound />;
  }

  let opportunityData = {} as OpportunityDetail;
  try {
    const response = await getOpportunityDetails(id);
    opportunityData = response.data;
  } catch (error) {
    if (parseErrorStatus(error as ApiRequestError) === 404) {
      return <NotFound />;
    }
    throw error;
  }
  opportunityData.summary = opportunityData?.summary
    ? opportunityData.summary
    : emptySummary();

  breadcrumbs.push({
    title: `${opportunityData.opportunity_title || ""}: ${opportunityData.opportunity_number}`,
    path: `/opportunity/${opportunityData.opportunity_id}/`, // unused but required in breadcrumb implementation
  });

  return (
    <div>
      <BetaAlert />
      <Breadcrumbs breadcrumbList={breadcrumbs} />
      <ContentLayout
        title={opportunityData.opportunity_title}
        data-testid="opportunity-intro-content"
        paddingTop={false}
      >
        <div className="padding-y-3">
          <OpportunitySaveUserControl />
        </div>
        <div className="grid-row grid-gap margin-top-2">
          <div className="desktop:grid-col-8 tablet:grid-col-12 tablet:order-1 desktop:order-first">
            <OpportunityIntro opportunityData={opportunityData} />
            <OpportunityDescription
              summary={opportunityData.summary}
              attachments={opportunityData.attachments}
            />
            <OpportunityDocuments
              documents={opportunityData.attachments}
              opportunityId={opportunityData.opportunity_id}
            />
            <OpportunityLink opportunityData={opportunityData} />
          </div>

          <div className="desktop:grid-col-4 tablet:grid-col-12 tablet:order-0">
            <OpportunityStatusWidget opportunityData={opportunityData} />
            <OpportunityCTA id={opportunityData.opportunity_id} />
            <OpportunityAwardInfo opportunityData={opportunityData} />
            <OpportunityHistory summary={opportunityData.summary} />
          </div>
        </div>
      </ContentLayout>
    </div>
  );
}

export default withFeatureFlag<OpportunityListingProps, never>(
  OpportunityListing,
  "opportunityOff",
  () => redirect("/maintenance"),
);
