import {
  ApiResponse,
  Opportunity,
} from "../../../../types/opportunity/opportunityResponseTypes";

import BetaAlert from "src/components/BetaAlert";
import Breadcrumbs from "src/components/Breadcrumbs";
import { GridContainer } from "@trussworks/react-uswds";
import { Metadata } from "next";
import NotFound from "../../../not-found";
import { OPPORTUNITY_CRUMBS } from "src/constants/breadcrumbs";
import OpportunityAwardInfo from "src/components/opportunity/OpportunityAwardInfo";
import OpportunityDescription from "src/components/opportunity/OpportunityDescription";
import OpportunityHistory from "src/components/opportunity/OpportunityHistory";
import OpportunityIntro from "src/components/opportunity/OpportunityIntro";
import OpportunityLink from "src/components/opportunity/OpportunityLink";
import OpportunityListingAPI from "../../../api/OpportunityListingAPI";
import OpportunityStatusWidget from "src/components/opportunity/OpportunityStatusWidget";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations({ locale: "en" });
  const meta: Metadata = {
    title: t("OpportunityListing.page_title"),
    description: t("OpportunityListing.meta_description"),
  };
  return meta;
}

export default async function OpportunityListing({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  // Opportunity id needs to be a number greater than 1
  if (isNaN(id) || id < 0) {
    return <NotFound />;
  }

  const api = new OpportunityListingAPI();
  let opportunity: ApiResponse;
  try {
    opportunity = await api.getOpportunityById(id);
  } catch (error) {
    console.error("Failed to fetch opportunity:", error);
    return <NotFound />;
  }

  if (!opportunity.data) {
    return <NotFound />;
  }

  const opportunityData: Opportunity = opportunity.data;

  OPPORTUNITY_CRUMBS.push({
    title: opportunityData.opportunity_title,
    path: `/opportunity/${opportunityData.opportunity_id}/`,
  });

  return (
    <div>
      <BetaAlert />
      <Breadcrumbs breadcrumbList={OPPORTUNITY_CRUMBS} />
      <OpportunityIntro opportunityData={opportunityData} />
      <GridContainer>
        <div className="grid-row">
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
