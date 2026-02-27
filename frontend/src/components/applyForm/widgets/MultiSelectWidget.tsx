"use client";

import {
  enumOptionsValueForIndex,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

import React, { useCallback, useMemo, useRef } from "react";
import {
  ComboBox,
  FormGroup,
  type ComboBoxOption,
  type ComboBoxRef,
} from "@trussworks/react-uswds";

import { FieldErrors } from "src/components/applyForm/FieldErrors";
import { UswdsWidgetProps } from "src/components/applyForm/types";
import { Pill } from "src/components/Pill";
import { DynamicFieldLabel } from "./DynamicFieldLabel";
import { getLabelTypeFromOptions } from "./getLabelTypeFromOptions";

function toStringArray(selectedValue: unknown): string[] {
  if (Array.isArray(selectedValue)) return selectedValue.map(String);
  if (selectedValue == null || selectedValue === "") return [];
  return [selectedValue as string];
}

export default function MultiSelect<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = never,
>({
  id,
  disabled,
  readOnly,
  required,
  schema,
  value,
  options = {},
  autofocus = false,
  rawErrors = [],
  onChange = () => ({}),
  onBlur = () => ({}),
  onFocus = () => ({}),
}: UswdsWidgetProps<T, S, F>) {
  const { title, description, maxItems, minItems } = schema;

  const { enumOptions: opts, enumDisabled } = (options ?? {}) as {
    enumOptions?: ComboBoxOption[];
    enumDisabled?: Array<string | number>;
  };
  // Future:
  // allows us to enforce the minimum number
  // we can later pass it as prop if design likes the idea
  // this will be used for some dropdowns that have the possibility of having one option
  // example would be starting an application and it is defaulted to "individual" and no other options are available
  const enforceMinInUI = false;
  const labelType = getLabelTypeFromOptions(options?.["widget-label"]);
  const allOptions: ComboBoxOption[] = useMemo(() => opts ?? [], [opts]);

  const [selected, setSelected] = React.useState<string[]>(
    toStringArray(value as string[]),
  );

  const comboRef = useRef<ComboBoxRef>(null);

  const maxSelections = typeof maxItems === "number" ? maxItems : 3;
  const minSelectionsEff = typeof minItems === "number" ? minItems : 0;
  const atMaxSelection = selected.length >= maxSelections;

  const isOptDisabled = useCallback(
    (opt: ComboBoxOption) =>
      !!enumDisabled &&
      (enumDisabled.includes(opt.label) || enumDisabled.includes(opt.value)),
    [enumDisabled],
  );

  const availableOptions = useMemo(
    () =>
      allOptions.filter(
        (option) =>
          !selected.includes(String(option.value)) && !isOptDisabled(option),
      ),
    [allOptions, selected, isOptDisabled],
  );

  const error = rawErrors.length ? true : undefined;
  const describedBy = error
    ? `error-for-${id}`
    : title
      ? `label-for-${id}`
      : undefined;

  const syncUpstream = (next: string[]) => {
    setSelected(next);
    onChange(
      enumOptionsValueForIndex<S>(next, allOptions, undefined) as unknown as T,
    );
  };

  const addByLabelOrValue = (raw: string): void => {
    const text = raw.trim();
    if (!text || atMaxSelection) return;

    const match =
      allOptions.find(
        (option) => String(option.label).toLowerCase() === text.toLowerCase(),
      ) ??
      allOptions.find(
        (option) => String(option.value).toLowerCase() === text.toLowerCase(),
      );

    if (!match) return;

    const selectValue = String(match.value);
    if (selected.includes(selectValue)) return;

    const next = [...selected, selectValue];
    syncUpstream(next);
    comboRef.current?.clearSelection();
  };

  const removeValue = (value: string) => {
    const next = selected.filter((selectedValue) => selectedValue !== value);
    if (enforceMinInUI && next.length < minSelectionsEff) return;
    syncUpstream(next);
  };

  const getLabelForValue = (value: string) =>
    allOptions.find((option) => String(option.value) === value)?.label ?? value;

  // ComboBox widget changes the id which breaks handling of idFor and anchor links
  // this component creates a <select> with the name attached to the <ComboBox> component
  // when selecting the code takes the value and creates a hidden input based on the index of the selection and the id
  // component tracks selected option internally, set the name to "" to not set the value of the select.
  const idFor = `${id}__combobox`;

  return (
    <FormGroup error={error} key={`form-group__uswds-combomulti--${id}`}>
      <DynamicFieldLabel
        idFor={idFor}
        title={title}
        required={required}
        description={description as string}
        labelType={labelType}
      />
      {error && (
        <FieldErrors fieldName={id} rawErrors={rawErrors as string[]} />
      )}
      {/* Hidden inputs so your form posts an array */}
      {selected.map((v, i) => (
        <input
          key={`${id}-hidden-${v}`}
          type="hidden"
          name={`${id}[${i}]`}
          value={v}
        />
      ))}
      {/* ComboBox widget changes the id which breaks handling of idFor and anchor links */}
      <span id={id}></span>
      <ComboBox
        ref={comboRef}
        id={`${id}__combobox`}
        name={""}
        options={availableOptions}
        disabled={disabled || readOnly || atMaxSelection}
        onChange={(val?: string) => {
          if (!val) return;
          addByLabelOrValue(val);
        }}
        inputProps={{
          autoFocus: autofocus,
          "aria-describedby": describedBy,
          placeholder: atMaxSelection
            ? `Maximum ${maxSelections} selected`
            : "Type to search and press Enter to add",
          onKeyDown: (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addByLabelOrValue(e.currentTarget.value);
            }
          },
          onBlur: (e) => {
            // Commit exact match on blur, then bubble RJSF blur
            addByLabelOrValue(e.currentTarget.value);
            onBlur(id, selected as unknown as T);
          },
          onFocus: () => onFocus(id, selected as unknown as T),
        }}
      />

      {/* Selected pills */}
      {selected.length > 0 && (
        <div className="margin-top-1 display-flex flex-wrap">
          {selected.map((v) => {
            const label = String(getLabelForValue(v));
            return (
              <div key={v} className="margin-right-1 margin-bottom-1">
                <Pill
                  label={label}
                  onClose={() => {
                    if (disabled || readOnly) return;
                    removeValue(v);
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="margin-top-1 text-base-dark text-italic">
        Selected {selected.length} / {maxSelections}
      </div>
    </FormGroup>
  );
}
