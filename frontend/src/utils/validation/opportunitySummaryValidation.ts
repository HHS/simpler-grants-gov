import { OpportunitySummaryCreateRequestV1Schema } from "src/validation-schemas/apiSchemas.zod";
import { OpportunitySummaryCreateRequest } from "src/types/opportunity/opportunityResponseTypes";
import { z } from "zod";

import { formDataToZodInput } from "./zodFormData";

const opportunitySummaryFormDataAdapters = {
  applicant_types: (formData: FormData) =>
    Array.from(formData.entries())
      .filter(([key]) => key.startsWith("applicant_types["))
      .map(([, value]) => value),

  funding_categories: (formData: FormData) => {
    const value = formData.get("funding_categories");
    return value ? [value] : [];
  },

  funding_instruments: (formData: FormData) => {
    const value = formData.get("funding_instruments");
    return value ? [value] : [];
  },
};

export function getOpportunitySummaryValidationData(
  formData: FormData,
  overrides: Partial<
    z.input<typeof OpportunitySummaryCreateRequestV1Schema>
  > = {},
) {
  return {
    ...formDataToZodInput(
      formData,
      OpportunitySummaryCreateRequestV1Schema,
      opportunitySummaryFormDataAdapters,
    ),
    ...overrides,
  };
}

export function toOpportunitySummaryRequest(
  data: z.output<typeof OpportunitySummaryCreateRequestV1Schema>,
): OpportunitySummaryCreateRequest {
  return {
    ...data,
    close_date: data.close_date ?? null,
    close_date_description: data.close_date_description ?? null,
    expected_number_of_awards: data.expected_number_of_awards ?? null,
    estimated_total_program_funding:
      data.estimated_total_program_funding ?? null,
    additional_info_url: data.additional_info_url ?? null,
    additional_info_url_description:
      data.additional_info_url_description ?? null,
    funding_category_description: data.funding_category_description ?? null,
    applicant_eligibility_description:
      data.applicant_eligibility_description ?? null,
  };
}
