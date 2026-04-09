import { eligibilityTypes } from "src/constants/opportunity";
import {
  categoryOptions,
  fundingOptions,
} from "src/constants/searchFilterOptions";
import {
  OpportunityDetail,
  OpportunitySummaryUpdateRequest,
} from "src/types/opportunity/opportunityResponseTypes";

export type OpportunityEditFormValues = {
  opportunityNumber: string;
  title: string;
  awardSelectionMethod: string;
  awardSelectionMethodExplanation: string;
  description: string;
  fundingType: string[];
  costSharing: boolean | null;
  publishDate: string;
  closeDate: string;
  closeDateExplanation: string;
  fundingCategories: string[];
  fundingCategoryExplanation: string;
  expectedNumberOfAwards: string;
  estimatedTotalProgramFunding: string;
  awardMinimum: string;
  awardMaximum: string;
  eligibleApplicants: string[];
  additionalEligibilityInfo: string;
  additionalInfoUrl: string;
  additionalInfoUrlText: string;
  grantorContactDetails: string;
  contactEmail: string;
  contactEmailText: string;
};

export type SelectOption = {
  label: string;
  value: string;
};

export type CheckboxOption = SelectOption;

const emptyString = (value: string | null | undefined) => value ?? "";

const numberToString = (value: number | null | undefined) =>
  value === null || value === undefined ? "" : String(value);

export const ELIGIBILITY_OPTIONS: CheckboxOption[] = eligibilityTypes.map(
  ({ label, value }) => ({ label, value }),
);

export const OPPORTUNITY_CATEGORY_OPTIONS: SelectOption[] = [
  { label: "Discretionary", value: "discretionary" },
  { label: "Mandatory", value: "mandatory" },
  { label: "Continuation", value: "continuation" },
  { label: "Earmark", value: "earmark" },
  { label: "Other", value: "other" },
];

export const FUNDING_INSTRUMENT_OPTIONS: CheckboxOption[] = fundingOptions.map(
  ({ label, value }) => ({ label: label.trim(), value }),
);

export const FUNDING_CATEGORY_OPTIONS: CheckboxOption[] = categoryOptions.map(
  ({ label, value }) => ({ label, value }),
);

export const buildOpportunityEditInitialValues = (
  opportunity: OpportunityDetail,
): OpportunityEditFormValues => {
  const summary = opportunity.summary;

  return {
    opportunityNumber: opportunity.opportunity_number ?? "",
    title: emptyString(opportunity.opportunity_title),
    awardSelectionMethod: emptyString(opportunity.category),
    awardSelectionMethodExplanation: emptyString(
      opportunity.category_explanation,
    ),
    description: emptyString(summary?.summary_description),
    fundingType: summary?.funding_instruments ?? [],
    costSharing: summary?.is_cost_sharing ?? true,
    publishDate: emptyString(summary?.post_date),
    closeDate: emptyString(summary?.close_date),
    closeDateExplanation: emptyString(summary?.close_date_description),
    fundingCategories: summary?.funding_categories ?? [],
    fundingCategoryExplanation: emptyString(
      summary?.funding_category_description,
    ),
    expectedNumberOfAwards: numberToString(summary?.expected_number_of_awards),
    estimatedTotalProgramFunding: numberToString(
      summary?.estimated_total_program_funding,
    ),
    awardMinimum: numberToString(summary?.award_floor),
    awardMaximum: numberToString(summary?.award_ceiling),
    eligibleApplicants: summary?.applicant_types ?? [],
    additionalEligibilityInfo: emptyString(
      summary?.applicant_eligibility_description,
    ),
    additionalInfoUrl: emptyString(summary?.additional_info_url),
    additionalInfoUrlText: emptyString(
      summary?.additional_info_url_description,
    ),
    grantorContactDetails: emptyString(summary?.agency_contact_description),
    contactEmail: emptyString(summary?.agency_email_address),
    contactEmailText: emptyString(summary?.agency_email_address_description),
  };
};

// Private helpers for FormData → API payload mapping

function readStringFromFormData(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

function emptyToNull(value: FormDataEntryValue | null): string | null {
  const normalizedValue = readStringFromFormData(value).trim();
  return normalizedValue || null;
}

function stringToNullableNumber(
  value: FormDataEntryValue | null,
): number | null {
  const normalizedValue = readStringFromFormData(value)
    .trim()
    .replace(/,/g, "");
  if (!normalizedValue) {
    return null;
  }
  const parsedValue = Number(normalizedValue);
  return Number.isNaN(parsedValue) ? null : parsedValue;
}

function getMultiValueField(
  formData: FormData,
  fieldName: string,
  fallbackFieldName?: string,
): string[] {
  const primaryValues = formData
    .getAll(fieldName)
    .flatMap((value) =>
      typeof value === "string" && value.trim() ? [value.trim()] : [],
    );

  if (primaryValues.length > 0 || !fallbackFieldName) {
    return primaryValues;
  }

  return formData
    .getAll(fallbackFieldName)
    .flatMap((value) =>
      typeof value === "string" && value.trim() ? [value.trim()] : [],
    );
}

export function buildOpportunitySummaryUpdateRequest(
  formData: FormData,
): OpportunitySummaryUpdateRequest {
  return {
    is_cost_sharing:
      formData.get("costSharing") === null
        ? null
        : readStringFromFormData(formData.get("costSharing")) === "true",
    summary_description: emptyToNull(formData.get("description")),
    post_date: emptyToNull(formData.get("publishDate")),
    close_date: emptyToNull(formData.get("closeDate")),
    close_date_description: emptyToNull(formData.get("closeDateExplanation")),
    expected_number_of_awards: stringToNullableNumber(
      formData.get("expectedNumberOfAwards"),
    ),
    estimated_total_program_funding: stringToNullableNumber(
      formData.get("estimatedTotalProgramFunding"),
    ),
    award_floor: stringToNullableNumber(formData.get("awardMinimum")),
    award_ceiling: stringToNullableNumber(formData.get("awardMaximum")),
    additional_info_url: emptyToNull(formData.get("additionalInfoUrl")),
    additional_info_url_description: emptyToNull(
      formData.get("additionalInfoUrlText"),
    ),
    funding_categories: getMultiValueField(
      formData,
      "fundingCategories",
      "funding-category-values",
    ),
    funding_category_description: emptyToNull(
      formData.get("fundingCategoryExplanation"),
    ),
    funding_instruments: getMultiValueField(
      formData,
      "fundingType",
      "funding-type-values",
    ),
    applicant_types: getMultiValueField(
      formData,
      "eligibleApplicants",
      "eligible-applicants-values",
    ),
    applicant_eligibility_description: emptyToNull(
      formData.get("additionalEligibilityInfo"),
    ),
    agency_contact_description: emptyToNull(
      formData.get("grantorContactDetails"),
    ),
    agency_email_address: emptyToNull(formData.get("contactEmail")),
    agency_email_address_description: emptyToNull(
      formData.get("contactEmailText"),
    ),
  };
}
