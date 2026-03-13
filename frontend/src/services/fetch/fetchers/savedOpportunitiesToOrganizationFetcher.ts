"server-only";

import { getSession } from "src/services/auth/session";
import { ApiRequestError, UnauthorizedError } from "src/errors";
import { fetchOrganizationBySavedOpportunities, fetchUserWithMethod } from "./fetchers";
// import { NextRequest, NextResponse } from "next/server";

type ApplicationAddOrganizationApiResponse = {
  message: string;
  data: {
    application_id: string;
  };
};

export const handleSavedOpportunity = async (
  type: "DELETE" | "POST",
  token: string,
  opportunityId: string,
  organizationId: string,
) => {
  const ssgToken = {
    "X-SGG-Token": token,
  };
  const subPath =
    type === "POST"
      ? `/organizations/${organizationId}/saved-opportunities`
      : `/organizations/${organizationId}/saved-opportunities/${opportunityId}`;

  const body =
    type === "POST"
      ? {
          opportunity_id: String(opportunityId),
        }
      : {};
  return fetchUserWithMethod(type)({
    subPath,
    additionalHeaders: ssgToken,
    body,
  });
};

export const addSavedOpportunityForOrganization = async (
  organizationId: string,
): Promise<ApplicationAddOrganizationApiResponse> => {
  const session = await getSession();

  if (!session || !session.token) {
   throw new UnauthorizedError("No active session");
  }

  const additionalHeaders: Record<string, string> = {
    "X-SGG-Token": session.token,
  };

  const response = await fetchOrganizationBySavedOpportunities("PUT")({
    subPath: `/organizations/${organizationId}/saved-opportunities`,
    additionalHeaders,
  });

  if (!response.ok) {
    throw new ApiRequestError(
      "Error adding organization to saved opportunity",
      "APIRequestError",
      response.status,
    );
  }

  return (await response.json()) as ApplicationAddOrganizationApiResponse;
};

export const deleteSavedOpportunityForOrganization = async (
  opportunityId: string,
  organizationId: string,
): Promise<ApplicationAddOrganizationApiResponse> => {
  const session = await getSession();

  if (!session || !session.token) {
    throw new UnauthorizedError("No active session");
  }

  const additionalHeaders: Record<string, string> = {
    "X-SGG-Token": session.token,
  };

  const response = await fetchOrganizationBySavedOpportunities("DELETE")({
    subPath: `/organizations/${organizationId}/saved-opportunities/${opportunityId}`,
    additionalHeaders,
  });

  if (!response.ok) {
    throw new ApiRequestError(
      "Error deleting organization from saved opportunity",
      "APIRequestError",
      response.status,
    );
  }

  return (await response.json()) as ApplicationAddOrganizationApiResponse;
};
