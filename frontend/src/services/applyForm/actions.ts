"use server";

import { ApiRequestError, parseErrorStatus } from "src/errors";

import { redirect } from "next/navigation";

import { getFormDetails } from "../fetch/fetchers/formFetcher";
import { validateData } from "./validate";
import { ErrorObject } from "ajv";

type applyFormResponse = {
  errorMessage: string;
  validationErrors: ErrorObject<string, Record<string, any>, unknown>[];
  formData: object
};

export async function submitApplyForm(_prevState: unknown, formData: FormData) {
  const { validationErrors, errorMessage } = await applyFormAction(formData);
  if (validationErrors.length) {
    return {
      errorMessage,
      validationErrors,
      formData
    };
  } else {
    redirect(`/formPrototype/success`);
  }
}

export async function applyFormAction(
  formData: FormData,
): Promise<applyFormResponse> {
  let formSchema = {};
  try {
    const response = await getFormDetails("test");
    formSchema = response.data;
  } catch (error) {
    if (parseErrorStatus(error as ApiRequestError) === 404) {
      throw new Error();
    }
    throw error;
  }
  const formObject = Object.fromEntries(formData.entries());

  const errors = validateData(formObject, formSchema.form_json_schema);
  if (errors) {
    return {
      validationErrors: errors,
      errorMessage: "You got issues",
      formData
    };
  } else {
    return {
      validationErrors: [],
      errorMessage: "",
      formData
    };
  }
}
