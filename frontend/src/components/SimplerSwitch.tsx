import { ChangeEvent, InputHTMLAttributes, ReactElement, useId } from "react";

/*
  SimplerSwitch

  Binary switch control for Simpler that follows the WAI-ARIA switch pattern.

  Responsibilities:

  - Use a native checkbox input as the accessibility foundation.
  - Expose switch semantics with `role="switch"`.
  - Keep the component strictly binary: on or off only.
  - Support either a visible associated label or an ARIA naming fallback.
  - Allow visual state styling for checked, disabled, focus, and error states.
  - Keep optional visible state text (`On` / `Off`) decorative only.

  Non-responsibilities:

  - Async persistence behavior
  - Retry/loading workflows
  - Page-specific settings row layout
  - Indeterminate or mixed states
*/

function joinClassNames(
  ...classNames: Array<string | undefined | false | null>
): string {
  return classNames.filter(Boolean).join(" ");
}

type NativeInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | "type"
  | "checked"
  | "defaultChecked"
  | "onChange"
  | "size"
  | "children"
  | "aria-label"
  | "aria-labelledby"
  | "aria-describedby"
>;

export type SimplerSwitchProps = NativeInputProps & {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  showStateText?: boolean;
  onText?: string;
  offText?: string;
  hasError?: boolean;
  className?: string;
};

export type SimplerSwitchFieldProps = Omit<SimplerSwitchProps, "hasError"> & {
  label?: string;
  description?: string;
  errorMessage?: string;
  switchClassName?: string;
  labelClassName?: string;
  descriptionClassName?: string;
  errorClassName?: string;
};

function buildDescribedBy(options: {
  existingValue?: string;
  descriptionId?: string;
  errorId?: string;
}): string | undefined {
  const describedByValues = [
    options.existingValue,
    options.descriptionId,
    options.errorId,
  ].filter(Boolean);

  return describedByValues.length > 0 ? describedByValues.join(" ") : undefined;
}

export function SimplerSwitch({
  id,
  checked,
  onCheckedChange,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  showStateText = false,
  onText = "On",
  offText = "Off",
  hasError = false,
  className,
  disabled = false,
  name,
  required,
  onBlur,
  onFocus,
  ...nativeInputProps
}: SimplerSwitchProps): ReactElement {
  /*
    The switch must always have an accessible name.

    Prefer a visible label wired through `ariaLabelledBy`. When that is not
    available, allow `ariaLabel` as the fallback.
  */
  const hasAccessibleName = Boolean(ariaLabel || ariaLabelledBy);

  if (!hasAccessibleName) {
    throw new Error(
      "SimplerSwitch requires either ariaLabel or ariaLabelledBy so the switch has an accessible name.",
    );
  }

  /*
    Native checkbox behavior handles keyboard interaction for us. We only map
    the binary checked state into the component's public callback.
  */
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onCheckedChange(event.currentTarget.checked);
  };

  return (
    <div
      className={joinClassNames("simpler-switch", className)}
      data-checked={checked}
      data-disabled={disabled}
      data-error={hasError}
      data-state-text={showStateText}
    >
      <input
        {...nativeInputProps}
        id={id}
        className="simpler-switch__input"
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        name={name}
        required={required}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-invalid={hasError || undefined}
        onChange={handleChange}
        onBlur={onBlur}
        onFocus={onFocus}
      />

      <label htmlFor={id} className="simpler-switch__visual">
        <span className="simpler-switch__track" aria-hidden="true">
          <span className="simpler-switch__thumb" />
        </span>

        {showStateText ? (
          <span className="simpler-switch__state-text" aria-hidden="true">
            {checked ? onText : offText}
          </span>
        ) : null}
      </label>
    </div>
  );
}

/*
  SimplerSwitchField

  Common field wrapper for switch usage that includes:

  - optional visible label
  - optional description
  - optional error message
  - layout for text content + switch control

  The wrapper owns the visible field content and wires the underlying switch
  to the appropriate labeling and description relationships.
*/
export function SimplerSwitchField({
  id,
  label,
  description,
  errorMessage,
  className,
  switchClassName,
  labelClassName,
  descriptionClassName,
  errorClassName,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  ...switchProps
}: SimplerSwitchFieldProps): ReactElement {
  const generatedFieldIdentifier = useId();

  const labelId = label ? `${id}-${generatedFieldIdentifier}-label` : undefined;
  const descriptionId = description
    ? `${id}-${generatedFieldIdentifier}-description`
    : undefined;
  const errorId = errorMessage
    ? `${id}-${generatedFieldIdentifier}-error`
    : undefined;

  const resolvedAriaLabelledBy = ariaLabelledBy ?? labelId;
  const resolvedAriaDescribedBy = buildDescribedBy({
    existingValue: ariaDescribedBy,
    descriptionId,
    errorId,
  });

  return (
    <div
      className={joinClassNames("simpler-switch-field", className)}
      data-error={Boolean(errorMessage)}
    >
      <div className="simpler-switch-field__content">
        <div className="simpler-switch-field__text">
          {label ? (
            <label
              id={labelId}
              htmlFor={id}
              className={joinClassNames(
                "simpler-switch-field__label",
                labelClassName,
              )}
            >
              {label}
            </label>
          ) : null}

          {description ? (
            <div
              id={descriptionId}
              className={joinClassNames(
                "simpler-switch-field__description",
                descriptionClassName,
              )}
            >
              {description}
            </div>
          ) : null}

          {errorMessage ? (
            <div
              id={errorId}
              className={joinClassNames(
                "simpler-switch-field__error",
                errorClassName,
              )}
            >
              {errorMessage}
            </div>
          ) : null}
        </div>

        <div className="simpler-switch-field__control">
          <SimplerSwitch
            {...switchProps}
            id={id}
            className={switchClassName}
            hasError={Boolean(errorMessage)}
            ariaLabel={label ? ariaLabel : (ariaLabel ?? "Toggle setting")}
            ariaLabelledBy={resolvedAriaLabelledBy}
            ariaDescribedBy={resolvedAriaDescribedBy}
          />
        </div>
      </div>
    </div>
  );
}
