"server-only";

import { ApiRequestError, UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { fetchApplicationWithMethod } from "src/services/fetch/fetchers/fetchers";

type ApplicationAddOrganizationApiResponse = {
  message: string;
  data: {
    application_id: string;
  };
};

export const addOrganizationToApplication = async ({
  applicationId,
  organizationId,
}: {
  applicationId: string;
  organizationId: string;
}): Promise<ApplicationAddOrganizationApiResponse> => {
  const session = await getSession();

  if (!session || !session.token) {
    throw new UnauthorizedError("No active session");
  }

  const additionalHeaders: Record<string, string> = {
    "X-SGG-Token": session.token,
  };

  const response = await fetchApplicationWithMethod("PUT")({
    subPath: `${applicationId}/organizations/${organizationId}`,
    additionalHeaders,
  });

  if (!response.ok) {
    throw new ApiRequestError(
      "Error adding organization to application",
      "APIRequestError",
      response.status,
    );
  }

  return (await response.json()) as ApplicationAddOrganizationApiResponse;
};
