"use server";

import { getSession } from "src/services/auth/session";
import { createOpportunity } from "src/services/fetch/fetchers/grantorOpportunitiesFetcher";
import { CreateOpportunityResponse } from "src/types/grantor/createOpportunityTypes";
import {
  checkUserRequiredPrivileges,
  UserPrivilegeRequest,
} from "src/utils/userPrivileges";

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
    createOpportunityResponse = await createOpportunity(rawFormData);
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

export async function validateAgencyAccessAction(agencyId: string) {
  const session = await getSession();

  if (!session?.token || !session?.user_id) {
    return { error: "Session error" };
  }

  try {
    const userPrivilegeResult = await checkUserRequiredPrivileges(
      session.user_id,
      getUserPrivilegeDefinition(agencyId),
    );

    const canCreate = userPrivilegeResult.length
      ? userPrivilegeResult.reduce(
          (permissionFound, result) =>
            result.privilege === "create_opportunity" && result.authorized,
          false,
        )
      : false;

    if (canCreate) {
      return { success: true };
    }
    return {
      error: "You do not have access to create opportunities for this agency.",
    };
  } catch (e) {
    const error = e as Error;
    console.error(`Error validating agency access: ${error.message}`);
    return {
      error: "You do not have access to create opportunities for this agency.",
    };
  }
}

const getUserPrivilegeDefinition = (
  agencyId: string,
): UserPrivilegeRequest[] => {
  return [
    {
      resourceId: agencyId,
      resourceType: "agency",
      privilege: "create_opportunity",
    },
  ];
};
