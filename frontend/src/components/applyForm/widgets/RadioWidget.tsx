"use client";

import {
  enumOptionsIsSelected,
  EnumOptionsType,
  enumOptionsValueForIndex,
  FormContextType,
  optionId,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

import React, {
  FocusEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ErrorMessage, FormGroup, Radio } from "@trussworks/react-uswds";

import { TextTypes, UswdsWidgetProps } from "src/components/applyForm/types";
import { DynamicFieldLabel } from "./DynamicFieldLabel";
import { getLabelTypeFromOptions } from "./getLabelTypeFromOptions";

type LocalOptions<S extends StrictRJSFSchema> = {
  enumDisabled?: Array<string | number | boolean>;
  emptyValue?: unknown;
  enumOptions?: EnumOptionsType<S>[];
  "widget-label"?: unknown;
};

/** Normalize any incoming widget value to "true" | "false" | "" for the DOM. */
function toBoolString(v: unknown): "" | "true" | "false" {
  if (v === true || v === "true") return "true";
  if (v === false || v === "false") return "false";
  return "";
}

/** RadioWidget renders a boolean radio group and guarantees a submitted value
 * via a synchronized hidden input. It also reflects the selection immediately
 * by controlling the radio inputs locally.
 */
function RadioWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = never,
>({
  id,
  disabled,
  options = {},
  schema,
  required,
  readonly,
  value,
  autofocus = false,
  rawErrors = [],
  // parent handlers are optional; we'll invoke them if present
  onChange,
  onBlur = () => ({}),
  onFocus = () => ({}),
}: UswdsWidgetProps<T, S, F>) {
  const { title, enum: enumFromSchema, description } = schema;
  const {
    enumDisabled,
    emptyValue,
    enumOptions: uiEnumOptions,
  } = (options as LocalOptions<S>) ?? {};
  const labelType = getLabelTypeFromOptions(options?.["widget-label"]);

  // Prefer options.enumOptions (provided by our utils), else fall back to schema.enum (rare)
  const enumOptions = useMemo<EnumOptionsType<S>[]>(() => {
    if (Array.isArray(uiEnumOptions) && uiEnumOptions.length) {
      return uiEnumOptions;
    }
    const fromSchema =
      Array.isArray(enumFromSchema) && enumFromSchema.length
        ? enumFromSchema.map((v) => ({ label: String(v), value: v }))
        : [];
    return fromSchema as EnumOptionsType<S>[];
  }, [uiEnumOptions, enumFromSchema]);

  // Local selection as a string for DOM/hidden input ("true" | "false" | "")
  const [picked, setPicked] = useState<"" | "true" | "false">(
    toBoolString(value),
  );

  // Keep local state in sync if parent rehydrates/loads an initial value
  useEffect(() => {
    setPicked(toBoolString(value));
  }, [value]);

  const handleBlur = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) =>
      onBlur(
        id,
        enumOptionsValueForIndex<S>(
          target && target.value,
          enumOptions,
          emptyValue,
        ),
      ),
    [onBlur, id, enumOptions, emptyValue],
  );

  const handleFocus = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) =>
      onFocus(
        id,
        enumOptionsValueForIndex<S>(
          target && target.value,
          enumOptions,
          emptyValue,
        ),
      ),
    [onFocus, id, enumOptions, emptyValue],
  );

  // When user clicks a radio, update local state and (optionally) notify parent with a boolean
  const handlePick = useCallback(
    (next: "true" | "false") => {
      setPicked(next);
      if (typeof onChange === "function") {
        onChange(next === "true");
      }
    },
    [onChange],
  );

  const error = rawErrors.length ? true : undefined;
  const describedby = error
    ? `error-for-${id}`
    : title
      ? `label-for-${id}`
      : undefined;

  // DEBUG (safe to remove)
  if (id === "delinquent_federal_debt") {
    // eslint-disable-next-line no-console
    console.log("[RadioWidget] debt field (render)", {
      id,
      picked,
      enumOptions: enumOptions.map((o) => ({
        label: o.label,
        value: o.value,
      })),
    });
  }

  return (
    <FormGroup error={error} key={`form-group__radio--${id}`}>
      <DynamicFieldLabel
        idFor={id}
        title={title}
        required={required}
        description={description as string}
        labelType={labelType}
      />

      {error && (
        <ErrorMessage>
          {typeof rawErrors[0] === "string"
            ? rawErrors[0]
            : Object.values(rawErrors[0] as Record<string, string>)
                .map((v) => v)
                .join(",")}
        </ErrorMessage>
      )}

      {/* Hidden input ensures a single, normalized value is always posted */}
      <input type="hidden" name={id} value={picked} />

      {Array.isArray(enumOptions) &&
        enumOptions.map((option, i) => {
          // Our utils supply string values "true"/"false" for booleans
          const checked = enumOptionsIsSelected<S>(
            option.value,
            value.toString(),
          );

          const itemDisabled =
            Array.isArray(enumDisabled) &&
            enumDisabled.indexOf(option.value as TextTypes) !== -1;

          return (
            <Radio
              label={option.label}
              id={optionId(id, i)}
              name={id}
              key={optionId(id, i)}
              disabled={disabled || itemDisabled || readonly}
              autoFocus={autofocus && i === 0}
              aria-describedby={describedby}
              // Controlled radios
              checked={checked}
              value={optionValue}
              onChange={() => handlePick(optionValue)}
              onBlur={handleBlur}
              onFocus={handleFocus}
            />
          );
        })}
    </FormGroup>
  );
}

export default RadioWidget;
