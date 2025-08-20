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

interface SamGovEntity {
  expiration_date: string;
  legal_business_name: string;
  uei: string;
}

export interface Oranization {
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
  organization: Oranization;
  users: {
    email: string;
    user_id: string;
  };
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
