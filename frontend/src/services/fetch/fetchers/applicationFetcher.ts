import { fetchApplicationWithMethod } from "src/services/fetch/fetchers/fetchers";
import { ApplicationSubmissionsRequestBody } from "src/types/application/applicationSubmissionRequestTypes";
import { ApplicationSubmission } from "src/types/application/applicationSubmissionTypes";
import {
  ApplicationAttachmentUploadResponse,
  ApplicationDetailApiResponse,
  ApplicationFormDetailApiResponse,
  ApplicationHistoryApiResponse,
  ApplicationResponseDetail,
  ApplicationStartApiResponse,
  ApplicationStatus,
  ApplicationSubmissionsApiResponse,
  ApplicationSubmitApiResponse,
} from "src/types/applicationResponseTypes";

/**
 * Start Application
 */

export const handleStartApplication = async (
  applicationName: string,
  competitionID: string,
  organization?: string,
): Promise<ApplicationStartApiResponse> => {
  const response = await fetchApplicationWithMethod("POST")({
    subPath: `start`,
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
): Promise<ApplicationSubmitApiResponse> => {
  const response = await fetchApplicationWithMethod("POST")({
    subPath: `${applicationId}/submit`,
    // want to allow responses with failed validations through so we can properly handle displaying validation errors
    allowedErrorStatuses: [422],
  });

  return (await response.json()) as ApplicationSubmitApiResponse;
};

export const getApplicationSubmissions = async (
  applicationId: string,
  body: ApplicationSubmissionsRequestBody,
): Promise<ApplicationSubmissionsApiResponse> => {
  const response = await fetchApplicationWithMethod("POST")({
    body: { ...body },
    subPath: `${applicationId}/submissions`,
  });
  return (await response.json()) as ApplicationSubmissionsApiResponse;
};

export const getLatestApplicationSubmission = async (
  applicationId: string,
  applicationStatus: ApplicationStatus,
): Promise<ApplicationSubmission | null> => {
  // Submissions are only available if the application is in the ACCEPTED status.
  if (applicationStatus !== ApplicationStatus.ACCEPTED) return null;

  // Request body to list endpoint to get latest app submission.
  const body: ApplicationSubmissionsRequestBody = {
    pagination: {
      page_offset: 1,
      page_size: 1,
      sort_order: [{ order_by: "created_at", sort_direction: "descending" }],
    },
  };

  let submissionsResponse: ApplicationSubmissionsApiResponse | null = null;
  try {
    submissionsResponse = await getApplicationSubmissions(applicationId, body);
    if (submissionsResponse.data.length !== 1) {
      console.error(
        `Expected 1 application submission but received ${submissionsResponse.data.length}`,
      );
      return null;
    }
    return submissionsResponse.data[0];
  } catch (_e) {
    console.error(
      `Error retrieving latest application submission for (${applicationId})`,
    );
  }
  return null;
};

/**
 * Application Details
 */

export const getApplicationDetails = async (
  applicationId: string,
): Promise<ApplicationDetailApiResponse> => {
  const response = await fetchApplicationWithMethod("GET")({
    subPath: applicationId,
    nextOptions: {
      tags: [`application-${applicationId}`, "application-details"],
    },
  });

  return (await response.json()) as ApplicationDetailApiResponse;
};

export const getApplicationHistory = async (
  applicationId: string,
): Promise<ApplicationHistoryApiResponse> => {
  const response = await fetchApplicationWithMethod("POST")({
    subPath: `${applicationId}/audit_history`,
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
            "user_removed",
            "organization_added",
            "application_submit_rejected",
            // "submission_created",
          ],
        },
      },
    },
  });

  return (await response.json()) as ApplicationHistoryApiResponse;
};

export const updateApplicationFilingName = async (data: {
  application_id: string;
  application_name: string;
}): Promise<ApplicationDetailApiResponse> => {
  const applicationId = data.application_id;
  const applicationName = data.application_name;
  const response = await fetchApplicationWithMethod("PUT")({
    subPath: applicationId,
    body: { application_name: applicationName },
  });

  return (await response.json()) as ApplicationDetailApiResponse;
};

/**
 * Application Forms
 */

export const getApplicationFormDetailsForPrint = async (
  internalToken: string,
  applicationId: string,
  applicationFormId: string,
): Promise<ApplicationFormDetailApiResponse> => {
  const additionalHeaders = {
    "X-SGG-Internal-Token": internalToken,
  };
  const response = await fetchApplicationWithMethod("GET")({
    subPath: `${applicationId}/application_form/${applicationFormId}`,
    additionalHeaders,
  });

  return (await response.json()) as ApplicationFormDetailApiResponse;
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

export const handleUpdateApplicationFormIncludeInSubmission = async (
  applicationId: string,
  formId: string,
  is_included_in_submission: boolean,
): Promise<ApplicationFormDetailApiResponse> => {
  const response = await fetchApplicationWithMethod("PUT")({
    subPath: `${applicationId}/forms/${formId}/inclusion`,
    body: { is_included_in_submission },
  });

  return (await response.json()) as ApplicationFormDetailApiResponse;
};

/**
 * Attachments
 */

export const deleteAttachment = async (
  applicationId: string,
  application_attachment_id: string,
): Promise<ApplicationDetailApiResponse> => {
  const response = await fetchApplicationWithMethod("DELETE")({
    subPath: `${applicationId}/attachments/${application_attachment_id}`,
  });

  return (await response.json()) as ApplicationDetailApiResponse;
};

export const uploadAttachment = async (
  applicationId: string,
  file: FormData,
): Promise<ApplicationAttachmentUploadResponse> => {
  const additionalHeaders = {
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
