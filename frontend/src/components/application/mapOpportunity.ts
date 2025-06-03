import { BaseOpportunity, OpportunityOverview } from "src/types/opportunity/opportunityResponseTypes";

export const mapOpportunityOverview = (opportunity: BaseOpportunity): OpportunityOverview => {
    const {
        agency_name,
        agency_code,
        opportunity_assistance_listings,
        opportunity_id,
        opportunity_number,
        opportunity_title
    } = opportunity
    const {
        agency_contact_description,
        award_ceiling,
        award_floor,
        estimated_total_program_funding,
        expected_number_of_awards,
        is_cost_sharing,
        post_date,
        close_date
    } = opportunity.summary

    return {
        opportunity_title,
        opportunity_id,
        opportunity_number,
        post_date,
        close_date,
        agency_name,
        opportunity_assistance_listings,
        is_cost_sharing,
        agency_code,
        agency_contact_description,
        estimated_total_program_funding,
        expected_number_of_awards,
        award_ceiling,
        award_floor
    };
}