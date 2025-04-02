import { environment } from "src/constants/environments";
import { formDetailApiResponse } from "src/types/formResponseTypes";

import { UiSchema } from "src/components/applyForm/types";
import { fetchForm } from "./fetchers";

export const getFormDetails = async (
  id: string,
): Promise<formDetailApiResponse> => {
  const response = await fetchForm({ subPath: id });
  const responseBody = (await response.json()) as formDetailApiResponse;
  return responseBody;
};

export interface FormResponse {
  form_id: string;
  form_name: string;
  form_json_schema: object;
  form_ui_schema: UiSchema;
}

// TODO: remove once we are getting the form from the API directly
export const getForm = async (formId: string): Promise<FormResponse> => {
  const res = await fetch(
    `${environment.NEXT_PUBLIC_BASE_URL}/api/forms/${formId}`,
    {
      method: "GET",
    },
  );

  if (res.ok && res.status === 200) {
    return (await res.json()) as FormResponse;
  } else {
    throw new Error(`Error posting saved search: ${res.status}`);
  }
};
