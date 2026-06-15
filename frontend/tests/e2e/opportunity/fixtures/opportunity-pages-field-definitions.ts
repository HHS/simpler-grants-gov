// opportunity-pages-field-definitions.ts
// Opportunity field definitions and page-field mapping for happy-path filling.
// Usage: import { buildPageFieldsFromDefinitions } from "tests/e2e/opportunity/fixtures/opportunity-pages-field-definitions";

import { type FieldType } from "tests/e2e/utils/common/types";
import { type PageFillField } from "tests/e2e/utils/pages/general-pages-filling";

export type OpportunityFieldValueKey =
  | "opportunityNumber"
  | "opportunityTitle"
  | "grantSelectionMethod"
  | "assistanceListingNumber"
  | "fundingType"
  | "fundingType_2"
  | "category"
  | "expectedNumberOfAwards"
  | "estimatedTotalProgramFunding"
  | "awardMinimum"
  | "awardMaximum"
  | "publishDate"
  | "closeDate"
  | "eligibleApplicantSmallBusinesses"
  | "eligibleApplicantOtherNativeAmericanTribalOrganizations"
  | "eligibleApplicantIndependentSchoolDistricts"
  | "eligibleApplicantIndividuals"
  | "eligibleApplicantStateGovernments"
  | "description"
  | "linkToAdditionalInformation"
  | "linkDisplayText"
  | "grantorContactDetails"
  | "contactEmail"
  | "emailDisplayText";

export type OpportunityPageFieldDefinition = {
  label: string;
  type: FieldType;
  valueKey: OpportunityFieldValueKey;
  exact?: boolean;
};

export const buildPageFieldsFromDefinitions = (
  definitions: OpportunityPageFieldDefinition[],
  fillData: Record<OpportunityFieldValueKey, string>,
): PageFillField[] => {
  return definitions.map((definition) => ({
    field: definition.label,
    type: definition.type,
    value: fillData[definition.valueKey],
    label: definition.label,
    labelExact: definition.exact,
  }));
};

export const CREATE_OPPORTUNITY_FIELD_DEFINITIONS: OpportunityPageFieldDefinition[] =
  [
    {
      label: "Opportunity number",
      type: "text",
      valueKey: "opportunityNumber",
    },
    { label: "Opportunity title", type: "text", valueKey: "opportunityTitle" },
    {
      label: "Grant selection method",
      type: "select",
      valueKey: "grantSelectionMethod",
    },
    {
      label: "Assistance listing number",
      type: "text",
      valueKey: "assistanceListingNumber",
    },
  ];

export const FUNDING_DETAILS_FIELD_DEFINITIONS: OpportunityPageFieldDefinition[] =
  [
    { label: "Funding type", type: "select", valueKey: "fundingType" },
    { label: "Category", type: "select", valueKey: "category" },
    {
      label: "Expected number of awards",
      type: "text",
      valueKey: "expectedNumberOfAwards",
    },
    {
      label: "Estimated total program funding",
      type: "text",
      valueKey: "estimatedTotalProgramFunding",
    },
    { label: "Award minimum", type: "text", valueKey: "awardMinimum" },
    { label: "Award maximum", type: "text", valueKey: "awardMaximum" },
    { label: "Publish date", type: "date", valueKey: "publishDate" },
    { label: "Close date", type: "date", valueKey: "closeDate" },
  ];

export const ELIGIBILITY_FIELD_DEFINITIONS: OpportunityPageFieldDefinition[] = [
  {
    label: "Eligible applicants",
    type: "checkbox",
    valueKey: "eligibleApplicantSmallBusinesses",
  },
  {
    label: "Eligible applicants",
    type: "checkbox",
    valueKey: "eligibleApplicantOtherNativeAmericanTribalOrganizations",
  },
  {
    label: "Eligible applicants",
    type: "checkbox",
    valueKey: "eligibleApplicantIndependentSchoolDistricts",
  },
  {
    label: "Eligible applicants",
    type: "checkbox",
    valueKey: "eligibleApplicantIndividuals",
  },
  {
    label: "Eligible applicants",
    type: "checkbox",
    valueKey: "eligibleApplicantStateGovernments",
  },
];

export const ADDITIONAL_INFORMATION_FIELD_DEFINITIONS: OpportunityPageFieldDefinition[] =
  [
    {
      label: "Description",
      type: "textarea",
      valueKey: "description",
      exact: true,
    },
    {
      label: "Link to additional information",
      type: "text",
      valueKey: "linkToAdditionalInformation",
    },
    { label: "Link display text", type: "text", valueKey: "linkDisplayText" },
    {
      label: "Grantor contact details",
      type: "textarea",
      valueKey: "grantorContactDetails",
    },
    { label: "Contact email", type: "email", valueKey: "contactEmail" },
    { label: "Email display text", type: "text", valueKey: "emailDisplayText" },
  ];
