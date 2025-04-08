import { formDetailApiResponse } from "src/types/formResponseTypes";

import { fetchForm } from "./fetchers";

export const getFormDetails = async (
  id: string,
): Promise<formDetailApiResponse> => {
  const response = await fetchForm({ subPath: id });
  const responseBody = (await response.json()) as formDetailApiResponse;
  return responseBody;
};
