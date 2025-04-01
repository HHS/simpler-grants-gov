import { RJSFSchema } from "@rjsf/utils";
import { APIResponse } from "src/types/apiResponseTypes";

import { UiSchema } from "src/components/applyForm/types";

export interface formDetail {
  form_id: string;
  form_name: string;
  form_json_schema: RJSFSchema;
  form_ui_schema: UiSchema;
}

export interface formDetailApiResponse extends APIResponse {
  data: formDetail;
}
