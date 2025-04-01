"use server";

import { ErrorObject } from "ajv";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import { getFormDetails } from "src/services/fetch/fetchers/formFetcher";
import { formDetail } from "src/types/formResponseTypes";

import { redirect } from "next/navigation";

import { validateFormData } from "./validate";

type applyFormResponse = {
  errorMessage: string;
  validationErrors: ErrorObject<string, Record<string, unknown>, unknown>[];
  formData: object;
};

export async function submitApplyForm(_prevState: unknown, formData: FormData) {
  const { validationErrors, errorMessage } = await applyFormAction(formData);
  if (validationErrors.length) {
    return {
      errorMessage,
      validationErrors,
      formData,
    };
  } else {
    redirect(`/formPrototype/success`);
  }
}

export async function applyFormAction(
  formData: FormData,
): Promise<applyFormResponse> {
  let formSchema = <formDetail>{};
  try {
    const response = await getFormDetails("test");
    formSchema = response.data;
  } catch (error) {
    if (parseErrorStatus(error as ApiRequestError) === 404) {
      throw new Error();
    }
    throw error;
  }

  const errors = validateFormData(formData, formSchema.form_json_schema);
  if (errors) {
    return {
      validationErrors: errors,
      errorMessage: "Error submitting form",
      formData,
    };
  } else {
    return {
      validationErrors: [],
      errorMessage: "",
      formData,
    };
  }
}
