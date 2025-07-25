import {
  ApplicationDetailApiResponse,
  ApplicationFormDetailApiResponse,
  ApplicationResponseDetail,
  ApplicationStartApiResponse,
  ApplicationSubmitApiResponse,
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

export const updateApplicationFilingName = async (
  token: string,
  data: {
    application_id: string;
    application_name: string;
  },
): Promise<ApplicationDetailApiResponse> => {
  const applicationId = data.application_id;
  const applicationName = data.application_name;
  const ssgToken = {
    "X-SGG-Token": token,
  };
  const response = await fetchApplicationWithMethod("PUT")({
    subPath: applicationId,
    additionalHeaders: ssgToken,
    body: { application_name: applicationName },
  });

  return (await response.json()) as ApplicationDetailApiResponse;
};

export const handleSubmitApplication = async (
  applicationId: string,
  token: string,
): Promise<ApplicationSubmitApiResponse> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };

  const response = await fetchApplicationWithMethod("POST")({
    subPath: `${applicationId}/submit`,
    additionalHeaders: ssgToken,
  });

  return (await response.json()) as ApplicationSubmitApiResponse;
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
    nextOptions: {
      tags: [`application-${applicationId}`, "application-details"],
    },
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
    // hardcoding is_included_in_submission for now in order to make sure validations run on save
    // for non-required forms
    // should be adjusted with https://github.com/HHS/simpler-grants-gov/issues/5580
    body: { application_response: values, is_included_in_submission: true },
    additionalHeaders: ssgToken,
  });

  return (await response.json()) as ApplicationStartApiResponse;
};
