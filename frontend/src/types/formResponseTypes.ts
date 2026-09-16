import { RJSFSchema } from "@rjsf/utils";
import { APIResponse } from "src/types/apiResponseTypes";
import { UiSchema } from "src/types/applyForm/types";

export type FormInstruction = {
  // created_at: RegexMatchedString<typeof iso8601Date>;
  // updated_at: RegexMatchedString<typeof iso8601Date>;
  created_at: string; // simplified these types since I'm not sure this regex thing is actually working correctly
  updated_at: string;
  download_path: string;
  file_name: string;
};

export interface FormDetail {
  form_id: string;
  form_instruction: FormInstruction;
  form_name: string;
  form_json_schema: RJSFSchema;
  form_ui_schema: UiSchema;
}

export interface FormDetailApiResponse extends APIResponse {
  data: FormDetail;
}
