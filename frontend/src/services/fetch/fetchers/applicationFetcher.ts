import {
  ApplicationDetailApiResponse,
  ApplicationFormDetailApiResponse,
  ApplicationResponseDetail,
  ApplicationStartApiResponse,
} from "src/types/applicationResponseTypes";

import { fetchApplicationWithMethod } from "./fetchers";

export const handleStartApplication = async (
  applicationName: string,
  competitionID: string,
  token: string,
): Promise<ApplicationStartApiResponse> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };

  const response = await fetchApplicationWithMethod("POST")({
    subPath: `start`,
    additionalHeaders: ssgToken,
    body: { competition_id: competitionID, application_name: applicationName },
  });

  return (await response.json()) as ApplicationStartApiResponse;
};

export const getApplicationDetails = async (
  applicationId: string,
  token: string,
): Promise<ApplicationDetailApiResponse> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };
  const response = await fetchApplicationWithMethod("GET")({
    subPath: applicationId,
    additionalHeaders: ssgToken,
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
  token: string,
): Promise<ApplicationStartApiResponse> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };
  const response = await fetchApplicationWithMethod("PUT")({
    subPath: `${applicationId}/forms/${applicationFormId}`,
    body: { application_response: values },
    additionalHeaders: ssgToken,
  });

  return (await response.json()) as ApplicationStartApiResponse;
};
