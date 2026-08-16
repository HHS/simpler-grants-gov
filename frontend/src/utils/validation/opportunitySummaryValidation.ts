import { OpportunitySummaryCreateRequestV1Schema } from "src/generated/apiSchemas.zod";

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
  overrides: Partial<OpportunitySummaryCreateRequestV1Schema> = {},
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
