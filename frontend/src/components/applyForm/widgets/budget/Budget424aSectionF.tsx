/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { FormContextType, RJSFSchema, StrictRJSFSchema } from "@rjsf/utils";
import { get, set } from "lodash";

import React, { JSX } from "react";

import {
  FormattedFormValidationWarning,
  FormValidationWarning,
  UswdsWidgetProps,
} from "src/components/applyForm/types";
import CheckboxWidget from "src/components/applyForm/widgets/CheckboxWidget";
import TextAreaWidget from "src/components/applyForm/widgets/TextAreaWidget";
import TextWidget from "src/components/applyForm/widgets/TextWidget";
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

type WarningsFromContext =
  | FormValidationWarning[]
  | FormattedFormValidationWarning[]
  | [];

function coerceFormValidationWarnings(
  input: WarningsFromContext,
): FormValidationWarning[] {
  return input
    .map((item): FormValidationWarning | null => {
      const candidate = item as Partial<FormValidationWarning> &
        Partial<FormattedFormValidationWarning>;
      const fieldId =
        typeof candidate.field === "string"
          ? candidate.field
          : typeof candidate.htmlField === "string"
            ? candidate.htmlField
            : null;
      const messageText =
        typeof candidate.message === "string"
          ? candidate.message
          : typeof candidate.formatted === "string"
            ? candidate.formatted
            : null;
      if (!fieldId || !messageText) return null;
      return {
        field: fieldId,
        message: messageText,
        type: "custom",
        value: "",
      };
    })
    .filter((v): v is FormValidationWarning => v !== null);
}

function Budget424aSectionF<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  id,
  value,
  rawErrors,
  formContext,
  onChange,
  disabled,
  readonly,
}: UswdsWidgetProps<T, S, F>): JSX.Element {
  const rootFormDataFromContext = (
    formContext as { rootFormData?: unknown } | undefined
  )?.rootFormData;
  const rawValue: unknown = rootFormDataFromContext ?? value ?? {};
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

  function getWarningsFromContext(context: unknown): FormValidationWarning[] {
    if (!context || typeof context !== "object") return [];
    const support = (
      context as { widgetSupport?: { validationWarnings?: unknown } }
    ).widgetSupport;
    const rawCandidate = support?.validationWarnings;
    if (!Array.isArray(rawCandidate)) return [];
    return coerceFormValidationWarnings(rawCandidate as WarningsFromContext);
  }

  const warningsFromProps = Array.isArray(rawErrors)
    ? (rawErrors as FormValidationWarning[])
    : [];
  const warningsFromContext = getWarningsFromContext(formContext);
  const validationWarnings: FormValidationWarning[] =
    warningsFromProps.length > 0 ? warningsFromProps : warningsFromContext;

  function getErrorMessagesForField(fieldId: string): string[] {
    return getBudgetErrors({
      errors: validationWarnings,
      id: fieldId,
      section: "F",
    });
  }

  const directChargesValue = getStringOrUndefined(
    rootValue,
    "direct_charges_explanation",
  );
  const indirectChargesValue = getStringOrUndefined(
    rootValue,
    "indirect_charges_explanation",
  );
  const remarksValue = getStringOrUndefined(rootValue, "remarks");
  const confirmationValue = get(rootValue, "confirmation") as
    | boolean
    | undefined;

  const updateField = (path: string, next: unknown) => {
    const updated = { ...rootValue };
    set(updated, path, next);
    onChange?.(updated as T);
  };

  return (
    <div key={id} id={id} className="grid-row grid-gap">
      <div className="grid-col-12 margin-bottom-2">
        {directChargesSchema && (
          <TextWidget
            schema={directChargesSchema}
            id="direct_charges_explanation"
            rawErrors={getErrorMessagesForField("direct_charges_explanation")}
            formClassName="margin-top-1"
            inputClassName="width-full minw-30"
            value={directChargesValue}
            disabled={disabled}
            readonly={readonly}
          />
        )}
      </div>

      <div className="grid-col-12 margin-bottom-2">
        {indirectChargesSchema && (
          <TextWidget
            schema={indirectChargesSchema}
            id="indirect_charges_explanation"
            rawErrors={getErrorMessagesForField("indirect_charges_explanation")}
            formClassName="margin-top-1"
            inputClassName="width-full minw-30"
            value={indirectChargesValue}
            disabled={disabled}
            readonly={readonly}
          />
        )}
      </div>

      <div className="grid-col-12">
        {remarksSchema && (
          <TextAreaWidget
            schema={remarksSchema}
            id="remarks"
            rawErrors={getErrorMessagesForField("remarks")}
            formClassName="margin-top-1"
            inputClassName="width-full minw-30"
            value={remarksValue}
            disabled={disabled}
            readonly={readonly}
          />
        )}
      </div>

      <div className="grid-col-12 margin-top-3">
        {confirmationSchema && (
          <CheckboxWidget
            id="confirmation"
            schema={confirmationSchema}
            rawErrors={getErrorMessagesForField("confirmation")}
            value={confirmationValue}
            disabled={disabled}
            readonly={readonly}
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
