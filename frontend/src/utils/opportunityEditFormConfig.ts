import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";

export type OpportunityEditFormValues = {
  opportunity_number: string;
  opportunity_title: string;
  category: string;
  category_explanation: string;
  summary_description: string;
  funding_instruments: string;
  is_cost_sharing: boolean | null;
  post_date: string;
  close_date: string;
  close_date_description: string;
  funding_categories: string;
  funding_category_description: string;
  expected_number_of_awards: string;
  estimated_total_program_funding: string;
  award_floor: string;
  award_ceiling: string;
  applicant_types: string[];
  applicant_eligibility_description: string;
  additional_info_url: string;
  additional_info_url_description: string;
  agency_contact_description: string;
  agency_email_address: string;
  agency_email_address_description: string;
};

const emptyString = (value: string | null | undefined) => value ?? "";

const numberToString = (value: number | null | undefined) =>
  value === null || value === undefined ? "" : String(value);

export const buildOpportunityEditInitialValues = (
  opportunity: OpportunityDetail,
): OpportunityEditFormValues => {
  const summary = opportunity.summary;

  return {
    opportunity_number: opportunity.opportunity_number ?? "",
    opportunity_title: emptyString(opportunity.opportunity_title),
    category: emptyString(opportunity.category),
    category_explanation: emptyString(opportunity.category_explanation),
    summary_description: emptyString(summary?.summary_description),
    funding_instruments: summary?.funding_instruments?.[0] ?? "",
    is_cost_sharing: summary?.is_cost_sharing ?? true,
    post_date: emptyString(summary?.post_date),
    close_date: emptyString(summary?.close_date),
    close_date_description: emptyString(summary?.close_date_description),
    funding_categories: summary?.funding_categories?.[0] ?? "",
    funding_category_description: emptyString(
      summary?.funding_category_description,
    ),
    expected_number_of_awards: numberToString(
      summary?.expected_number_of_awards,
    ),
    estimated_total_program_funding: numberToString(
      summary?.estimated_total_program_funding,
    ),
    award_floor: numberToString(summary?.award_floor),
    award_ceiling: numberToString(summary?.award_ceiling),
    applicant_types: summary?.applicant_types ?? [],
    applicant_eligibility_description: emptyString(
      summary?.applicant_eligibility_description,
    ),
    additional_info_url: emptyString(summary?.additional_info_url),
    additional_info_url_description: emptyString(
      summary?.additional_info_url_description,
    ),
    agency_contact_description: emptyString(
      summary?.agency_contact_description,
    ),
    agency_email_address: emptyString(summary?.agency_email_address),
    agency_email_address_description: emptyString(
      summary?.agency_email_address_description,
    ),
  };
};
