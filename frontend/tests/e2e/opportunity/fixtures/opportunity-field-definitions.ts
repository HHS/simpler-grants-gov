
import { OpportunityFieldDefinition } from "tests/e2e/utils/page/opportunity-page-filling";

export const opportunityFieldDefinitions: Record<string, OpportunityFieldDefinition> = {
  opportunityNumber: { label: 'Opportunity number*', type: 'text', field: 'Opportunity number' },
  opportunityTitle: { label: 'Opportunity title*', type: 'text', field: 'Opportunity title' },
  grantSelectionMethod: { label: 'Grant selection method*', type: 'dropdown', field: 'Grant selection method' },
  assistanceListingNumber: { label: 'Assistance listing number*', type: 'text', field: 'Assistance listing number' },
  fundingType: { label: 'Funding type*', type: 'dropdown', field: 'Funding type' },
  category: { label: 'Category*', type: 'dropdown', field: 'Category' },
  expectedAwards: { label: 'Expected number of awards', type: 'text', field: 'Expected number of awards' },
  totalProgram: { label: 'Estimated total program funding', type: 'text', field: 'Estimated total program' },
  awardMinimum: { label: 'Award minimum', type: 'text', field: 'Award minimum' },
  awardMaximum: { label: 'Award maximum', type: 'text', field: 'Award maximum' },
  publishDate: { label: 'Publish date*', type: 'text', field: 'Publish date' },
  closeDate: { selector: '#close-date', type: 'text', field: 'Close date' },
  closeDateExplanation: { selector: '#close-date-explanation', type: 'text', field: 'Close date explanation' },
  description: { label: 'Description', type: 'text', field: 'Description' },
  additionalInfoLink: { label: 'Link to additional information', type: 'text', field: 'Link to additional information' },
  additionalInfoText: { label: 'Link display text', type: 'text', field: 'Link display text' },
  grantorContact: { label: 'Grantor contact details', type: 'text', field: 'Grantor contact details' },
  contactEmail: { label: 'Contact email', type: 'text', field: 'Contact email' },
  emailDisplayText: { label: 'Email display text', type: 'text', field: 'Email display text' },
  eligibleApplicantSmallBusinesses: { getByText: 'Small businesses', textExact: true, type: 'checkbox', field: 'Small businesses' },
  eligibleApplicantOtherNativeAmericanTribal: { getByText: 'Other Native American tribal', type: 'checkbox', field: 'Other Native American tribal' },
  eligibleApplicantIndependentSchoolDistricts: { getByText: 'Independent school districts', type: 'checkbox', field: 'Independent school districts' },
  eligibleApplicantIndividuals: { getByText: 'Individuals', textExact: true, type: 'checkbox', field: 'Individuals' },
  eligibleApplicantStateGovernments: { getByText: 'State governments', type: 'checkbox', field: 'State governments' },
};