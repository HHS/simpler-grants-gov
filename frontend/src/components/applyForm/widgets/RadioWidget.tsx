"use client";

import {
  enumOptionsIsSelected,
  enumOptionsValueForIndex,
  FormContextType,
  optionId,
  RJSFSchema,
  StrictRJSFSchema,
  EnumOptionsType,
} from "@rjsf/utils";
import React, { FocusEvent, useCallback, useMemo } from "react";
import { ErrorMessage, FormGroup, Radio } from "@trussworks/react-uswds";

import { TextTypes, UswdsWidgetProps } from "src/components/applyForm/types";
import { DynamicFieldLabel } from "./DynamicFieldLabel";
import { getLabelTypeFromOptions } from "./getLabelTypeFromOptions";

/**
 * The portion of `options` we care about here, with safe typing.
 * we shape our data since RJSF’s options are loosely typed.
 */
type LocalOptions<S extends StrictRJSFSchema> = {
  enumDisabled?: Array<string | number | boolean>;
  emptyValue?: unknown;
  enumOptions?: EnumOptionsType<S>[];
  "widget-label"?: unknown;
};

/**
 * normalizeForCompare
 * 
 * Given an option’s value and the current field value, we force the current value type
 * so it compares correctly with the option's representation.
 */
function normalizeForCompare(optionValue: unknown, current: unknown): unknown {
  const optionIsBoolString = optionValue === "true" || optionValue === "false";
  if (optionIsBoolString) {
    if (current === true) return "true";
    if (current === false) return "false";
    if (current === "true" || current === "false") return current;
    return undefined;
  }

  return current;
}

/**
 * parseFromInputValue
 * 
 * Convert an HTML input value (always a string) to the type we want to emit
 * in events (`onChange`, `onBlur`, `onFocus`).
 *
 * If this radio group represents a boolean (options include "true"/"false"),
 * return a *boolean* true/false.
 * Otherwise, return the raw string value.
 */
function parseFromInputValue<S extends StrictRJSFSchema>(
  raw: string,
  enumOptions: ReadonlyArray<EnumOptionsType<S>>,
): boolean | string {
  const usesBoolStrings = enumOptions.some(
    (option) => option.value === "true" || option.value === "false",
  );
  return usesBoolStrings ? raw === "true" : raw;
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
  updateOnInput = false,
  onChange = () => ({}),
  onBlur = () => ({}),
  onFocus = () => ({}),
}: UswdsWidgetProps<T, S, F>) {
  const { title, enum: enumFromSchema, description } = schema;

  // Extract and safely type the options we use
  const { enumDisabled, emptyValue, enumOptions: uiEnumOptions } =
    (options as LocalOptions<S>) ?? {};

  const labelType = getLabelTypeFromOptions(options?.["widget-label"]);

  /**
   * Determine our list of options
   */
  const enumOptions: EnumOptionsType<S>[] = useMemo(() => {
    if (Array.isArray(uiEnumOptions) && uiEnumOptions.length) {
      return uiEnumOptions;
    }
    const fromSchema =
      Array.isArray(enumFromSchema) && enumFromSchema.length
        ? enumFromSchema.map((v) => ({ label: String(v), value: v }))
        : [];
    return fromSchema as EnumOptionsType<S>[];
  }, [uiEnumOptions, enumFromSchema]);

  /**
   * Event helpers: 
   * 
   * convert the input string to a value 
   * before passing to RJSF handlers.
   */
  const handleBlur = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) => {
      const next = enumOptionsValueForIndex<S>(
        target?.value,
        enumOptions,
        emptyValue,
      );
      const coerced =
        typeof next === "undefined"
          ? (parseFromInputValue(String(target?.value ?? ""), enumOptions) as T)
          : (next as T);
      onBlur(id, coerced);
    },
    [onBlur, id, enumOptions, emptyValue],
  );

  const handleFocus = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) => {
      const next = enumOptionsValueForIndex<S>(
        target?.value,
        enumOptions,
        emptyValue,
      );
      const coerced =
        typeof next === "undefined"
          ? (parseFromInputValue(String(target?.value ?? ""), enumOptions) as T)
          : (next as T);
      onFocus(id, coerced);
    },
    [onFocus, id, enumOptions, emptyValue],
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
        <ErrorMessage>
          {typeof rawErrors[0] === "string"
            ? rawErrors[0]
            : Object.values(rawErrors[0] as Record<string, string>).join(",")}
        </ErrorMessage>
      )}

      {enumOptions.map((option, index) => {
        // Normalize the current value so 
        // it can match "true"/"false" string options
        const currentForCompare = normalizeForCompare(option.value, value);

        // Compute checked using RJSF helper 
        // works for both strings and numbers
        const checked = enumOptionsIsSelected<S>(option.value, currentForCompare);

        const itemDisabled =
          Array.isArray(enumDisabled) &&
          enumDisabled.indexOf(option.value as TextTypes) !== -1;

        const handleChange = () => {
          const raw = String(option.value);
          const toEmit = parseFromInputValue<S>(raw, enumOptions) as T;
          onChange(toEmit);
        };

        return (
          <Radio
            label={option.label}
            id={optionId(id, index)}
            key={optionId(id, index)}
            name={id}
            required={required}
            disabled={disabled || itemDisabled || readonly}
            autoFocus={autofocus && index === 0}
            aria-describedby={describedby}
            checked={updateOnInput ? checked : undefined}
            defaultChecked={updateOnInput ? undefined : checked}
            /**
             * Value handling:
             * 
             * Radios always submit a string value. We turn that string into a boolean (for
             * "true"/"false") in our event handlers so the form data remains typed correctly.
             */
            value={updateOnInput ? String(option.value) : undefined}
            defaultValue={updateOnInput ? undefined : String(option.value)}
            onChange={updateOnInput ? handleChange : undefined}
            onBlur={updateOnInput ? handleBlur : undefined}
            onFocus={updateOnInput ? handleFocus : undefined}
          />
        );
      })}
    </FormGroup>
  );
}

export default RadioWidget;
