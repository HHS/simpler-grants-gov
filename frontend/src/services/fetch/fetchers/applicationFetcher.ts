import {
  ApplicationAttachmentUploadResponse,
  ApplicationDetailApiResponse,
  ApplicationFormDetailApiResponse,
  ApplicationResponseDetail,
  ApplicationStartApiResponse,
  ApplicationSubmitApiResponse,
} from "src/types/applicationResponseTypes";

import { fetchApplicationWithMethod } from "./fetchers";
import { createRequestUrl } from "../fetcherHelpers";
import { environment } from "src/constants/environments";

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
    body: { application_response: values },
    additionalHeaders: ssgToken,
  });

  return (await response.json()) as ApplicationStartApiResponse;
};


export const uploadAttachment = async (
  applicationId: string,
  token: string,
  file: FormData,
): Promise<ApplicationAttachmentUploadResponse> => {
  const additionalHeaders = {
    Accept: "application/json",
    "X-SGG-Token": token,
  };

  const url = createRequestUrl(
    "POST",
    `${environment.API_URL}`,
    "alpha",
    "applications",
    `${applicationId}/attachments`,
  );

  const response = await fetch(url, {
    method: "POST",
    headers: additionalHeaders,
    body: file,
  });

  return (await response.json()) as ApplicationAttachmentUploadResponse;
};