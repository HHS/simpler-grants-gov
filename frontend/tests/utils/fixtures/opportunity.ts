import type {
  MinimalOpportunity,
  OpportunityDetail,
} from "src/types/opportunity/opportunityResponseTypes";

export function makeOpportunityDetail(
  overrides: Partial<OpportunityDetail> = {},
): OpportunityDetail {
  return {
    opportunity_id: "12345",
    legacy_opportunity_id: 0,
    opportunity_status: "posted",
    opportunity_title: "Test Opportunity",

    // BaseOpportunity fields
    agency_code: null,
    agency_name: null,
    category: null,
    category_explanation: null,
    created_at: "2025-01-01T00:00:00Z",
    opportunity_assistance_listings: [],
    opportunity_number: "OPP-12345",
    top_level_agency_name: null,
    updated_at: "2025-01-01T00:00:00Z",

    // Summary fields
    summary: {
      close_date: null,
      is_forecast: false,
      post_date: null,

      additional_info_url: null,
      additional_info_url_description: null,
      agency_code: null,

      agency_contact_description: null,
      agency_email_address: null,
      agency_email_address_description: null,
      agency_name: null,
      agency_phone_number: null,

      applicant_eligibility_description: null,
      applicant_types: null,
      archive_date: null,
      award_ceiling: null,
      award_floor: null,
      close_date_description: null,
      estimated_total_program_funding: null,
      expected_number_of_awards: null,
      fiscal_year: null,
      forecasted_award_date: null,
      forecasted_close_date: null,
      forecasted_close_date_description: null,
      forecasted_post_date: null,
      forecasted_project_start_date: null,
      funding_categories: null,
      funding_category_description: null,
      funding_instruments: null,
      is_cost_sharing: null,
      summary_description: null,
      version_number: null,
    },

    // OpportunityDetail fields
    attachments: [],
    competitions: null,

    ...overrides,
  };
}

export function makeMinimalOpportunity(
  overrides: Partial<MinimalOpportunity> = {},
): MinimalOpportunity {
  return {
    opportunity_id: "12345",
    legacy_opportunity_id: 0,
    opportunity_status: "posted",
    opportunity_title: "Test Opportunity",
    summary: {
      close_date: null,
      is_forecast: false,
      post_date: null,
    },
    ...overrides,
  };
}
