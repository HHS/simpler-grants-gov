import { BaseOpportunity, OpportunityOverview } from "src/types/opportunity/opportunityResponseTypes";

export const mapOpportunityOverview = (opportunity: BaseOpportunity): OpportunityOverview => {
    const {
        opportunity_assistance_listings,
        opportunity_id,
        opportunity_number,
        opportunity_title
    } = opportunity
    const {
        agency_code,
        agency_contact_description,
        agency_name,
        award_ceiling,
        award_floor,
        estimated_total_program_funding,
        expected_number_of_awards,
        is_cost_sharing,
        post_date,
        close_date
    } = opportunity.summary

    return {
        opportunity_title: opportunity_title,
        opportunity_id: opportunity_id,
        opportunity_number: opportunity_number,
        post_date: post_date,
        close_date: close_date,
        agency_name: agency_name,
        opportunity_assistance_listings: opportunity_assistance_listings,
        is_cost_sharing: is_cost_sharing,
        agency_code: agency_code,
        agency_contact_description: agency_contact_description,
        estimated_total_program_funding: estimated_total_program_funding,
        expected_number_of_awards: expected_number_of_awards,
        award_ceiling: award_ceiling,
        award_floor: award_floor
    };
}