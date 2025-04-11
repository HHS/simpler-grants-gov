import {
  ApplicationDetailApiResponse,
  ApplicationFormDetailApiResponse,
  ApplicationResponseDetail,
  ApplicationStartApiResponse,
} from "src/types/applicationResponseTypes";

import { fetchApplicationWithMethod } from "./fetchers";

export const handleStartApplication = async (
  competitionID: string,
): Promise<ApplicationStartApiResponse> => {
  const response = await fetchApplicationWithMethod("POST")({
    subPath: `start`,
    body: { competition_id: competitionID },
  });

  return (await response.json()) as ApplicationStartApiResponse;
};

export const getApplicationDetails = async (
  applicationId: string,
): Promise<ApplicationDetailApiResponse> => {
  const response = await fetchApplicationWithMethod("GET")({
    subPath: applicationId,
  });

  return (await response.json()) as ApplicationDetailApiResponse;
};

export const getApplicationFormDetails = async (
  applicationId: string,
  applicationFormId: string,
): Promise<ApplicationFormDetailApiResponse> => {
  const response = await fetchApplicationWithMethod("GET")({
    subPath: `${applicationId}/application_form/${applicationFormId}`,
  });

  return (await response.json()) as ApplicationFormDetailApiResponse;
};

export const handleUpdateApplicationForm = async (
  values: ApplicationResponseDetail,
  applicationId: string,
  applicationFormId: string,
): Promise<ApplicationStartApiResponse> => {
  const response = await fetchApplicationWithMethod("PUT")({
    subPath: `${applicationId}/forms/${applicationFormId}`,
    body: { application_response: values },
  });

  return (await response.json()) as ApplicationStartApiResponse;
};
