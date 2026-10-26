// TEMPORARY COPY of the pending frontend/src/components/apply-form/jsonforms/JsonFormsFields.tsx,
// so the form library can render with the SGG form widgets before the JSON Forms renderer
// lands in the frontend. Library deltas: import paths, extraRenderers and a preview
// list callback. The preview supplies current committed data for rules.
// Reconcile these behaviors when the shared frontend renderer is imported.
import type { JsonFormsRendererRegistryEntry } from "@jsonforms/core";
import { JsonForms } from "@jsonforms/react";
import {
  JsonFormsStyleContext,
  vanillaCells,
  vanillaStyles,
} from "@jsonforms/vanilla-renderers";
import type { RJSFSchema } from "@rjsf/utils";
import type { FormattedFormValidationWarning } from "@sgg/frontend/types/applyForm/types";
import { getRequiredProperties } from "@sgg/frontend/utils/applyForm/applyFormUtils";
import { useMemo } from "react";

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
 * The preview's collector owns current data. JSON Forms uses that same data for rules;
 * this local adapter does not run a second collector or keep another answer state.
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
  /** Repeating preview widgets report their current draft rows explicitly. */
  onFieldListChange?: (name: string, values: unknown[]) => void;
}) => {
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

  return (
    <AdapterContext.Provider value={adapterContext}>
      <JsonFormsStyleContext.Provider value={{ styles: uswdsStyles }}>
        <div>
          <JsonForms
            schema={schema as object}
            uischema={uiSchema}
            data={formData}
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
