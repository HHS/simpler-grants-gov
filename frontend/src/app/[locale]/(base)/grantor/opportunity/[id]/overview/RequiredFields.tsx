// These objects define the required fields for each step
// of the opportunity publishing workflow.
import { Competition } from "src/types/competitionsResponseTypes";

export const summaryRequiredFields = {
  funding_instruments: true,
  funding_categories: true,
  post_date: true,
  applicant_types: true,
};

export const competitionRequiredFields = {
  open_to_applicants: true,
  // How does this opportunity close?
};

export const baseOpportunityRequiredFields = {
  agency_code: true,
  category: true,
  opportunity_assistance_listings: true,
  opportunity_number: true,
  opportunity_title: true,
};

export const opportunityDetailsRequiredFields = {
  ...baseOpportunityRequiredFields,
  summary: summaryRequiredFields,
};
