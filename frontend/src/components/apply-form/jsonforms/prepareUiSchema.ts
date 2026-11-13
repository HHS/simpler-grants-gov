import type { RJSFSchema } from "@rjsf/utils";
import { logger } from "src/services/logger/simplerLogger";
import type { UiSchema } from "src/types/applyForm/types";
import { processFormSchema } from "src/utils/applyForm/applyFormUtils";

import {
  convertJsonFormsUiSchema,
  type JsonFormsUiSchema,
} from "./convertUiSchema";

/*
  Server-side setup for a form rendered with JSON Forms, called from getFormData.
*/

/**
 * The section/field tree for a JSON Forms form, which navigation, warnings and the UI
 * schema validator read. Logs each control the tree leaves out. Throws if the form's JSON
 * schema can't be processed.
 */
export const prepareJsonFormsUiSchema = ({
  formId,
  formName,
  uiSchema,
  jsonSchema,
}: {
  formId: string;
  formName: string;
  uiSchema: JsonFormsUiSchema;
  jsonSchema: RJSFSchema;
}): UiSchema => {
  const { formSchema } = processFormSchema(jsonSchema);
  const converted = convertJsonFormsUiSchema(uiSchema, formSchema);

  for (const control of converted.unsupportedControls) {
    logger.warn(
      { formId, formName, control },
      "Form has a control that can't be rendered by any widget. It won't be shown, and no answer will be collected for it",
    );
  }
  for (const control of converted.ignoredListRules) {
    logger.warn(
      { formId, formName, control },
      "Form has a rule on a field inside a list that won't be applied. The field will always be shown and enabled",
    );
  }
  return converted.uiSchema;
};
