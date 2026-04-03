"use server";

import { getSession } from "src/services/auth/session";
import { createOpportunity } from "src/services/fetch/fetchers/createOpportunityFetcher";
import { CreateOpportunityResponse } from "src/types/grantor/createOpportunityTypes";

// Future: Apply any field level validations before submitting to the backend.
//    These will be validations that have not been taken care of client-side.
// Backend validations will be displayed in the main error field.

export const createOpportunityAction = async (
  _prevState: unknown,
  formData: FormData,
): Promise<CreateOpportunityResponse> => {
  const session = await getSession();

  if (!session || !session.token || !session.user_id) {
    return {
      errorMessage: "Not logged in",
    };
  }

  const rawFormData = {
    agency_id: formData.get("agencyId") as string,
    opportunity_number: formData.get("opportunityNumber") as string,
    opportunity_title: formData.get("opportunityTitle") as string,
    category: formData.get("category") as string,
    category_explanation: formData.get("categoryExplanation") as string,
    assistance_listing_number: formData.get(
      "assistanceListingNumber",
    ) as string,
  };

  let createOpportunityResponse;
  try {
    createOpportunityResponse = await createOpportunity(
      session.token,
      rawFormData,
    );
    return { data: createOpportunityResponse, success: true };
  } catch (e) {
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
