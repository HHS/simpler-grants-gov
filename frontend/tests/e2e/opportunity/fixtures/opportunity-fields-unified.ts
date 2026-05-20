
import { generateTodayDate, generateDateFromToday } from "../../utils/date-utils";

/**
 * Unified Opportunity field fixture
 * - Each entry defines a field's label, type, test fill data, and character limits (if any).
 * - Keeps all field-related test info in one place for maintainability and clarity.
 */

function generateOpportunityNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `Test-${year}${month}${day}-${hours}${minutes}${seconds}-opportunity`;
}

export const opportunityFields = [
  // --- Required Text Fields ---
  {
    key: "opportunityNumber",
    definition: { label: "Opportunity number*", type: "text" as const, field: "Opportunity number" },
    fill: { create: generateOpportunityNumber(), edit: undefined },
    characterLimit: { maxLength: 40, valid: "A".repeat(40), invalid: "A".repeat(41), overLimitCount: 1 },
  },
  {
    key: "opportunityTitle",
    definition: { label: "Opportunity title*", type: "text" as const, field: "Opportunity title" },
    fill: { create: `Automation test data - ${generateOpportunityNumber()}`, edit: undefined },
    characterLimit: { maxLength: 255, valid: "A".repeat(255), invalid: "A".repeat(256), overLimitCount: 1 },
  },

  // --- Dropdowns ---
  {
    key: "grantSelectionMethod",
    definition: { label: "Grant selection method*", type: "dropdown" as const, field: "Grant selection method" },
    fill: { create: "discretionary", edit: undefined },
    characterLimit: undefined,
  },
  {
    key: "fundingType",
    definition: { label: "Funding type*", type: "dropdown" as const, field: "Funding type" },
    fill: { create: "grant", edit: undefined },
    characterLimit: undefined,
  },
  {
    key: "category",
    definition: { label: "Category*", type: "dropdown" as const, field: "Category" },
    fill: { create: "recovery_act", edit: undefined },
    characterLimit: undefined,
  },

  // --- Assistance Listing ---
  {
    key: "assistanceListingNumber",
    definition: { label: "Assistance listing number*", type: "text" as const, field: "Assistance listing number" },
    fill: {
      create: "00.000",
      edit: undefined,
      invalid: "000000" // For negative test: not a real listing number
    },
    characterLimit: { maxLength: 6, valid: "0".repeat(6), invalid: "0".repeat(7), overLimitCount: 1 },
  },

  // --- Numeric/Text Fields ---
  {
    key: "expectedAwards",
    definition: { label: "Expected number of awards", type: "text" as const, field: "Expected number of awards" },

    fill: { create: "10", edit: undefined },
    characterLimit: undefined,
  },
  {
    key: "totalProgram",
    definition: { label: "Estimated total program funding", type: "text" as const, field: "Estimated total program" },
    fill: { create: "1000000", edit: undefined },
    characterLimit: undefined,
  },
  {
    key: "awardMinimum",
    definition: { label: "Award minimum", type: "text" as const, field: "Award minimum" },
    fill: { create: "50000", edit: undefined },
    characterLimit: undefined,
  },
  {
    key: "awardMaximum",
    definition: { label: "Award maximum", type: "text" as const, field: "Award maximum" },
    fill: { create: "100000", edit: undefined },
    characterLimit: undefined,
  },

  // --- Dates ---
  {
    key: "publishDate",
    definition: { label: "Publish date*", type: "text" as const, field: "Publish date" },
    fill: { create: generateTodayDate(), edit: undefined },
    characterLimit: undefined,
  },
  {
    key: "closeDate",
    definition: { selector: "#close-date", type: "text" as const, field: "Close date" },
    fill: { create: generateDateFromToday(30), edit: undefined },
    characterLimit: undefined,
  },
  {
    key: "closeDateExplanation",
    definition: { selector: "#close-date-explanation", type: "text" as const, field: "Close date explanation" },
    fill: { create: undefined, edit: undefined },
    characterLimit: undefined,
  },

  // --- Description & Links ---
  {
    key: "description",
    definition: { label: "Description", type: "text" as const, field: "Description" },
    fill: { create: "Automation test data - Additional opportunity description", edit: undefined },
    characterLimit: undefined,
  },
  {
    key: "additionalInfoLink",
    definition: { label: "Link to additional information", type: "text" as const, field: "Link to additional information" },
    fill: { create: "https://www.example.com/additional-info", edit: undefined },
    characterLimit: undefined,
  },
  {
    key: "additionalInfoText",
    definition: { label: "Link display text", type: "text" as const, field: "Link display text" },
    fill: { create: "Automation test data - Additional Info", edit: undefined },
    characterLimit: undefined,
  },

  // --- Contact Info ---
  {
    key: "grantorContact",
    definition: { label: "Grantor contact details", type: "text" as const, field: "Grantor contact details" },
    fill: { create: "Automation test data - Grantor contact details", edit: undefined },
    characterLimit: undefined,
  },
  {
    key: "contactEmail",
    definition: { label: "Contact email", type: "text" as const, field: "Contact email" },
    fill: { create: "Automationtest@example.com", edit: undefined },
    characterLimit: undefined,
  },
  {
    key: "emailDisplayText",
    definition: { label: "Email display text", type: "text" as const, field: "Email display text" },
    fill: { create: "Automation test data - Contact Email", edit: undefined },
    characterLimit: undefined,
  },

  // --- Eligible Applicants (Checkboxes) ---
  {
    key: "eligibleApplicantSmallBusinesses",
    definition: { getByText: "Small businesses", textExact: true, type: "checkbox" as const, field: "Small businesses" },
    fill: { create: true, edit: undefined },
    characterLimit: undefined,
  },
  {
    key: "eligibleApplicantOtherNativeAmericanTribal",
    definition: { getByText: "Other Native American tribal", type: "checkbox" as const, field: "Other Native American tribal" },
    fill: { create: true, edit: undefined },
    characterLimit: undefined,
  },
  {
    key: "eligibleApplicantIndependentSchoolDistricts",
    definition: { getByText: "Independent school districts", type: "checkbox" as const, field: "Independent school districts" },
    fill: { create: true, edit: undefined },
    characterLimit: undefined,
  },
  {
    key: "eligibleApplicantIndividuals",
    definition: { getByText: "Individuals", textExact: true, type: "checkbox" as const, field: "Individuals" },
    fill: { create: true, edit: undefined },
    characterLimit: undefined,
  },
  {
    key: "eligibleApplicantStateGovernments",
    definition: { getByText: "State governments", type: "checkbox" as const, field: "State governments" },
    fill: { create: true, edit: undefined },
    characterLimit: undefined,
  },
];
