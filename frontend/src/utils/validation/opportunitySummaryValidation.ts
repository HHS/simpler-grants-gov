function readStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

function parseNullableNumber(value: FormDataEntryValue | null): number | null {
  const rawValue = readStringValue(value).replace(/[$,\s]/g, "");

  if (!rawValue) {
    return null;
  }

  return Number(rawValue);
}

function parseNullableBoolean(
  value: FormDataEntryValue | null,
): boolean | null {
  const rawValue = readStringValue(value);

  if (rawValue === "true") {
    return true;
  }

  if (rawValue === "false") {
    return false;
  }

  return null;
}

function readNullableString(value: FormDataEntryValue | null): string | null {
  const rawValue = readStringValue(value);
  return rawValue || null;
}

function getApplicantTypes(formData: FormData): string[] {
  return Array.from(
    formData.keys().filter((key) => key.includes("applicant_types[")),
  ).map((key) => formData.get(key) as string);
}

export function getOpportunitySummaryValidationData(formData: FormData) {
  const fundingCategory = readStringValue(formData.get("funding_categories"));
  const fundingInstrument = readStringValue(
    formData.get("funding_instruments"),
  );

  return {
    summary_description: readNullableString(
      formData.get("summary_description"),
    ),
    is_cost_sharing: parseNullableBoolean(formData.get("is_cost_sharing")),
    post_date: readStringValue(formData.get("post_date")),
    close_date: readNullableString(formData.get("close_date")),
    close_date_description: readNullableString(
      formData.get("close_date_description"),
    ),
    expected_number_of_awards: parseNullableNumber(
      formData.get("expected_number_of_awards"),
    ),
    estimated_total_program_funding: parseNullableNumber(
      formData.get("estimated_total_program_funding"),
    ),
    award_floor: parseNullableNumber(formData.get("award_floor")),
    award_ceiling: parseNullableNumber(formData.get("award_ceiling")),
    additional_info_url: readNullableString(
      formData.get("additional_info_url"),
    ),
    additional_info_url_description: readNullableString(
      formData.get("additional_info_url_description"),
    ),
    funding_categories: fundingCategory ? [fundingCategory] : [],
    funding_category_description: readNullableString(
      formData.get("funding_category_description"),
    ),
    funding_instruments: fundingInstrument ? [fundingInstrument] : [],
    applicant_types: getApplicantTypes(formData),
    applicant_eligibility_description: readNullableString(
      formData.get("applicant_eligibility_description"),
    ),
    agency_contact_description: readNullableString(
      formData.get("agency_contact_description"),
    ),
    agency_email_address: readNullableString(
      formData.get("agency_email_address"),
    ),
    agency_email_address_description: readNullableString(
      formData.get("agency_email_address_description"),
    ),
    is_forecast: readStringValue(formData.get("is_forecast")) === "true",
  };
}
