import { environment } from "src/constants/environments";
import {
  createRequestUrl,
  getDefaultHeaders,
} from "src/services/fetch/fetcherHelpers";
import { fetchApplicationWithMethod } from "src/services/fetch/fetchers/fetchers";
import {
  ApplicationAttachmentUploadResponse,
  ApplicationDetailApiResponse,
  ApplicationFormDetailApiResponse,
  ApplicationResponseDetail,
  ApplicationStartApiResponse,
  ApplicationSubmitApiResponse,
} from "src/types/applicationResponseTypes";

/**
 * Start Application
 */

export const handleStartApplication = async (
  applicationName: string,
  competitionID: string,
  token: string,
  organization?: string,
): Promise<ApplicationStartApiResponse> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };

  const response = await fetchApplicationWithMethod("POST")({
    subPath: `start`,
    additionalHeaders: ssgToken,
    body: {
      competition_id: competitionID,
      application_name: applicationName,
      organization_id: organization,
    },
  });

  return (await response.json()) as ApplicationStartApiResponse;
};

/**
 * Application Submission
 */

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
    allowedErrorStatuses: [422],
  });

  return (await response.json()) as ApplicationSubmitApiResponse;
};

/**
 * Application Details
 */

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

/**
 * Application Forms
 */

export const getApplicationFormDetails = async (
  token: string,
  applicationId: string,
  applicationFormId: string,
  internalToken = false,
): Promise<ApplicationFormDetailApiResponse> => {
  const tokenHeaderName = internalToken
    ? "X-SGG-Internal-Token"
    : "X-SGG-Token";
  const additionalHeaders: Record<string, string> = {
    [tokenHeaderName]: token,
  };

  const response = await fetchApplicationWithMethod("GET")({
    subPath: `${applicationId}/application_form/${applicationFormId}`,
    additionalHeaders,
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

export const handleUpdateApplicationFormIncludeInSubmission = async (
  applicationId: string,
  formId: string,
  is_included_in_submission: boolean,
  token: string,
): Promise<ApplicationFormDetailApiResponse> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };

  const response = await fetchApplicationWithMethod("PUT")({
    subPath: `${applicationId}/forms/${formId}/inclusion`,
    body: { is_included_in_submission },
    additionalHeaders: ssgToken,
  });

  return (await response.json()) as ApplicationFormDetailApiResponse;
};

/**
 * Attachments
 */

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
  const additionalHeaders = {
    "X-SGG-Token": token,
    Accept: "application/json",
    "Content-Type": "multipart/form-data",
  };

  // this is throwing a 422, and not sure why. Maybe an issue with content type headers?
  const response = await fetchApplicationWithMethod("POST")({
    subPath: `${applicationId}/attachments`,
    additionalHeaders,
    body: file,
  });

  return (await response.json()) as ApplicationAttachmentUploadResponse;
  // const additionalHeaders = {
  //   ...getDefaultHeaders(),
  //   ...{
  //     Accept: "application/json",
  //     "X-SGG-Token": token,
  //   },
  // };

  // const url = createRequestUrl(
  //   "POST",
  //   `${environment.API_URL}`,
  //   "alpha",
  //   "applications",
  //   `${applicationId}/attachments`,
  // );

  // const response = await fetch(url, {
  //   method: "POST",
  //   headers: additionalHeaders,
  //   body: file,
  // });

  // return (await response.json()) as ApplicationAttachmentUploadResponse;
};
