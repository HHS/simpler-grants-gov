import { RJSFSchema } from "@rjsf/utils";
import { APIResponse } from "src/types/apiResponseTypes";

import { UiSchema } from "src/components/applyForm/types";
import { iso8601Date, RegexMatchedString } from "./generalTypes";

export type FormInstruction = {
  created_at: RegexMatchedString<typeof iso8601Date>;
  download_path: string;
  file_name: string;
  updated_at: RegexMatchedString<typeof iso8601Date>;
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
