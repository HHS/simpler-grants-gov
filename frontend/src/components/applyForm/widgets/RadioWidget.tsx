"use client";

import {
  EnumOptionsType,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

import React, {
  ChangeEvent,
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

/** Normalize any incoming value to "true" | "false" | "" for DOM rendering. */
function toBoolString(v: unknown): "" | "true" | "false" {
  if (v === true || v === "true") return "true";
  if (v === false || v === "false") return "false";
  return "";
}

/** Convert an option.value to "true"/"false" (Radio enum should be boolean). */
function optionToBoolString(v: unknown): "true" | "false" {
  return v === true || v === "true" ? "true" : "false";
}

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
  onChange,
  onBlur = () => ({}),
  onFocus = () => ({}),
}: UswdsWidgetProps<T, S, F>) {
  const { title, enum: enumFromSchema, description } = schema;
  const { enumDisabled, enumOptions: uiEnumOptions } =
    (options as LocalOptions<S>) ?? {};
  const labelType = getLabelTypeFromOptions(options?.["widget-label"]);

  // Prefer enumOptions provided by utils (boolean values); fall back to schema.enum if present
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

  // Local selection
  const [picked, setPicked] = useState<"" | "true" | "false">(() =>
    toBoolString(value),
  );

  // Only sync from parent when it actually supplies a boolean string/boolean.
  // If parent transiently sends undefined during a save/remount, keep local pick.
  useEffect(() => {
    const next = toBoolString(value);
    if (next !== "") {
      setPicked(next);
    }
  }, [value]);

  const handleBlur = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) =>
      onBlur(id, target?.value === "true"),
    [onBlur, id],
  );

  const handleFocus = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) =>
      onFocus(id, target?.value === "true"),
    [onFocus, id],
  );

  // When user selects a radio, update local state and notify parent with a boolean
  const handlePick = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const nextStr = e.target.value as "true" | "false";
      setPicked(nextStr);
      if (typeof onChange === "function") {
        onChange(nextStr === "true");
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
        <ErrorMessage id={`error-for-${id}`}>
          {typeof rawErrors[0] === "string"
            ? rawErrors[0]
            : Object.values(rawErrors[0] as Record<string, string>).join(",")}
        </ErrorMessage>
      )}

      {/* Hidden input ensures a single, normalized value is always posted */}
      <input type="hidden" name={id} value={picked} />

      {Array.isArray(enumOptions) &&
        enumOptions.map((option, i) => {
          const optionStr = optionToBoolString(option.value);
          const checked = picked === optionStr;
          const itemDisabled =
            Array.isArray(enumDisabled) &&
            enumDisabled.indexOf(option.value as TextTypes) !== -1;

          return (
            <Radio
              label={option.label}
              id={`${id}-${i}`}
              key={`${id}-${i}`}
              name={id}
              disabled={disabled || itemDisabled || readonly}
              autoFocus={autofocus && i === 0}
              aria-describedby={describedby}
              checked={checked}
              value={optionStr}
              onChange={handlePick}
              onBlur={handleBlur}
              onFocus={handleFocus}
            />
          );
        })}
    </FormGroup>
  );
}

export default RadioWidget;
