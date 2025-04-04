"use server";

import { ErrorObject } from "ajv";
import { ApiRequestError, parseErrorStatus } from "src/errors";
import { getFormDetails } from "src/services/fetch/fetchers/formsFetcher";
import { FormDetail } from "src/types/formResponseTypes";

import { redirect } from "next/navigation";

import { validateFormData } from "./validate";

type applyFormResponse = {
  errorMessage: string;
  validationErrors: ErrorObject<string, Record<string, unknown>, unknown>[];
  formData: object;
  formId: string;
};

export async function submitApplyForm(
  _prevState: applyFormResponse,
  formData: FormData,
) {
  const { formId } = _prevState;
  const { validationErrors, errorMessage } = await applyFormAction(
    formData,
    formId,
  );
  if (validationErrors.length) {
    return {
      errorMessage,
      validationErrors,
      formData,
      formId,
    };
  } else {
    redirect(`/formPrototype/success`);
  }
}

export async function applyFormAction(
  formData: FormData,
  formId: string,
): Promise<applyFormResponse> {
  let formSchema = <FormDetail>{};
  try {
    const response = await getFormDetails(formId);
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
      formId,
    };
  } else {
    return {
      validationErrors: [],
      errorMessage: "",
      formData,
      formId,
    };
  }
}
