/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { FormContextType, RJSFSchema, StrictRJSFSchema } from "@rjsf/utils";
import { get, set } from "lodash";

import React, { JSX } from "react";

import {
  FormValidationWarning,
  UswdsWidgetProps,
} from "src/components/applyForm/types";
import RadioWidget from "src/components/applyForm/widgets/RadioWidget";
import TextAreaWidget from "src/components/applyForm/widgets/TextAreaWidget";
import CheckboxWidget from "../CheckboxWidget";
import { getBudgetErrors } from "./budgetErrorLabels";
import { isRecord } from "./budgetValueGuards";

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

  // Pull the full (processed) schema that utils passed through formContext
  const rootSchema = (formContext?.rootSchema ?? undefined) as
    | RJSFSchema
    | undefined;
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

  const directChargesValue = get(rootValue, "direct_charges_explanation") as
    | string
    | undefined;
  const indirectChargesValue = get(
    rootValue,
    "indirect_charges_explanation",
  ) as string | undefined;
  const remarksValue = get(rootValue, "remarks") as string | undefined;

  const confirmationValueRaw = get(rootValue, "confirmation") as
    | boolean
    | undefined;
  const confirmationValue = confirmationValueRaw ?? false;

  const updateField = (path: string, next: unknown) => {
    const updated = { ...(rootValue as Record<string, unknown>) };
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
              const nextConfirmationValue =
                nextValue === true || nextValue === "true";
              updateField("confirmation", nextConfirmationValue);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default Budget424aSectionF;
