/**
 * Opportunity metadata definitions and page-field mapping helpers.
 * Usage: import { buildPageFieldsFromDefinitions } from "tests/e2e/opportunity/fixtures/opportunity-pages-field-definitions";
 *
 * Shards in this fixture:
 * - Shard 1: shared type contracts for opportunity value keys and metadata.
 * - Shard 2: legacy-path adapter for shared page-field builder.
 * - Remaining shards: section-level metadata groups for create/edit validation and filling.
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
    DuplicateValidationMetadata;

/** Cross-field validation scenarios used by funding relationship checks. */
export type CrossFieldValidationDefinition = {
  name: string;
  fieldsToSet: Array<{
    selector: string;
    valueKey: OpportunityFieldValueKey;
    invalidValue: string;
  }>;
  expectedErrors: Array<{
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
      label: "Opportunity title",
      type: "textarea",
      valueKey: "opportunityTitle",
      required: true,
      maxLength: 255,
      characterLimitValidationMessage: "1 character over limit",
    },
    {
      label: "Grant selection method",
      type: "select",
      valueKey: "grantSelectionMethod",
      required: true,
    },
    {
      label: "Assistance listing number",
      type: "text",
      valueKey: "assistanceListingNumber",
      required: true,
      maxLength: 6,
      characterLimitValidationMessage: "1 character over limit",
    },
  ];

/** Shard 4: funding details fields used by create/edit flows. */
export const FUNDING_DETAILS_FIELD_DEFINITIONS: OpportunityPageFieldDefinition[] =
  [
    {
      label: "Funding type",
      type: "select",
      valueKey: "fundingType",
      required: true,
      requiredFieldMessage: "Select a funding type.",
    },
    {
      label: "Category",
      type: "select",
      valueKey: "category",
      required: true,
      requiredFieldMessage: "Select a funding category.",
    },
    {
      label: "Expected number of awards",
      type: "text",
      valueKey: "expectedNumberOfAwards",
      selector: "#expected-number-of-awards",
      required: false,
      // Un-comment after bug fixed
      // negativeNumberValidationMessage:
      //   "Expected number of awards must be greater than or equal to zero.",
    },
    {
      label: "Estimated total program funding",
      type: "text",
      valueKey: "estimatedTotalProgramFunding",
      selector: "#estimated-total-program-funding",
      required: false,
      negativeNumberValidationMessage:
        "Estimated total program funding must be greater than or equal to zero and less than $1,000,000,000,000,000.",
    },
    {
      label: "Award minimum",
      type: "text",
      valueKey: "awardMinimum",
      selector: "#award-minimum",
      required: false,
      negativeNumberValidationMessage:
        "Award minimum must be greater than or equal to zero and less than $1,000,000,000,000,000.",
    },
    {
      label: "Award maximum",
      type: "text",
      valueKey: "awardMaximum",
      selector: "#award-maximum",
      required: false,
      negativeNumberValidationMessage:
        "Award maximum must be greater than or equal to zero and less than $1,000,000,000,000,000.",
    },
    {
      label: "Publish date",
      type: "date",
      valueKey: "publishDate",
      required: true,
      requiredFieldMessage: "Enter a publish date.",
    },
    {
      label: "Close date",
      type: "date",
      valueKey: "closeDate",
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
          selector: "#award-minimum",
          valueKey: "awardMinimum",
          invalidValue: "100",
        },
        {
          selector: "#award-maximum",
          valueKey: "awardMaximum",
          invalidValue: "50",
        },
      ],
      expectedErrors: [
        {
          valueKey: "awardMinimum",
          message: "Award minimum cannot exceed Award maximum.",
        },
        {
          valueKey: "awardMaximum",
          message: "Award minimum cannot exceed Award maximum.",
          // message: "Award maximum cannot be less than Award minimum.", un-comment after bug fixed
        },
      ],
    },
    {
      name: "award min and max greater than total funding",
      fieldsToSet: [
        {
          selector: "#estimated-total-program-funding",
          valueKey: "estimatedTotalProgramFunding",
          invalidValue: "100",
        },
        {
          selector: "#award-minimum",
          valueKey: "awardMinimum",
          invalidValue: "200",
        },
        {
          selector: "#award-maximum",
          valueKey: "awardMaximum",
          invalidValue: "300",
        },
      ],
      expectedErrors: [
        {
          valueKey: "awardMinimum",
          message:
            "Award minimum cannot exceed the Estimated Total Program Funding.",
        },
        {
          valueKey: "awardMaximum",
          message:
            "Award maximum cannot exceed the Estimated Total Program Funding.",
        },
      ],
    },
  ];

/** Shard 6: eligibility checkbox definitions for applicant categories. */
export const ELIGIBILITY_FIELD_DEFINITIONS: OpportunityPageFieldDefinition[] = [
  {
    label: "Eligible applicants",
    type: "checkbox",
    valueKey: "eligibleApplicantsGroupRequired",
    selector: 'input[name="eligibleApplicants"]',
    selectFirstInGroup: true,
    required: true,
    requiredFieldMessage: "Select at least one eligible applicant type.",
  },
  {
    label: "Eligible applicants",
    type: "checkbox",
    valueKey: "eligibleApplicantSmallBusinesses",
    required: false,
  },
  {
    label: "Eligible applicants",
    type: "checkbox",
    valueKey: "eligibleApplicantOtherNativeAmericanTribalOrganizations",
    required: false,
  },
  {
    label: "Eligible applicants",
    type: "checkbox",
    valueKey: "eligibleApplicantIndependentSchoolDistricts",
    required: false,
  },
  {
    label: "Eligible applicants",
    type: "checkbox",
    valueKey: "eligibleApplicantIndividuals",
    required: false,
  },
  {
    label: "Eligible applicants",
    type: "checkbox",
    valueKey: "eligibleApplicantStateGovernments",
    required: false,
  },
];

/** Shard 7: optional additional-info/contact fields with length/email metadata. */
export const ADDITIONAL_INFORMATION_FIELD_DEFINITIONS: OpportunityPageFieldDefinition[] =
  [
    {
      label: "Description",
      type: "textarea",
      valueKey: "description",
      required: false,
      maxLength: 1800,
      characterLimitValidationMessage: "1 character over limit",
      exact: true,
    },
    {
      label: "Link to additional information",
      type: "text",
      valueKey: "linkToAdditionalInformation",
      required: false,
      maxLength: 250,
      characterLimitValidationMessage: "1 character over limit",
    },
    {
      label: "Link display text",
      type: "text",
      valueKey: "linkDisplayText",
      required: false,
      maxLength: 250,
      characterLimitValidationMessage: "1 character over limit",
    },
    {
      label: "Grantor contact details",
      type: "textarea",
      valueKey: "grantorContactDetails",
      required: false,
      maxLength: 1000,
      characterLimitValidationMessage: "1 character over limit",
    },
    {
      label: "Contact email",
      type: "email",
      valueKey: "contactEmail",
      required: false,
      maxLength: 130,
      characterLimitValidationMessage: "1 character over limit",
      emailValidationMessage: "Enter a valid contact email.",
    },
    {
      label: "Email display text",
      type: "text",
      valueKey: "emailDisplayText",
      required: false,
      maxLength: 108,
      characterLimitValidationMessage: "1 character over limit",
    },
  ];
