import { Metadata } from "next";
import OpportunityListingAPI from "src/app/api/OpportunityListingAPI";
import NotFound from "src/app/not-found";
import { OPPORTUNITY_CRUMBS } from "src/constants/breadcrumbs";
import withFeatureFlag from "src/hoc/search/withFeatureFlag";
import { Opportunity } from "src/types/opportunity/opportunityResponseTypes";

import { getTranslations } from "next-intl/server";
import { GridContainer } from "@trussworks/react-uswds";

import BetaAlert from "src/components/BetaAlert";
import Breadcrumbs from "src/components/Breadcrumbs";
import OpportunityAwardInfo from "src/components/opportunity/OpportunityAwardInfo";
import OpportunityDescription from "src/components/opportunity/OpportunityDescription";
import OpportunityHistory from "src/components/opportunity/OpportunityHistory";
import OpportunityIntro from "src/components/opportunity/OpportunityIntro";
import OpportunityLink from "src/components/opportunity/OpportunityLink";
import OpportunityStatusWidget from "src/components/opportunity/OpportunityStatusWidget";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const t = await getTranslations({ locale: "en" });
  const id = Number(params.id);
  const opportunityData = (await getOpportunityData(id)) as Opportunity;
  const title = opportunityData?.opportunity_title
    ? opportunityData?.opportunity_title
    : "";
  const meta: Metadata = {
    title: `${t("OpportunityListing.page_title")} - ${title}`,
    description: t("OpportunityListing.meta_description"),
  };
  return meta;
}

async function getOpportunityData(id: number) {
  const api = new OpportunityListingAPI();
  try {
    const opportunity = await api.getOpportunityById(id);
    return oppportunity.data;
  } catch (error) {
    console.error("Failed to fetch opportunity:", error);
    return null;
  }
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
  };
}

async function OpportunityListing({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const breadcrumbs = Object.assign([], OPPORTUNITY_CRUMBS);
  // Opportunity id needs to be a number greater than 1
  if (isNaN(id) || id < 0) {
    return <NotFound />;
  }

  const opportunityData = (await getOpportunityData(id)) as Opportunity;
  if (!opportunityData) {
    return <NotFound />;
  }
  opportunityData.summary = opportunityData?.summary
    ? opportunityData.summary
    : emptySummary();

  breadcrumbs.push({
    title: opportunityData.opportunity_title,
    path: `/opportunity/${opportunityData.opportunity_id}/`,
  });

  return (
    <div>
      <BetaAlert />
      <Breadcrumbs breadcrumbList={breadcrumbs} />
      <OpportunityIntro opportunityData={opportunityData} />
      <GridContainer>
        <div className="grid-row grid-gap">
          <div className="desktop:grid-col-8 tablet:grid-col-12 tablet:order-1 desktop:order-first">
            <OpportunityDescription opportunityData={opportunityData} />
            <OpportunityLink opportunityData={opportunityData} />
          </div>

          <div className="desktop:grid-col-4 tablet:grid-col-12 tablet:order-0">
            <OpportunityStatusWidget opportunityData={opportunityData} />
            <OpportunityAwardInfo opportunityData={opportunityData} />
            <OpportunityHistory opportunityData={opportunityData} />
          </div>
        </div>
      </GridContainer>
    </div>
  );
}

export default withFeatureFlag(OpportunityListing, "showSearchV0");
