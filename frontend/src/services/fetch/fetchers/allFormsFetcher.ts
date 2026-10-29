import { AllFormsApiResponse } from "src/types/allFormsResponseTypes";

import { fetchForms } from "./fetchers";

export const getForms = async (): Promise<AllFormsApiResponse> => {
  const response = await fetchForms();
  const responseBody = (await response.json()) as AllFormsApiResponse;
  return responseBody;
};
