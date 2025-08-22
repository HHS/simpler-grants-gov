"use client";

import { RJSFSchema } from "@rjsf/utils";

import { FormFields } from "./FormFields";
import { UiSchema } from "./types";

export default function PrintForm({
  formSchema,
  savedFormData,
  uiSchema,
}: {
  formSchema: RJSFSchema;
  savedFormData: object;
  uiSchema: UiSchema;
}) {
  return (
    <FormFields
      errors={null}
      formData={savedFormData}
      schema={formSchema}
      uiSchema={uiSchema}
    />
  );
}
