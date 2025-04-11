import { APIResponse } from "src/types/apiResponseTypes";

export interface ApplicationResponseDetail {
  [key: string]: string;
}

export interface ApplicationFormDetail {
  application_form_id: string;
  application_id: string;
  application_response: ApplicationResponseDetail;
  form_id: string;
}

export interface ApplicationDetail {
  application_forms: Array<ApplicationFormDetail>;
  application_id: string;
  competition_id: string;
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
