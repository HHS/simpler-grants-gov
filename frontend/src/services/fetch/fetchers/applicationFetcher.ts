import { environment } from "src/constants/environments";
import { createRequestUrl } from "src/services/fetch/fetcherHelpers";
import {
  ApplicationAttachmentUploadResponse,
  ApplicationDetailApiResponse,
  ApplicationFormDetailApiResponse,
  ApplicationResponseDetail,
  ApplicationStartApiResponse,
} from "src/types/applicationResponseTypes";

import { fetchApplicationWithMethod } from "./fetchers";

export const handleStartApplication = async (
  competitionID: string,
  applicationName: string,
  token: string,
): Promise<ApplicationStartApiResponse> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };
  const response = await fetchApplicationWithMethod("POST")({
    subPath: `start`,
    additionalHeaders: ssgToken,
    body: { competition_id: competitionID, name: applicationName },
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

export const deleteAttachment = async (
  applicationId: string,
  application_attachment_id: string,
  token: string,
): Promise<ApplicationDetailApiResponse> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };
  const response = await fetchApplicationWithMethod("DELETE")({
    subPath: `${applicationId}/attachments/${application_attachment_id}`,
    additionalHeaders: ssgToken,
  });

  return (await response.json()) as ApplicationDetailApiResponse;
};

export const uploadAttachment = async (
  applicationId: string,
  token: string,
  file: FormData,
): Promise<ApplicationAttachmentUploadResponse> => {
  const url = createRequestUrl(
    "POST",
    `${environment.API_URL}`,
    "alpha",
    "applications",
    `${applicationId}/attachments`,
  );
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "X-SGG-Token": token,
    },
    body: file,
  });

  return (await response.json()) as ApplicationAttachmentUploadResponse;
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
