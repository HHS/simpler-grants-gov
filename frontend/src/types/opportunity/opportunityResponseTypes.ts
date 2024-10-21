export interface OpportunityAssistanceListing {
  assistance_listing_number: string;
  program_title: string;
}

export interface Summary {
  additional_info_url: string | null;
  additional_info_url_description: string | null;
  agency_code: string | null;
  agency_contact_description: string | null;
  agency_email_address: string | null;
  agency_email_address_description: string | null;
  agency_name: string | null;
  top_agency_name: string | null;
  agency_phone_number: string | null;
  applicant_eligibility_description: string | null;
  applicant_types: string[];
  archive_date: string | null;
  award_ceiling: number | null;
  award_floor: number | null;
  close_date: string | null;
  close_date_description: string | null;
  estimated_total_program_funding: number | null;
  expected_number_of_awards: number | null;
  fiscal_year: number | null;
  forecasted_award_date: string | null;
  forecasted_close_date: string | null;
  forecasted_close_date_description: string | null;
  forecasted_post_date: string | null;
  forecasted_project_start_date: string | null;
  funding_categories: string[];
  funding_category_description: string | null;
  funding_instruments: string[];
  is_cost_sharing: boolean;
  is_forecast: boolean;
  post_date: string | null;
  summary_description: string | null;
  version_number: number | null;
}

export interface Opportunity {
  agency: string;
  agency_name: string;
  top_agency_name: string;
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
