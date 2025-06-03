import {
  BaseOpportunity,
  OpportunityOverview,
} from "src/types/opportunity/opportunityResponseTypes";

export const mapOpportunityOverview = (
  opportunity: BaseOpportunity,
): OpportunityOverview => {
  const {
    agency_code,
    agency_name,
    opportunity_assistance_listings,
    opportunity_id,
    opportunity_number,
    opportunity_title,
  } = opportunity;
  const {
    agency_contact_description,
    award_ceiling,
    award_floor,
    close_date,
    estimated_total_program_funding,
    expected_number_of_awards,
    is_cost_sharing,
    post_date,
  } = opportunity.summary;

  return {
    agency_code,
    agency_contact_description,
    agency_name,
    award_ceiling,
    award_floor,
    close_date,
    estimated_total_program_funding,
    expected_number_of_awards,
    is_cost_sharing,
    opportunity_id,
    opportunity_title,
    opportunity_number,
    opportunity_assistance_listings,
    post_date,
  };
};
