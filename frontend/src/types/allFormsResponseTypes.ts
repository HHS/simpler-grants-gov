import { APIResponse } from "src/types/apiResponseTypes";

export type VersionInformation = {
  legacy_form_version: string;
  major_version: number;
  minor_version: number;
};

export interface FormType {
  form_id: string;
  name: string;
  short_name: string;
  current_version: VersionInformation;
}

export interface AllFormsApiResponse extends APIResponse {
  data: FormType[];
  message: string;
  status_code: number;
}
