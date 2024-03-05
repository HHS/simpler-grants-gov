export interface AssistanceListing {
  assistance_listing_number: string;
  program_title: string;
}

export interface Summary {
  additional_info_url: string;
  additional_info_url_description: string;
  agency_code: string;
  agency_contact_description: string;
  agency_email_address: string;
  agency_email_address_description: string;
  agency_name: string;
  agency_phone_number: string;
  applicant_eligibility_description: string | null;
  archive_date: string;
  award_ceiling: number;
  award_floor: number;
  close_date: string;
  close_date_description: string;
  estimated_total_program_funding: number;
  expected_number_of_awards: number;
  funding_category_description: string | null;
  is_cost_sharing: boolean;
  opportunity_status: string;
  post_date: string;
  summary_description: string;
}

export interface Opportunity {
  agency: string;
  applicant_types: string[];
  category: string;
  category_explanation: null | string;
  created_at: string;
  funding_categories: string[];
  funding_instruments: string[];
  modified_comments: null | string;
  opportunity_assistance_listings: AssistanceListing[];
  opportunity_id: number;
  opportunity_number: string;
  opportunity_title: string;
  revision_number: number;
  summary: Summary;
  updated_at: string;
}

export interface PaginationInfo {
  order_by: string;
  page_offset: number;
  page_size: number;
  sort_direction: string;
  total_pages: number;
  total_records: number;
}
export interface ApiResponse {
  data: Opportunity[];
  message: string;
  pagination_info: PaginationInfo;
  status_code: number;
  warnings: [];
}
