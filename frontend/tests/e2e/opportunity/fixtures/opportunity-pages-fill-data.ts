// opportunity-pages-fill-data.ts
// Builds deterministic happy-path data for Opportunity create/publish E2E coverage.
// Usage: import { buildOpportunityHappyPathFillData } from "tests/e2e/opportunity/fixtures/opportunity-pages-fill-data";

import { OpportunityFieldValueKey } from "tests/e2e/opportunity/fixtures/opportunity-pages-field-definitions";

const pad2 = (value: number) => value.toString().padStart(2, "0");

const toDateInputValue = (date: Date) => {
  return `${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}/${date.getFullYear()}`;
};

const addDays = (date: Date, daysToAdd: number) => {
  const updated = new Date(date);
  updated.setDate(updated.getDate() + daysToAdd);
  return updated;
};

const buildTimestampValue = (prefix: string, now: Date) => {
  return `${prefix}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}-${now.getFullYear()}-${pad2(now.getHours())}-${pad2(now.getMinutes())}-${pad2(now.getSeconds())}`;
};

export const buildOpportunityHappyPathFillData = (
  now: Date,
): Record<OpportunityFieldValueKey, string> => {
  return {
    opportunityNumber: buildTimestampValue("Opp", now),
    opportunityTitle: buildTimestampValue("Title", now),
    grantSelectionMethod: "Discretionary",
    assistanceListingNumber: "00.000",
    fundingType: "Grant",
    fundingType_2: "Cooperative Agreement",
    category: "Recovery Act",
    expectedNumberOfAwards: "10",
    estimatedTotalProgramFunding: "1000000",
    awardMinimum: "50000",
    awardMaximum: "100000",
    publishDate: toDateInputValue(now),
    closeDate: toDateInputValue(addDays(now, 30)),
    eligibleApplicantSmallBusinesses: "Small businesses",
    eligibleApplicantOtherNativeAmericanTribalOrganizations:
      "Other Native American tribal organizations",
    eligibleApplicantIndependentSchoolDistricts: "Independent school districts",
    eligibleApplicantIndividuals: "Individuals",
    eligibleApplicantStateGovernments: "State governments",
    description: "Additional - Test opportunity description",
    linkToAdditionalInformation: "https://www.example.com/additional-info",
    linkDisplayText: "Additional Info",
    grantorContactDetails: "Test grantor contact details",
    contactEmail: "test@example.com",
    emailDisplayText: "Contact Email",
  };
};
