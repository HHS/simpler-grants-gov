// TEMPORARY COPY of the pending frontend/src/components/apply-form/jsonforms/JsonFormsFields.tsx,
// so the form library can render with the SGG form widgets before the JSON Forms renderer
// lands in the frontend. Only import paths are changed, plus `extraRenderers`, which lets the
// form library preview its own widgets beside the SGG ones. It also supports the live
// preview's native FieldList callback. Reconcile this delta with #12695.
import type { JsonFormsRendererRegistryEntry } from "@jsonforms/core";
import { JsonForms } from "@jsonforms/react";
import {
  JsonFormsStyleContext,
  vanillaCells,
  vanillaStyles,
} from "@jsonforms/vanilla-renderers";
import type { RJSFSchema } from "@rjsf/utils";
import type { FormattedFormValidationWarning } from "@sgg/frontend/types/applyForm/types";
import {
  getRequiredProperties,
  shapeFormData,
} from "@sgg/frontend/utils/applyForm/applyFormUtils";
import { useCallback, useMemo, useState, type FormEvent } from "react";

import type { JsonFormsUiSchema } from "./jsonFormsUiSchema";
import {
  AdapterContext,
  renderers,
  type AdapterContextValue,
} from "./renderers";
import type { RootBudgetFormContext } from "./renderFieldNode";

// USWDS classes for the few elements the vanilla fallback renderers draw.
const uswdsStyles = [
  ...vanillaStyles,
  { name: "control.input", classNames: ["usa-input"] },
  { name: "control.select", classNames: ["usa-select"] },
  { name: "control.label", classNames: ["usa-label"] },
  { name: "control.validation", classNames: ["usa-error-message"] },
];

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
  onFieldListChange,
}: {
  errors: FormattedFormValidationWarning[] | null;
  formData: object;
  schema: RJSFSchema;
  uiSchema: JsonFormsUiSchema;
  formContext?: RootBudgetFormContext;
  isFormLocked?: boolean;
  print?: boolean;
  /** Renderers to rank against the SGG ones, for widgets only the form library has. */
  extraRenderers?: JsonFormsRendererRegistryEntry[];
  /** The live preview owns parent data on every edit when this callback is supplied. */
  onFieldListChange?: (name: string, values: unknown[]) => void;
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
      onFieldListChange,
    }),
    [
      schema,
      formData,
      errors,
      uiSchema,
      formContext,
      isFormLocked,
      print,
      onFieldListChange,
    ],
  );

  const refreshRuleData = useCallback(
    (event: FormEvent<HTMLDivElement>) => {
      if (onFieldListChange) return;
      const form = event.currentTarget.closest("form");
      if (form) setRuleData(shapeFormData(new FormData(form), schema));
    },
    [schema, onFieldListChange],
  );

  return (
    <AdapterContext.Provider value={adapterContext}>
      <JsonFormsStyleContext.Provider value={{ styles: uswdsStyles }}>
        <div onInput={refreshRuleData} onChange={refreshRuleData}>
          <JsonForms
            schema={schema as object}
            uischema={uiSchema}
            data={onFieldListChange ? formData : ruleData}
            renderers={allRenderers}
            cells={vanillaCells}
            readonly={isFormLocked || print}
            validationMode="NoValidation"
          />
        </div>
      </JsonFormsStyleContext.Provider>
    </AdapterContext.Provider>
  );
};
