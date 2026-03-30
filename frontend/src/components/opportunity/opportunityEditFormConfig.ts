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

export type CheckboxOption = {
  label: string;
  value: string;
};

export type SelectOption = {
  label: string;
  value: string;
};

const emptyString = (value: string | null | undefined) => value ?? "";

const numberToString = (value: number | null | undefined) =>
  value === null || value === undefined ? "" : String(value);

export const ELIGIBILITY_OPTIONS: CheckboxOption[] = [
  {
    label: "For profit organizations other than small businesses",
    value: "for_profit_organizations_other_than_small_businesses",
  },
  { label: "Small businesses", value: "small_businesses" },
  {
    label: "Independent school districts",
    value: "independent_school_districts",
  },
  {
    label: "Private institutions of higher education",
    value: "private_institutions_of_higher_education",
  },
  {
    label: "Public and State controlled institutions of higher education",
    value: "public_and_state_institutions_of_higher_education",
  },
  {
    label: "City or township governments",
    value: "city_or_township_governments",
  },
  { label: "County governments", value: "county_governments" },
  {
    label: "Native American tribal governments (Federally recognized)",
    value: "federally_recognized_native_american_tribal_governments",
  },
  {
    label: "Public housing authorities/Indian housing authorities",
    value: "public_and_indian_housing_authorities",
  },
  {
    label: "Special district governments",
    value: "special_district_governments",
  },
  { label: "State governments", value: "state_governments" },
  {
    label:
      "Native American tribal organizations (other than Federally recognized tribal governments)",
    value: "other_native_american_tribal_organizations",
  },
  {
    label:
      "Nonprofits having a 501(c)(3) status with the IRS, other than institutions of higher education",
    value: "nonprofits_non_higher_education_with_501c3",
  },
  {
    label:
      "Nonprofits that do not have a 501(c)(3) status with the IRS, other than institutions of higher education",
    value: "nonprofits_non_higher_education_without_501c3",
  },
  { label: "Individuals", value: "individuals" },
  { label: "Others", value: "other" },
  { label: "Unrestricted", value: "unrestricted" },
];

export const OPPORTUNITY_CATEGORY_OPTIONS: SelectOption[] = [
  { label: "Discretionary", value: "discretionary" },
  { label: "Mandatory", value: "mandatory" },
  { label: "Continuation", value: "continuation" },
  { label: "Earmark", value: "earmark" },
  { label: "Other", value: "other" },
];

export const FUNDING_INSTRUMENT_OPTIONS: CheckboxOption[] = [
  { label: "Cooperative agreement", value: "cooperative_agreement" },
  { label: "Grant", value: "grant" },
  { label: "Procurement contract", value: "procurement_contract" },
  { label: "Other", value: "other" },
];

export const FUNDING_CATEGORY_OPTIONS: CheckboxOption[] = [
  { label: "Agriculture", value: "agriculture" },
  { label: "Arts", value: "arts" },
  { label: "Business and commerce", value: "business_and_commerce" },
  { label: "Community development", value: "community_development" },
  { label: "Consumer protection", value: "consumer_protection" },
  {
    label: "Disaster prevention and relief",
    value: "disaster_prevention_and_relief",
  },
  { label: "Education", value: "education" },
  {
    label: "Employment, labor, and training",
    value: "employment_labor_and_training",
  },
  { label: "Energy", value: "energy" },
  { label: "Environment", value: "environment" },
  { label: "Food and nutrition", value: "food_and_nutrition" },
  { label: "Health", value: "health" },
  { label: "Housing", value: "housing" },
  { label: "Humanities", value: "humanities" },
  {
    label: "Infrastructure investment and jobs act",
    value: "infrastructure_investment_and_jobs_act",
  },
  { label: "Information and statistics", value: "information_and_statistics" },
  {
    label: "Income security and social services",
    value: "income_security_and_social_services",
  },
  {
    label: "Law, justice, and legal services",
    value: "law_justice_and_legal_services",
  },
  { label: "Natural resources", value: "natural_resources" },
  { label: "Opportunity zone benefits", value: "opportunity_zone_benefits" },
  { label: "Regional development", value: "regional_development" },
  {
    label: "Science, technology, and other research and development",
    value: "science_technology_and_other_research_and_development",
  },
  { label: "Transportation", value: "transportation" },
  { label: "Affordable care act", value: "affordable_care_act" },
  { label: "Other", value: "other" },
];

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
    costSharing: summary?.is_cost_sharing ?? false,
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
