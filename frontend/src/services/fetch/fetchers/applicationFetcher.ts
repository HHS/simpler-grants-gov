import { fetchApplicationWithMethod } from "src/services/fetch/fetchers/fetchers";
import {
  ApplicationAttachmentUploadResponse,
  ApplicationDetailApiResponse,
  ApplicationFormDetailApiResponse,
  ApplicationHistoryApiResponse,
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
    // want to allow responses with failed validations through so we can properly handle displaying validation errors
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
  try {
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
  } catch (e) {
    console.error("Error in getApplicationDetails:", e);
    // Return empty response JSON
    return {
      status_code: 500,
      message: "",
      data: {},
    } as ApplicationDetailApiResponse;
  }
};

export const getApplicationHistory = async (
  applicationId: string,
  token: string,
): Promise<ApplicationHistoryApiResponse> => {
  const ssgToken = {
    "X-SGG-Token": token,
  };
  const response = await fetchApplicationWithMethod("POST")({
    subPath: `${applicationId}/audit_history`,
    additionalHeaders: ssgToken,
    body: {
      pagination: {
        page_offset: 1,
        page_size: 5000,
        sort_order: [{ order_by: "created_at", sort_direction: "descending" }],
      },
      // The following events exist, but should not be displayed yet (See #6644 for implementation):
      // attachment_updated, submittion_created, user_updated, user_removed, organization_added
      // events are left in the array, but commented out to make the follow-up ticket easier and
      // make it clear that these events are being excluded deliberately for now
      filters: {
        application_audit_event: {
          one_of: [
            "application_created",
            "application_name_changed",
            "attachment_added",
            "attachment_deleted",
            // "attachment_updated",
            "application_submitted",
            "form_updated",
            "user_added",
            // "user_updated",
            // "user_removed",
            // "organization_added",
            "application_submit_rejected",
            // "submission_created",
          ],
        },
      },
    },
  });

  return (await response.json()) as ApplicationHistoryApiResponse;
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
  };

  const response = await fetchApplicationWithMethod("POST")({
    subPath: `${applicationId}/attachments`,
    additionalHeaders,
    body: file,
    addContentType: false,
  });

  return (await response.json()) as ApplicationAttachmentUploadResponse;
};
