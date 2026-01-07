"use server";

import { getSession } from "src/services/auth/session";
import { updateUserDetails } from "src/services/fetch/fetchers/userFetcher";
import { UserProfileResponse } from "src/types/userTypes";
import { z } from "zod";

import { getTranslations } from "next-intl/server";

const validateUserProfileAction = async (formData: FormData) => {
  const t = await getTranslations("Settings.validationErrors");
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
};

export const userProfileAction = async (
  _prevState: unknown,
  formData: FormData,
): Promise<UserProfileResponse> => {
  const session = await getSession();

  if (!session || !session.token || !session.user_id) {
    return {
      errorMessage: "Not logged in",
    };
  }

  const validationErrors = await validateUserProfileAction(formData);
  if (validationErrors) {
    return {
      validationErrors,
    };
  }

  const rawFormData = {
    first_name: formData.get("firstName") as string,
    middle_name: formData.get("middleName") as string,
    last_name: formData.get("lastName") as string,
  };

  let userDetailsUpdateResponse;
  try {
    userDetailsUpdateResponse = await updateUserDetails(
      session.token,
      session.user_id,
      rawFormData,
    );
    return { data: userDetailsUpdateResponse, success: true };
  } catch (e) {
    // General try failure catch error
    const error = e as Error;
    console.error(
      `Error updating user details - ${error.message} ${error.cause?.toString() || ""}`,
    );
    return {
      errorMessage: error.message,
    };
  }
};
