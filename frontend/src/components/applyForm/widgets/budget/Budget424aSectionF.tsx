/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { FormContextType, RJSFSchema, StrictRJSFSchema } from "@rjsf/utils";
import { get, set } from "lodash";

import React, { JSX } from "react";

import {
  FormValidationWarning,
  UswdsWidgetProps,
} from "src/components/applyForm/types";
import CheckboxWidget from "src/components/applyForm/widgets/CheckboxWidget";
import TextAreaWidget from "src/components/applyForm/widgets/TextAreaWidget";
import { getBudgetErrors } from "./budgetErrorLabels";
import { getStringOrUndefined, isRecord } from "./budgetValueGuards";

type RootSchemaContext = FormContextType & { rootSchema?: RJSFSchema };

function getRootSchemaFromContext(context: unknown): RJSFSchema | undefined {
  if (context && typeof context === "object" && "rootSchema" in context) {
    const candidate = (context as { rootSchema?: unknown }).rootSchema;
    return candidate && typeof candidate === "object"
      ? (candidate as RJSFSchema)
      : undefined;
  }
  return undefined;
}

function Budget424aSectionF<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  id,
  value: rawValue = {},
  rawErrors,
  formContext,
  onChange,
}: UswdsWidgetProps<T, S, F>): JSX.Element {
  const validationWarnings = (rawErrors as FormValidationWarning[]) || [];
  const rootValue = isRecord(rawValue) ? rawValue : {};
  const rootSchema = getRootSchemaFromContext(formContext as RootSchemaContext);
  const properties = rootSchema?.properties as
    | Record<
        string,
        {
          type?: unknown;
          title?: string;
          description?: string;
          minLength?: number;
          maxLength?: number;
          enum?: unknown[];
        }
      >
    | undefined;

  const directChargesSchema = properties?.direct_charges_explanation as
    | RJSFSchema
    | undefined;
  const indirectChargesSchema = properties?.indirect_charges_explanation as
    | RJSFSchema
    | undefined;
  const remarksSchema = properties?.remarks as RJSFSchema | undefined;
  const confirmationSchema = properties?.confirmation as RJSFSchema | undefined;

  const getFieldErrors = (fieldId: string) =>
    getBudgetErrors({ errors: validationWarnings, id: fieldId, section: "F" });

  const directChargesValue = getStringOrUndefined(
    rootValue,
    "direct_charges_explanation",
  );
  const indirectChargesValue = getStringOrUndefined(
    rootValue,
    "indirect_charges_explanation",
  );
  const remarksValue = getStringOrUndefined(rootValue, "remarks");

  const confirmationValue =
    (get(rootValue, "confirmation") as boolean | undefined) ?? false;

  const updateField = (path: string, next: unknown) => {
    const updated = { ...rootValue };
    set(updated, path, next);
    onChange?.(updated as T);
  };

  return (
    <div key={id} id={id} className="grid-row grid-gap">
      <div className="grid-col-12 margin-bottom-2">
        {directChargesSchema && (
          <TextAreaWidget
            schema={directChargesSchema}
            id="direct_charges_explanation"
            rawErrors={getFieldErrors("direct_charges_explanation")}
            formClassName="margin-top-1"
            inputClassName="width-full minw-30"
            value={directChargesValue}
          />
        )}
      </div>

      <div className="grid-col-12 margin-bottom-2">
        {indirectChargesSchema && (
          <TextAreaWidget
            schema={indirectChargesSchema}
            id="indirect_charges_explanation"
            rawErrors={getFieldErrors("indirect_charges_explanation")}
            formClassName="margin-top-1"
            inputClassName="width-full minw-30"
            value={indirectChargesValue}
          />
        )}
      </div>

      <div className="grid-col-12">
        {remarksSchema && (
          <TextAreaWidget
            schema={remarksSchema}
            id="remarks"
            rawErrors={getFieldErrors("remarks")}
            formClassName="margin-top-1"
            inputClassName="width-full minw-30"
            value={remarksValue}
          />
        )}
      </div>

      <div className="grid-col-12 margin-top-3">
        {confirmationSchema && (
          <CheckboxWidget
            id="confirmation"
            schema={confirmationSchema}
            rawErrors={getFieldErrors("confirmation")}
            value={confirmationValue}
            onChange={(nextValue: unknown) => {
              const next =
                nextValue === true || nextValue === "true"
                  ? true
                  : nextValue === false || nextValue === "false"
                    ? false
                    : undefined;
              updateField("confirmation", next);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default Budget424aSectionF;
