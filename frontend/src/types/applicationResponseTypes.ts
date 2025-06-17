import { APIResponse } from "src/types/apiResponseTypes";

import { Competition } from "./competitionsResponseTypes";
import { Attachment } from "./attachmentTypes";

export interface ApplicationResponseDetail {
  [key: string]: string;
}

export interface ApplicationFormDetail {
  application_form_id: string;
  application_form_status: "not_started" | "in_progress" | "complete";
  application_id: string;
  application_response: ApplicationResponseDetail;
  form_id: string;
}

export interface ApplicationDetail {
  application_attachments: Array<Attachment>;
  application_forms: Array<ApplicationFormDetail>;
  application_id: string;
  application_name: string;
  application_status: string;
  competition: Competition;
  users: {
    email: string;
    user_id: string;
  };
}

export interface ApplicationStartApiResponse extends APIResponse {
  data: {
    application_id: string;
  };
}

export interface ApplicationFormDetailApiResponse extends APIResponse {
  data: ApplicationFormDetail;
}

export interface ApplicationDetailApiResponse extends APIResponse {
  data: ApplicationDetail;
}
