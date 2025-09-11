"use client";

import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

import React, { ChangeEvent, FocusEvent, useCallback } from "react";
import { Checkbox, FormGroup } from "@trussworks/react-uswds";

import { UswdsWidgetProps } from "src/components/applyForm/types";
import { DynamicFieldLabel } from "./DynamicFieldLabel";
import { getLabelTypeFromOptions } from "./getLabelTypeFromOptions";

function CheckboxWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = never
>({
  id,
  disabled,
  options,
  value,
  required,
  readonly,
  schema,
  autofocus = false,
  rawErrors = [],
  onChange = () => ({}),
  onBlur = () => ({}),
  onFocus = () => ({}),
}: UswdsWidgetProps<T, S, F>) {
  const hasError = rawErrors.length > 0 ? true : undefined;

  const description = (options?.description ?? schema.description) as string | undefined;
  const labelType = getLabelTypeFromOptions(
    (options?.["widget-label"] as string | undefined) ?? undefined
  );

  const baseTitle = (schema.title ??
    (options as Record<string, unknown> | undefined)?.label ??
    "") as string;

  // Match radio pattern: input points to the label+desc block (and error) explicitly
  const describedby = hasError ? `error-for-${id}` : `label-for-${id}`;

  const label = required ? (
    <DynamicFieldLabel
      idFor={id}
      title={baseTitle}
      required={required}
      description={description ?? ""}
      labelType={labelType}
    />
  ) : (
    baseTitle
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.checked);
    },
    [onChange],
  );

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      onBlur(id, event.target.checked);
    },
    [onBlur, id],
  );

  const handleFocus = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      onFocus(id, event.target.checked);
    },
    [onFocus, id],
  );

  return (
    <FormGroup error={hasError} key={`form-group__checkbox--${id}`}>
      <Checkbox
        id={id}
        name={id}
        label={label}
        defaultChecked={Boolean(value)}
        required={required}
        disabled={disabled || readonly}
        autoFocus={autofocus}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        aria-describedby={describedby}
      />
    </FormGroup>
  );
}

export default CheckboxWidget;
