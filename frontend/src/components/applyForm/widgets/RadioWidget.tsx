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
  enumOptions?: EnumOptionsType<S>[];
  "widget-label"?: unknown;
};

function isBooleanLike(v: unknown): boolean {
  return v === true || v === false || v === "true" || v === "false";
}
function str(v: unknown): string {
  return typeof v === "string" || typeof v === "number" ? String(v) : "";
}
function boolStr(v: unknown): "" | "true" | "false" {
  if (v === true || v === "true") return "true";
  if (v === false || v === "false") return "false";
  return "";
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

  // Prefer options.enumOptions if provided (from utils)
  const enumOptions = useMemo<EnumOptionsType<S>[]>(() => {
    if (Array.isArray(uiEnumOptions) && uiEnumOptions.length)
      return uiEnumOptions;
    const fromSchema =
      Array.isArray(enumFromSchema) && enumFromSchema.length
        ? enumFromSchema.map((v) => ({ label: String(v), value: v }))
        : [];
    return fromSchema as EnumOptionsType<S>[];
  }, [uiEnumOptions, enumFromSchema]);

  const booleanMode = useMemo(
    () =>
      enumOptions.length > 0 &&
      enumOptions.every((o) => isBooleanLike(o.value)),
    [enumOptions],
  );

  // Controlled selection string
  const [picked, setPicked] = useState<string>(() =>
    booleanMode ? boolStr(value) : str(value),
  );

  // Sync from parent when it provides a concrete value
  useEffect(() => {
    const next = booleanMode ? boolStr(value) : str(value);
    if (next !== "") setPicked(next);
  }, [value, booleanMode]);

  const handleBlur = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) => {
      const v = target?.value;
      onBlur(id, booleanMode ? v === "true" : (v as unknown as T));
    },
    [onBlur, id, booleanMode],
  );

  const handleFocus = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) => {
      const v = target?.value;
      onFocus(id, booleanMode ? v === "true" : (v as unknown as T));
    },
    [onFocus, id, booleanMode],
  );

  const handlePick = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const nextStr = e.target.value;
      setPicked(nextStr);
      if (typeof onChange === "function") {
        if (booleanMode) {
          onChange(nextStr === "true");
        } else {
          onChange(nextStr as unknown as T);
        }
      }
    },
    [onChange, booleanMode],
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

      {enumOptions.map((option, i) => {
        const optionStr = booleanMode
          ? boolStr(option.value)
          : str(option.value);
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
            required={required}
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
