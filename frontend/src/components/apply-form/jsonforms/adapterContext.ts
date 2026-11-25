"use client";

import type { RJSFSchema } from "@rjsf/utils";
import type { FormattedFormValidationWarning } from "src/types/applyForm/types";

import { createContext, useContext } from "react";

import type { RenderFieldNodeProps } from "src/components/apply-form/FormFields";
import type { JsonFormsUiSchema } from "./convertUiSchema";

/*
  Pass the props every control needs (saved values, warnings, the form context) through this
  context, since they come from the SGG form rather than JSON Forms' own state. The SGG
  adapter and each control in controls/ read it with useAdapterContext.
*/
export type AdapterContextValue = {
  schema: RJSFSchema;
  formData: object;
  errors: FormattedFormValidationWarning[] | null;
  requiredFieldPaths: string[];
  rootUiSchema: JsonFormsUiSchema;
  formContext?: RenderFieldNodeProps["formContext"];
  isFormLocked?: boolean;
  print?: boolean;
};

export const AdapterContext = createContext<AdapterContextValue | null>(null);

export const useAdapterContext = (): AdapterContextValue => {
  const value = useContext(AdapterContext);
  if (!value) {
    throw new Error("JSON Forms renderers must be used inside JsonFormsFields");
  }
  return value;
};
