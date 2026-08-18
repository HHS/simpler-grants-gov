/**
 * Opportunity metadata definitions and page-field mapping helpers.
 * Usage: import { buildPageFieldsFromDefinitions } from "tests/e2e/opportunity/fixtures/opportunity-pages-field-definitions";
 *
 * Reviewer guide:
 * - This fixture is the source of truth for field selectors, value keys,
 *   and validation messages used by failure-path and happy-path tests.
 * - Prefer metadata changes here over hardcoded values in spec files.
 *
 * Tester parameter guide:
 * - Required-field gating: FUNDING_DETAILS_FIELD_DEFINITIONS + ELIGIBILITY_FIELD_DEFINITIONS.
 * - Character limits/email/contact checks: ADDITIONAL_INFORMATION_FIELD_DEFINITIONS.
 * - Numeric and cross-field rules: FUNDING_DETAILS_FIELD_DEFINITIONS + CROSS_FIELD_VALIDATION_DEFINITIONS.
 * - Shared failure-path exports:
 *   - REQUIRED_FIELD_DEFINITIONS
 *   - EDIT_FAILURE_PATH_FIELD_DEFINITIONS
 *   - EDIT_OPPORTUNITY_URL_PATTERN
 */

import { buildPageFieldsFromDefinitions as buildSharedPageFieldsFromDefinitions } from "tests/e2e/utils/common/build-page-fields-from-definitions";
import {
  type DuplicateValidationMetadata,
  type MetadataPageFieldDefinition,
  type ValidationMetadata,
} from "tests/e2e/utils/common/types";

/** Keys supported by the create-opportunity fill-data object. */
export type OpportunityFieldValueKey =
  | "opportunityNumber"
  | "opportunityTitle"
  | "tagline"
  | "purposeStatement"
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
  | "eligibleApplicantsGroupRequired"
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

/** Metadata describing how a single UI field should be filled and validated. */
export type OpportunityPageFieldDefinition =
  MetadataPageFieldDefinition<OpportunityFieldValueKey> &
    ValidationMetadata &
    // Included for create-opportunity duplicate checks; optional in edit-only flows.
    DuplicateValidationMetadata;

/** Cross-field validation scenarios used by funding relationship checks. */
export type CrossFieldValidationDefinition = {
  name: string;
  fieldsToSet: Array<{
    selector: string;
    valueKey: OpportunityFieldValueKey;
    invalidValue: string;
    expectedErrorMessage?: string;
  }>;
  expectedErrors?: Array<{
    valueKey: OpportunityFieldValueKey;
    message: string;
  }>;
};

/** Builds page-fill fields from metadata definitions and a value dictionary. */
export const buildPageFieldsFromDefinitions = (
  definitions: OpportunityPageFieldDefinition[],
  fillData: Record<OpportunityFieldValueKey, string>,
  // Preserve legacy import path while delegating to the global builder.
) => buildSharedPageFieldsFromDefinitions(definitions, fillData);

/** Shard 3: required create-opportunity fields with duplicate and max-length metadata. */
export const CREATE_OPPORTUNITY_FIELD_DEFINITIONS: OpportunityPageFieldDefinition[] =
  [
    {
      label: "Opportunity number",
      type: "text",
      valueKey: "opportunityNumber",
      required: true,
      maxLength: 40,
      characterLimitValidationMessage: "1 character over limit",
      duplicateValidationPattern:
        "Opportunity with number\\s*['\"\\u2019]?{{value}}['\"\\u2019]?\\s*already exists",
    },
    {
      label: "Assistance listing number",
      type: "text",
      valueKey: "assistanceListingNumber",
      required: true,
      maxLength: 6,
      characterLimitValidationMessage: "1 character over limit",
    },
    {
      label: "Opportunity title",
      type: "textarea",
      valueKey: "opportunityTitle",
      required: true,
      maxLength: 255,
      characterLimitValidationMessage: "1 character over limit",
    },
    {
      label: "Tagline",
      type: "textarea",
      valueKey: "tagline",
      required: true,
      maxLength: 255,
      characterLimitValidationMessage: "1 character over limit",
    },
    {
      label: "Purpose statement",
      type: "textarea",
      valueKey: "purposeStatement",
      required: true,
      maxLength: 255,
      characterLimitValidationMessage: "1 character over limit",
    },
    {
      label: "Grant selection method*",
      type: "select",
      valueKey: "grantSelectionMethod",
      required: true,
    },
  ];

/** Shard 4: funding details fields used by create/edit flows. */
export const FUNDING_DETAILS_FIELD_DEFINITIONS: OpportunityPageFieldDefinition[] =
  [
    {
      label: "Funding type",
      type: "select",
      valueKey: "fundingType",
      selector: "#funding_instruments",
      required: true,
      requiredFieldMessage: "Select a funding type.",
    },
    {
      label: "Category",
      type: "select",
      valueKey: "category",
      selector: "#funding_categories",
      required: true,
      requiredFieldMessage: "Select a funding category.",
    },
    {
      label: "Expected number of awards",
      type: "text",
      valueKey: "expectedNumberOfAwards",
      selector: "#expected_number_of_awards",
      required: false,
      negativeNumberValidationMessage:
        "Expected number of awards must be greater than or equal to zero and less than 1,000,000,000,000,000.",
    },
    {
      label: "Estimated total program funding",
      type: "text",
      valueKey: "estimatedTotalProgramFunding",
      selector: "#estimated_total_program_funding",
      required: false,
      negativeNumberValidationMessage:
        "Estimated total program funding must be greater than or equal to zero and less than $1,000,000,000,000,000.",
    },
    {
      label: "Award minimum",
      type: "text",
      valueKey: "awardMinimum",
      selector: "#award_floor",
      required: false,
      negativeNumberValidationMessage:
        "Award minimum must be greater than or equal to zero and less than $1,000,000,000,000,000.",
    },
    {
      label: "Award maximum",
      type: "text",
      valueKey: "awardMaximum",
      selector: "#award_ceiling",
      required: false,
      negativeNumberValidationMessage:
        "Award maximum must be greater than or equal to zero and less than $1,000,000,000,000,000.",
    },
    {
      label: "Publish date",
      type: "date",
      valueKey: "publishDate",
      selector: "#post_date",
      required: true,
      requiredFieldMessage: "Enter a publish date.",
    },
    {
      label: "Close date",
      type: "date",
      valueKey: "closeDate",
      selector: "#close_date",
      required: false,
    },
  ];

/** Shard 5: cross-field funding validation scenarios. */
export const CROSS_FIELD_VALIDATION_DEFINITIONS: CrossFieldValidationDefinition[] =
  [
    {
      name: "award min greater than award max",
      fieldsToSet: [
        {
          selector: "#award_floor",
          valueKey: "awardMinimum",
          invalidValue: "100",
          expectedErrorMessage: "Award minimum cannot exceed Award maximum.",
        },
        {
          selector: "#award_ceiling",
          valueKey: "awardMaximum",
          invalidValue: "50",
          expectedErrorMessage:
            "Award maximum cannot be less than Award minimum.",
        },
      ],
    },
    {
      name: "award min and max greater than total funding",
      fieldsToSet: [
        {
          selector: "#estimated_total_program_funding",
          valueKey: "estimatedTotalProgramFunding",
          invalidValue: "100",
        },
        {
          selector: "#award_floor",
          valueKey: "awardMinimum",
          invalidValue: "200",
          expectedErrorMessage:
            "Award minimum cannot exceed the Estimated Total Program Funding.",
        },
        {
          selector: "#award_ceiling",
          valueKey: "awardMaximum",
          invalidValue: "300",
          expectedErrorMessage:
            "Award maximum cannot exceed the Estimated Total Program Funding.",
        },
      ],
    },
  ];

/** Opportunity Summary edit page URL pattern (with optional query params). */
export const EDIT_OPPORTUNITY_URL_PATTERN =
  /\/grantor\/opportunity\/[0-9a-f-]{36}\/edit(?:\?.*)?$/i;

/** Shard 6: eligibility checkbox definitions for applicant categories. */
export const ELIGIBILITY_FIELD_DEFINITIONS: OpportunityPageFieldDefinition[] = [
  {
    label: "Eligible applicants",
    type: "checkbox",
    valueKey: "eligibleApplicantsGroupRequired",
    selector: '#eligibility input[type="checkbox"]',
    inlineErrorSelector: '#eligibility [role="alert"]',
    selectFirstInGroup: true,
    required: true,
    requiredFieldMessage: "Select at least one eligible applicant type.",
  },
  {
    label: "Eligible applicants",
    type: "checkbox",
    valueKey: "eligibleApplicantSmallBusinesses",
    selector: "#eligible-business-1",
    required: false,
  }
];

/** Shard 7: optional additional-info/contact fields with length/email metadata. */
export const ADDITIONAL_INFORMATION_FIELD_DEFINITIONS: OpportunityPageFieldDefinition[] =
  [
    {
      label: "Description",
      type: "textarea",
      valueKey: "description",
      selector: "#summary_description",
      required: false,
      maxWords: 500,
      characterLimitValidationMessage: "1 word over limit",
      exact: true,
    },
    {
      label: "Link to additional information",
      type: "text",
      valueKey: "linkToAdditionalInformation",
      selector: "#additional_info_url",
      required: false,
      maxLength: 250,
      characterLimitValidationMessage: "1 character over limit",
    },
    {
      label: "Link display text",
      type: "text",
      valueKey: "linkDisplayText",
      selector: "#additional_info_url_description",
      required: false,
      maxLength: 250,
      characterLimitValidationMessage: "1 character over limit",
    },
    {
      label: "Grantor contact details",
      type: "textarea",
      valueKey: "grantorContactDetails",
      selector: "#agency_contact_description",
      required: false,
      maxLength: 1000,
      characterLimitValidationMessage: "1 character over limit",
    },
    {
      label: "Contact email",
      type: "email",
      valueKey: "contactEmail",
      selector: "#agency_email_address",
      required: false,
      maxLength: 130,
      characterLimitValidationMessage: "1 character over limit",
      emailValidationMessage: "Enter a valid contact email.",
    },
    {
      label: "Email display text",
      type: "text",
      valueKey: "emailDisplayText",
      selector: "#agency_email_address_description",
      required: false,
      maxLength: 108,
      characterLimitValidationMessage: "1 character over limit",
    },
  ];

/** Required field definitions used by Opportunity Summary gating checks. */
export const REQUIRED_FIELD_DEFINITIONS: OpportunityPageFieldDefinition[] = [
  // Save/Publish gating fields come from funding + eligibility sections.
  ...FUNDING_DETAILS_FIELD_DEFINITIONS,
  ...ELIGIBILITY_FIELD_DEFINITIONS,
];

/** Combined field definitions for Opportunity Summary edit failure-path checks. */
export const EDIT_FAILURE_PATH_FIELD_DEFINITIONS: OpportunityPageFieldDefinition[] =
  [...REQUIRED_FIELD_DEFINITIONS, ...ADDITIONAL_INFORMATION_FIELD_DEFINITIONS];
