"use client";

import {
  ariaDescribedByIds,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";
import React, { ChangeEvent, FocusEvent, useCallback, useEffect, useState } from "react";
import { Checkbox, FormGroup } from "@trussworks/react-uswds";

import { UswdsWidgetProps } from "src/components/applyForm/types";

function CheckboxWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = never,
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
  onChange,
  onBlur = () => ({}),
  onFocus = () => ({}),
}: UswdsWidgetProps<T, S, F>) {
  const { title, description } = schema;
  const error = rawErrors.length ? true : undefined;

  // Local controlled state for instant UI and resilience on remounts
  const [checked, setChecked] = useState<boolean>(Boolean(value));

  // Only sync from parent when it truly sends a boolean (avoid clobber with undefined)
  useEffect(() => {
    if (typeof value === "boolean") {
      setChecked(value);
    }
  }, [value]);

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => onBlur(id, event.target.checked),
    [onBlur, id],
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const next = event.target.checked;
      setChecked(next);
      if (typeof onChange === "function") onChange(next);
    },
    [onChange],
  );

  const handleFocus = useCallback(
    (event: FocusEvent<HTMLInputElement>) => onFocus(id, event.target.checked),
    [onFocus, id],
  );

  const label = required ? (
    <>
      {title}{" "}
      <span className="usa-hint usa-hint--required text-no-underline">*</span>
    </>
  ) : (
    title
  );

  return (
    <FormGroup error={error} key={`form-group__checkbox--${id}`}>
      <input type="hidden" name={id} value={checked ? "true" : "false"} />

      <Checkbox
        id={id}
        label={label}
        labelDescription={(options?.description ?? description) as string | undefined}
        name={`${id}__display`} // avoid duplicate name collisions with hidden input
        value="true"
        checked={checked}
        required={required}
        disabled={disabled || readonly}
        autoFocus={autofocus}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        aria-describedby={ariaDescribedByIds<T>(id)}
      />
    </FormGroup>
  );
}

export default CheckboxWidget;
