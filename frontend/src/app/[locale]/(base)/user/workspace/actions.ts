"use server";

import { getSession } from "src/services/auth/session";
import { inviteUserToOrganization } from "src/services/fetch/fetchers/organizationsFetcher";
import { OrganizationInviteRecord } from "src/types/organizationTypes";
import { z } from "zod";

import { getTranslations } from "next-intl/server";

export type OrganizationInviteResponse = {
  data?: OrganizationInviteRecord;
  errorMessage?: string;
  validationErrors?: {
    email?: string[];
    role?: string[];
  };
  success?: boolean;
};

const validateInviteUserAction = async (formData: FormData) => {
  const t = await getTranslations("ManageUsers.inviteUser.validationErrors");
  const schema = z.object({
    email: z.string().min(1, { message: t("email") }),
    role: z.string().min(1, { message: t("role") }),
  });

  const validatedFields = schema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });

  // Return early if the form data is invalid (server side validation!)
  if (!validatedFields.success) {
    return validatedFields.error.flatten().fieldErrors;
  }
};

export const inviteUserAction = async (
  _prevState: unknown,
  formData: FormData,
  organizationId: string,
): Promise<OrganizationInviteResponse> => {
  const session = await getSession();

  if (!session || !session.token || !session.user_id) {
    return {
      errorMessage: "Not logged in",
    };
  }

  const validationErrors = await validateInviteUserAction(formData);
  if (validationErrors) {
    return {
      validationErrors,
    };
  }

  const requestData = {
    email: formData.get("email") as string,
    roleId: formData.get("role") as string,
    organizationId,
  };

  let inviteUserResponse: OrganizationInviteRecord;
  try {
    inviteUserResponse = await inviteUserToOrganization(
      session.token,
      requestData,
    );
    return { data: inviteUserResponse, success: true };
  } catch (e) {
    // General try failure catch error
    const error = e as Error;
    console.error(
      `Error inviting user to org - ${error.message} ${error.cause?.toString() || ""}`,
    );
    return {
      errorMessage: error.message,
    };
  }
};
