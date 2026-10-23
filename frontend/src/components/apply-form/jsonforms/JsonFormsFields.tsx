"use client";

import type { JsonFormsRendererRegistryEntry } from "@jsonforms/core";
import { JsonForms } from "@jsonforms/react";
import type { RJSFSchema } from "@rjsf/utils";
import type { FormattedFormValidationWarning } from "src/types/applyForm/types";
import {
  getRequiredProperties,
  shapeFormData,
} from "src/utils/applyForm/applyFormUtils";

import { useCallback, useMemo, useState, type FormEvent } from "react";

import type { RenderFieldNodeProps } from "src/components/apply-form/FormFields";
import type { JsonFormsUiSchema } from "./convertUiSchema";
import {
  AdapterContext,
  renderers,
  type AdapterContextValue,
} from "./renderers";

const NO_EXTRA_RENDERERS: JsonFormsRendererRegistryEntry[] = [];

/**
 * The body of a form whose UI schema is JSON Forms. Takes the same props as `FormFields`
 * and renders into the same `<form>`, so saving is unchanged: every widget still submits
 * under its own field name and the save action shapes the FormData as it always has.
 *
 * JSON Forms keeps its own copy of the data only to evaluate rules. It is refreshed from
 * the form on every input, so a field enabled by another field's answer changes as soon
 * as that answer does.
 */
export const JsonFormsFields = ({
  errors,
  formData,
  schema,
  uiSchema,
  formContext,
  isFormLocked,
  print,
  extraRenderers = NO_EXTRA_RENDERERS,
}: {
  errors: FormattedFormValidationWarning[] | null;
  formData: object;
  schema: RJSFSchema;
  uiSchema: JsonFormsUiSchema;
  formContext?: RenderFieldNodeProps["formContext"];
  isFormLocked?: boolean;
  print?: boolean;
  /** Renderers to rank against the SGG ones, for widgets only the form library has. */
  extraRenderers?: JsonFormsRendererRegistryEntry[];
}) => {
  const [ruleData, setRuleData] = useState<object>(formData);
  const allRenderers = useMemo(
    () => [...renderers, ...extraRenderers],
    [extraRenderers],
  );

  const adapterContext = useMemo<AdapterContextValue>(
    () => ({
      schema,
      formData,
      errors,
      requiredFieldPaths: getRequiredProperties(schema),
      rootUiSchema: uiSchema,
      formContext,
      isFormLocked,
      print,
    }),
    [schema, formData, errors, uiSchema, formContext, isFormLocked, print],
  );

  const refreshRuleData = useCallback(
    (event: FormEvent<HTMLDivElement>) => {
      const form = event.currentTarget.closest("form");
      if (form) setRuleData(shapeFormData(new FormData(form), schema));
    },
    [schema],
  );

  return (
    <AdapterContext.Provider value={adapterContext}>
      <div onInput={refreshRuleData} onChange={refreshRuleData}>
        <JsonForms
          schema={schema as object}
          uischema={uiSchema}
          data={ruleData}
          renderers={allRenderers}
          readonly={isFormLocked || print}
          validationMode="NoValidation"
        />
      </div>
    </AdapterContext.Provider>
  );
};
