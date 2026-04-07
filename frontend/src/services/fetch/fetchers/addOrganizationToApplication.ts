"server-only";

import { ApiRequestError } from "src/errors";
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
  const response = await fetchApplicationWithMethod("PUT")({
    subPath: `${applicationId}/organizations/${organizationId}`,
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
