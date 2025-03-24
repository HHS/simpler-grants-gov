"use server";

import { isEmpty } from "lodash";

import { redirect } from "next/navigation";

type applyFormResponse = {
  validationErrors: string;
  errorMessage: string;
};

export async function submitApplyForm(_prevState: unknown, formData: FormData) {
  const { errorMessage, validationErrors } = await applyFormlAction(formData);
  if (errorMessage || !isEmpty(validationErrors)) {
    return {
      errorMessage,
      validationErrors,
    };
  }
  // Navigate to the sub confirmation page if no error returns short circuit the function
  redirect(`/formPrototype/success`);
}

export async function applyFormlAction(
  formData: FormData,
): Promise<applyFormResponse> {
  await new Promise((resolve) => setTimeout(resolve, 1));

  console.error(formData);

  return {
    errorMessage: "",
    validationErrors: "",
  };
}
