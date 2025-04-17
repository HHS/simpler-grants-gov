import { FormDetailApiResponse } from "src/types/formResponseTypes";

import { fetchForm } from "./fetchers";

export const getFormDetails = async (
  id: string,
): Promise<FormDetailApiResponse> => {
  const response = await fetchForm({ subPath: id });
  const responseBody = (await response.json()) as FormDetailApiResponse;
  return responseBody;
};
