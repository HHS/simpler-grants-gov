"use client";

import { RJSFSchema } from "@rjsf/utils";

import { JSX } from "react";
import { Alert } from "@trussworks/react-uswds";

import { UiSchema } from "./types";
import { buildFormTreeRecursive } from "./utils";

export default function PrintForm({
  formSchema,
  savedFormData,
  uiSchema,
}: {
  formSchema: RJSFSchema;
  savedFormData: object;
  uiSchema: UiSchema;
}) {
  let fields: JSX.Element[] = [];
  try {
    fields = buildFormTreeRecursive({
      errors: null,
      formData: savedFormData,
      schema: formSchema,
      uiSchema,
    });
  } catch (e) {
    console.error(e);
    return (
      <Alert data-testid="alert" type="error" heading="Error" headingLevel="h4">
        Error rendering form
      </Alert>
    );
  }

  return <>{fields}</>;
}
