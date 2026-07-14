import {
  OpportunityDetail,
  OpportunitySummaryUpdateRequest,
} from "src/types/opportunity/opportunityResponseTypes";

export type OpportunityEditFormValues = {
  // opportunityNumber: string;
  // title: string;
  // awardSelectionMethod: string;
  // awardSelectionMethodExplanation: string;
  // description: string;
  // fundingType: string;
  // costSharing: boolean | null;
  // publishDate: string;
  // closeDate: string;
  // closeDateExplanation: string;
  // fundingCategories: string;
  // fundingCategoryExplanation: string;
  // expectedNumberOfAwards: string;
  // estimatedTotalProgramFunding: string;
  // awardMinimum: string;
  // awardMaximum: string;
  // eligibleApplicants: string[];
  // additionalEligibilityInfo: string;
  // additionalInfoUrl: string;
  // additionalInfoUrlText: string;
  // grantorContactDetails: string;
  // contactEmail: string;
  // contactEmailText: string;

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
    funding_categories: getMultiValueField(formData, "funding-category-values"),
    funding_category_description: emptyToNull(
      formData.get("fundingCategoryExplanation"),
    ),
    funding_instruments: getMultiValueField(formData, "funding-type-values"),
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
