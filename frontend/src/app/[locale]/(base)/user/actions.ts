"use server";

import { z } from "zod";

import { getTranslations } from "next-intl/server";

export type UserProfileValidationErrors = {
  firstName?: string[];
  lastName?: string[];
};

type UserProfileResponse = {
  validationErrors: UserProfileValidationErrors;
};

const validateUserProfileAction = async (formData: FormData) => {
  const t = await getTranslations("UserProfile.validationErrors");
  const schema = z.object({
    firstName: z.string().min(1, { message: t("firstName") }),
    lastName: z.string().min(1, { message: t("lastName") }),
  });

  const validatedFields = schema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
  });

  // Return early if the form data is invalid (server side validation!)
  if (!validatedFields.success) {
    return validatedFields.error.flatten().fieldErrors;
  }
  return {};
};

export const userProfileAction = async (
  _prevState: UserProfileResponse,
  formData: FormData,
): Promise<UserProfileResponse> => {
  console.log("Received form data to save to user profile", formData);
  const validationErrors = await validateUserProfileAction(formData);
  return {
    validationErrors,
  };
};
