import { RJSFSchema } from "@rjsf/utils";
import { APIResponse } from "src/types/apiResponseTypes";
import { UiSchema } from "src/types/applyForm/types";

import { JsonFormsUiSchema } from "src/components/apply-form/jsonforms/convertUiSchema";
import { iso8601Date, RegexMatchedString } from "./generalTypes";

export type FormInstruction = {
  created_at: RegexMatchedString<typeof iso8601Date>;
  download_path: string;
  file_name: string;
  updated_at: RegexMatchedString<typeof iso8601Date>;
};

interface FormDetailFields {
  form_id: string;
  form_instruction: FormInstruction;
  form_name: string;
  form_json_schema: RJSFSchema;
}

// The UI schema's shape depends on the renderer, so checking form_renderer narrows it.
export type FormDetail = FormDetailFields &
  (
    | { form_renderer?: "sgg"; form_ui_schema: UiSchema }
    | { form_renderer: "jsonforms"; form_ui_schema: JsonFormsUiSchema }
  );

export type FormRenderer = "sgg" | "jsonforms";

export interface FormDetailApiResponse extends APIResponse {
  data: FormDetail;
}
