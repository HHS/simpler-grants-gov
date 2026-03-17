"use server";

import { getSession } from "src/services/auth/session";
import { handleCreateOpportunity } from "src/services/fetch/fetchers/createOpportunityFetcher";
import { CreateOpportunityResponse } from "src/types/grantor/createOpportunityTypes";
import { z } from "zod";

const validateFormFields = async (formData: FormData) => {
  const schema = z.object({
    // This is a placeholder.
    // Future: apply any frontend field validations that
    // have not been taken care of client-side.
    // Backend validations will be displayed in the main error field.
  });

  const validatedFields = schema.safeParse({
    agencyId: formData.get("agencyId"),
    opportunityNumber: formData.get("opportunityNumber"),
    opportunityTitle: formData.get("opportunityTitle"),
    category: formData.get("category"),
    categoryExplanation: formData.get("categoryExplanation"),
  });

  // Return early if the form data is invalid (server side validation!)
  if (!validatedFields.success) {
    return validatedFields.error.flatten().fieldErrors;
  }
};

export const createOpportunityAction = async (
  _prevState: unknown,
  formData: FormData,
): Promise<CreateOpportunityResponse> => {
  const session = await getSession();

  //   console.log("DEBUG: entering createOpportunityAction");
  if (!session || !session.token || !session.user_id) {
    return {
      errorMessage: "Session timed out. Please login again.",
    };
  }

  const rawFormData = {
    agency_id: formData.get("agencyId") as string,
    opportunity_number: formData.get("opportunityNumber") as string,
    opportunity_title: formData.get("opportunityTitle") as string,
    category: formData.get("category") as string,
    category_explanation: formData.get("categoryExplanation") as string,
  };

  const validationErrors = await validateFormFields(formData);
  if (validationErrors) {
    return {
      validationErrors,
      data: rawFormData,
    };
  }

  let createOpportunityResponse;
  try {
    createOpportunityResponse = await handleCreateOpportunity(
      "POST",
      session.token,
      rawFormData,
    );
    return { data: createOpportunityResponse, success: true };
  } catch (e) {
    // TODO: parse the field validation errors

    // General try failure catch error
    const error = e as Error;
    console.error(
      `Error creating opportunity - ${error.message} ${error.cause?.toString() || ""}`,
    );
    return {
      errorMessage: error.message,
      data: rawFormData,
    };
  }
};
