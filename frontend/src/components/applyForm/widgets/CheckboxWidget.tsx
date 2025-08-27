import {
  ariaDescribedByIds,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

import { ChangeEvent, FocusEvent, useCallback, useMemo } from "react";
import { Checkbox, ErrorMessage, FormGroup } from "@trussworks/react-uswds";

import { FieldErrors } from "src/components/applyForm/FieldErrors";
import { UswdsWidgetProps } from "src/components/applyForm/types";

/** The `CheckBoxWidget` is a widget for rendering boolean properties.
 *  It is typically used to represent a boolean.
 *
 * @param props - The `WidgetProps` for this component
 */
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
  // passing on* functions made optional
  onChange = () => ({}),
  onBlur = () => ({}),
  onFocus = () => ({}),
}: UswdsWidgetProps<T, S, F>) {
  const { title, type } = schema;
  const error = rawErrors.length ? true : undefined;
  const errors = useMemo(
    () => FieldErrors({ type, fieldName: id, rawErrors }),
    [type, id, rawErrors],
  );

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => onBlur(id, event.target.checked),
    [onBlur, id],
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => onChange(event.target.checked),
    [onChange],
  );

  const handleFocus = useCallback(
    (event: FocusEvent<HTMLInputElement>) => onFocus(id, event.target.checked),
    [onFocus, id],
  );
  const description = options?.description ?? schema.description;

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
      {error && <ErrorMessage id={`error-for-${id}`}>{errors}</ErrorMessage>}
      <Checkbox
        id={id}
        label={label}
        labelDescription={description}
        name={id}
        // for a single checkbox, the value is always true
        value={"true"}
        defaultChecked={Boolean(value)}
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
