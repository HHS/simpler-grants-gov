import { APIResponse } from "src/types/apiResponseTypes";

import { FormValidationWarning } from "src/components/applyForm/types";
import { Attachment } from "./attachmentTypes";
import { Competition } from "./competitionsResponseTypes";
import { FormDetail } from "./formResponseTypes";

export interface ApplicationResponseDetail {
  [key: string]: string;
}

export enum Status {
  IN_PROGRESS = "in_progress",
  SUBMITTED = "submitted",
  ACCEPTED = "accepted",
}

export interface SamGovEntity {
  expiration_date: string;
  legal_business_name: string;
  uei: string;
  ebiz_poc_email: string;
  ebiz_poc_first_name: string;
  ebiz_poc_last_name: string;
}

export interface Organization {
  organization_id: string;
  sam_gov_entity: SamGovEntity;
}

export interface FormValidationWarnings {
  [applicationId: string]: FormValidationWarning;
}

export interface FormValidationErrors {
  form_validation_errors: FormValidationWarnings;
}

export interface ApplicationFormDetail {
  application_attachments: Attachment[];
  application_form_id: string;
  application_form_status: "not_started" | "in_progress" | "complete";
  application_id: string;
  application_response: ApplicationResponseDetail;
  form_id: string;
  form: FormDetail;
  application_name: string;
  is_required: boolean;
  is_included_in_submission?: boolean | null;
}

export interface ApplicationDetail {
  application_attachments: Array<Attachment>;
  application_forms: Array<ApplicationFormDetail>;
  application_id: string;
  application_name: string;
  application_status: string;
  competition: Competition;
  form_validation_warnings?: FormValidationWarnings;
  organization?: Organization | null;
  users: {
    email: string;
    user_id: string;
  };
}
export interface ApplicationHistoryUserData {
  user_id: string;
  first_name?: string;
  last_name?: string;
  email: string;
}

export type ApplicationActivityEvent =
  | "application_created"
  | "application_name_changed"
  | "attachment_added"
  | "attachment_deleted"
  | "attachment_updated"
  | "application_submitted"
  | "form_updated"
  | "user_added"
  | "user_updated"
  | "user_removed"
  | "organization_added"
  | "application_submit_rejected"
  | "submission_created";

export interface ApplicationHistory {
  application_audit_event: ApplicationActivityEvent;
  user: ApplicationHistoryUserData;
  target_user?: ApplicationHistoryUserData;
  target_application_form?: {
    application_form_id: string;
    competition_form_id: string;
    form_id: string;
    form_name: string;
  };
  target_attachment?: {
    application_attachment_id: string;
    file_name: string;
  };
  created_at: string;
}

export interface ApplicationAttachmentUploadResponse extends APIResponse {
  data: {
    application_attachment_id: string;
  };
}

export interface ApplicationStartApiResponse extends APIResponse {
  data: {
    application_id: string;
  };
}

export interface ApplicationSubmitResponse {
  data: object;
  errors?: FormValidationWarning[];
  internal_request_id?: string;
}

export interface ApplicationSubmitApiResponse
  extends Omit<APIResponse, "errors"> {
  data: ApplicationSubmitResponse;
}

export interface ApplicationFormDetailApiResponse
  extends Omit<APIResponse, "warnings"> {
  data: ApplicationFormDetail;
  warnings: FormValidationWarnings;
}

export interface ApplicationDetailApiResponse extends APIResponse {
  data: ApplicationDetail;
}

export interface ApplicationHistoryApiResponse extends APIResponse {
  data: ApplicationHistory[];
}
