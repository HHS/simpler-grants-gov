import { APIResponse } from "src/types/apiResponseTypes";

export type OpportunityStatus = "archived" | "closed" | "posted" | "forecasted";

export interface OpportunityAssistanceListing {
  assistance_listing_number: string;
  program_title: string;
}

export interface OpportunityDocument {
  opportunity_attachment_type: string;
  file_name: string;
  download_path: string;
  updated_at: string;
}

interface MinimalSummary {
  close_date: string | null;
  is_forecast: boolean;
  post_date: string | null;
}

export interface Summary extends MinimalSummary {
  additional_info_url: string | null;
  additional_info_url_description: string | null;
  agency_code: string | null;
  agency_contact_description: string | null;
  agency_email_address: string | null;
  agency_email_address_description: string | null;
  agency_name: string | null;
  agency_phone_number: string | null;
  applicant_eligibility_description: string | null;
  applicant_types: string[] | null;
  archive_date: string | null;
  award_ceiling: number | null;
  award_floor: number | null;
  close_date_description: string | null;
  estimated_total_program_funding: number | null;
  expected_number_of_awards: number | null;
  fiscal_year: number | null;
  forecasted_award_date: string | null;
  forecasted_close_date: string | null;
  forecasted_close_date_description: string | null;
  forecasted_post_date: string | null;
  forecasted_project_start_date: string | null;
  funding_categories: string[] | null;
  funding_category_description: string | null;
  funding_instruments: string[] | null;
  is_cost_sharing: boolean | null;
  summary_description: string | null;
  version_number: number | null;
}

export interface MinimalOpportunity {
  opportunity_id: number;
  opportunity_status: OpportunityStatus;
  opportunity_title: string | null;
  summary: MinimalSummary;
}

export interface BaseOpportunity extends MinimalOpportunity {
  agency_code: string | null;
  agency_name: string | null;
  category: string | null;
  category_explanation: string | null;
  created_at: string;
  opportunity_assistance_listings: OpportunityAssistanceListing[]; // need to true up vs OpportunityAssistanceListing
  opportunity_number: string;
  summary: Summary;
  top_level_agency_name: string | null;
  updated_at: string;
}

export interface OpportunityDetail extends BaseOpportunity {
  attachments: OpportunityDocument[];
}

export interface OpportunityApiResponse extends APIResponse {
  data: OpportunityDetail;
}
