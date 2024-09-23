export interface OpportunityAssistanceListing {
  assistance_listing_number: string;
  program_title: string;
}

export interface Summary {
  additional_info_url: string | null;
  additional_info_url_description: string | null;
  agency_code: string;
  agency_contact_description: string;
  agency_email_address: string;
  agency_email_address_description: string;
  agency_name: string;
  agency_phone_number: string;
  applicant_eligibility_description: string;
  applicant_types: string[];
  archive_date: string;
  award_ceiling: number;
  award_floor: number;
  close_date: string;
  close_date_description: string;
  estimated_total_program_funding: number;
  expected_number_of_awards: number;
  fiscal_year: number;
  forecasted_award_date: string;
  forecasted_close_date: string;
  forecasted_close_date_description: string;
  forecasted_post_date: string;
  forecasted_project_start_date: string;
  funding_categories: string[];
  funding_category_description: string;
  funding_instruments: string[];
  is_cost_sharing: boolean;
  is_forecast: boolean;
  post_date: string;
  summary_description: string;
}

export interface Opportunity {
  agency: string;
  category: string;
  category_explanation: string | null;
  created_at: string;
  opportunity_assistance_listings: OpportunityAssistanceListing[];
  opportunity_id: number;
  opportunity_number: string;
  opportunity_status: string;
  opportunity_title: string;
  summary: Summary;
  updated_at: string;
}

export interface OpportunityApiResponse {
  data: Opportunity;
  message: string;
  status_code: number;
}
