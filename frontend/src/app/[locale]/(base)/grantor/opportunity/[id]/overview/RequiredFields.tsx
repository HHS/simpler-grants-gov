// These objects define the required fields for each step
// of the opportunity publishing workflow.

export const summaryRequiredFields = {
  funding_instruments: true,
  funding_categories: true,
  post_date: true,
  applicant_types: true,
};

export const baseOpportunityRequiredFields = {
  agency_code: true,
  category: true,
  opportunity_assistance_listings: true,
  opportunity_number: true,
  opportunity_title: true,
};

export const opportunityWithSummaryRequiredFields = {
  ...baseOpportunityRequiredFields,
  summary: summaryRequiredFields,
};

export const competitionRequiredFields = {
  open_to_applicants: true,
  // How does this opportunity close?
};
