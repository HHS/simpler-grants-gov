"use client";

import {
  enumOptionsIsSelected,
  EnumOptionsType,
  FormContextType,
  optionId,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

import React, { FocusEvent, useCallback, useMemo } from "react";
import { FormGroup, Radio } from "@trussworks/react-uswds";

import { FieldErrors } from "src/components/applyForm/FieldErrors";
import { TextTypes, UswdsWidgetProps } from "src/components/applyForm/types";
import { DynamicFieldLabel } from "./DynamicFieldLabel";
import { getLabelTypeFromOptions } from "./getLabelTypeFromOptions";

/**
 * The portion of `options` we care about here, with safe typing.
 * We shape our data since RJSF’s options are loosely typed.
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

function coerceFromString<S extends StrictRJSFSchema>(
  raw: string,
  enumOptions: ReadonlyArray<EnumOptionsType<S>>,
): unknown {
  const usesBoolStrings = enumOptions.some(
    (option) => option.value === "true" || option.value === "false",
  );
  if (usesBoolStrings) return raw === "true";
  // For non-boolean radios, return the actual enum value (could be number/string)
  const hit = enumOptions.find((option) => String(option.value) === raw);
  return hit ? hit.value : raw;
}

export default function RadioWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = never,
>({
  id,
  disabled,
  options = {},
  schema,
  required,
  readOnly,
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
  const { enumDisabled, enumOptions: uiEnumOptions } =
    (options as LocalOptions<S>) ?? {};

  /**
   * Determine our list of options:
   * Prefer ui-provided enumOptions (already shaped), else fall back to schema.enum.
   */
  const enumOptions: EnumOptionsType<S>[] = useMemo(() => {
    if (Array.isArray(uiEnumOptions) && uiEnumOptions.length) {
      return uiEnumOptions;
    }
    const fromSchema =
      Array.isArray(enumFromSchema) && enumFromSchema.length
        ? enumFromSchema.map((enumValue) => ({
            label: String(enumValue),
            value: enumValue,
          }))
        : [];
    return fromSchema as EnumOptionsType<S>[];
  }, [uiEnumOptions, enumFromSchema]);

  const error = rawErrors.length ? true : undefined;
  const describedby = error
    ? `error-for-${id}`
    : title
      ? `label-for-${id}`
      : undefined;

  const labelType = getLabelTypeFromOptions(options?.["widget-label"]);

  const handleBlur = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) => {
      const next = coerceFromString<S>(
        String(target?.value ?? ""),
        enumOptions,
      ) as T;
      onBlur(id, next);
    },
    [onBlur, id, enumOptions],
  );

  const handleFocus = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) => {
      const next = coerceFromString<S>(
        String(target?.value ?? ""),
        enumOptions,
      ) as T;
      onFocus(id, next);
    },
    [onFocus, id, enumOptions],
  );

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
        <FieldErrors fieldName={id} rawErrors={rawErrors as string[]} />
      )}
      {enumOptions.map((option, index) => {
        const currentForCompare = normalizeForCompare(option.value, value);
        const checked = enumOptionsIsSelected<S>(
          option.value,
          currentForCompare,
        );

        const itemDisabled =
          Array.isArray(enumDisabled) &&
          enumDisabled.indexOf(option.value as TextTypes) !== -1;

        const handleChange = () => {
          const raw = String(option.value);
          const toEmit = coerceFromString<S>(raw, enumOptions) as T;
          onChange(toEmit);
        };

        return (
          <Radio
            label={option.label}
            id={optionId(id, index)}
            key={optionId(id, index)}
            name={id}
            required={required}
            disabled={disabled || itemDisabled || readOnly}
            autoFocus={autofocus && index === 0}
            aria-describedby={describedby}
            checked={updateOnInput ? checked : undefined}
            defaultChecked={updateOnInput ? undefined : checked}
            defaultValue={updateOnInput ? undefined : String(option.value)}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
          />
        );
      })}
    </FormGroup>
  );
}
