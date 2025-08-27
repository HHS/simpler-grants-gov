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
import { ErrorMessage, FormGroup, Radio } from "@trussworks/react-uswds";

import { TextTypes, UswdsWidgetProps } from "src/components/applyForm/types";
import { DynamicFieldLabel } from "./DynamicFieldLabel";
import { getLabelTypeFromOptions } from "./getLabelTypeFromOptions";
import { normalizeForCompare } from "src/utils/normalizeForCompare";
import { fromBooleanString, isBooleanString } from "src/utils/booleanStrings";

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
 * coerceFromString
 *
 * Convert an HTML input value (always a string) to either a boolean (for
 * boolean radio groups) or the original enum value if we can find it.
 */
function coerceFromString<S extends StrictRJSFSchema>(
  raw: string,
  enumOptions: ReadonlyArray<EnumOptionsType<S>>,
): unknown {
  const usesBoolStrings = enumOptions.some(
    (option) => option.value === "true" || option.value === "false",
  );
  if (usesBoolStrings) {
    return raw === "true";
  }
  // For non-boolean radios, return the actual enum value (could be number/string)
  const hit = enumOptions.find((option) => String(option.value) === raw);
  return hit ? hit.value : raw;
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
  const { enumDisabled, enumOptions: uiEnumOptions } =
    (options as LocalOptions<S>) ?? {};

  const labelType = getLabelTypeFromOptions(options?.["widget-label"]);

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
        <ErrorMessage>
          {typeof rawErrors[0] === "string"
            ? rawErrors[0]
            : Object.values(rawErrors[0] as Record<string, string>).join(",")}
        </ErrorMessage>
      )}

      {enumOptions.map((option, index) => {
        const normalizedCurrent = normalizeForCompare(option.value, value);

        const checked = enumOptionsIsSelected<S>(
          option.value,
          normalizedCurrent,
        );

        const itemDisabled =
          Array.isArray(enumDisabled) &&
          enumDisabled.indexOf(option.value as TextTypes) !== -1;

        const handleChange = () => {
          const raw = String(option.value);
          const next =
            isBooleanString(option.value)
              ? (fromBooleanString(raw) as T)
              : (raw as T)
          onChange(next);
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
