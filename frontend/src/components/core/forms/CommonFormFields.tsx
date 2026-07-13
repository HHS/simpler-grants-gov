// These fields are meant to be reusable and provide a consistent look and feel for all pages.
// For examples, see page opportunities/create

import React, { useState } from "react";
import {
  CharacterCount,
  FormGroup,
  Select,
  Textarea,
  TextInput,
} from "@trussworks/react-uswds";

import { DynamicFieldLabel } from "src/components/core/forms/DynamicFieldLabel";
import { FieldErrors } from "src/components/core/forms/FieldErrors";

// ----------------------------------------------------------
// Common TextInput with error block
// ----------------------------------------------------------
export const CommonTextInput = ({
  labelText,
  description, // or instructions
  fieldId,
  isRequired,
  fieldMaxLength,
  onTextChange,
  onKeyDown = () => {},
  onFieldBlur = () => {},
  defaultValue = "",
  value,
  rawErrors = [],
}: {
  labelText: string;
  description: string;
  fieldId: string;
  isRequired: boolean;
  fieldMaxLength: number;
  onTextChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFieldBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  defaultValue?: string;
  value?: string;
  rawErrors?: string[];
}) => {
  const error = rawErrors.length ? true : undefined;
  return (
    <>
      <FormGroup key={`form-group__text-input--${fieldId}`} error={error}>
        <DynamicFieldLabel
          idFor={fieldId}
          title={labelText}
          required={isRequired}
          description={description}
        />
        {error && <FieldErrors fieldName={fieldId} rawErrors={rawErrors} />}
        <TextInput
          type="text"
          name={fieldId}
          id={fieldId}
          onChange={onTextChange}
          onKeyDown={onKeyDown}
          onBlur={onFieldBlur}
          maxLength={fieldMaxLength}
          style={{ maxWidth: "550px" }}
          defaultValue={defaultValue}
          value={value}
        />
      </FormGroup>
    </>
  );
};

// ----------------------------------------------------------
// Common Textarea with error block
// ----------------------------------------------------------
export const CommonTextArea = ({
  labelText,
  description, // or instructions
  fieldId,
  isRequired,
  fieldMaxLength,
  onTextChange,
  defaultValue = "",
  rawErrors = [],
}: {
  labelText: string;
  description: string;
  fieldId: string;
  isRequired: boolean;
  fieldMaxLength: number;
  onTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  defaultValue?: string;
  rawErrors?: string[];
}) => {
  const error = rawErrors.length ? true : undefined;
  return (
    <>
      <FormGroup key={`form-group__text-input--${fieldId}`} error={error}>
        <DynamicFieldLabel
          idFor={fieldId}
          title={labelText}
          required={isRequired}
          description={description}
        />
        {error && <FieldErrors fieldName={fieldId} rawErrors={rawErrors} />}
        <Textarea
          name={fieldId}
          id={fieldId}
          onChange={onTextChange}
          maxLength={fieldMaxLength}
          style={{ maxWidth: "550px" }}
          defaultValue={defaultValue}
        />
      </FormGroup>
    </>
  );
};

// ----------------------------------------------------------
// Common CharacterCount
// ----------------------------------------------------------
export const CommonCharacterCount = ({
  isTextArea = false,
  inputType = "text",
  labelText,
  description, // or instructions
  fieldId,
  isRequired,
  fieldMaxLength,
  defaultValue = "",
  value,
  onTextChange,
  onFieldBlur = () => {},
  rawErrors = [],
  disabled = false,
}: {
  isTextArea?: boolean;
  inputType?: "text" | "email" | "url";
  labelText: string;
  description: string;
  fieldId: string;
  isRequired: boolean;
  fieldMaxLength: number;
  defaultValue?: string;
  value?: string;
  onTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFieldBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  rawErrors?: string[];
  disabled?: boolean;
}) => {
  const error = rawErrors.length ? true : undefined;
  return (
    <>
      <FormGroup key={`form-group__text-input--${fieldId}`} error={error}>
        <DynamicFieldLabel
          idFor={fieldId}
          title={labelText}
          required={isRequired}
          description={description}
        />
        {error && <FieldErrors fieldName={fieldId} rawErrors={rawErrors} />}
        <CharacterCount
          id={fieldId}
          name={fieldId}
          maxLength={fieldMaxLength}
          defaultValue={defaultValue}
          value={value}
          onChange={onTextChange}
          onBlur={onFieldBlur}
          isTextArea={isTextArea}
          aria-describedby={`label-for-${fieldId}`}
          disabled={disabled}
          {...(!isTextArea && { type: inputType })}
        />
      </FormGroup>
    </>
  );
};

// ----------------------------------------------------------
// Common Select input with error block
// ----------------------------------------------------------
export const CommonSelectInput = ({
  labelText,
  description, // or instructions
  fieldId,
  isRequired,
  listKeyValuePairs,
  pleaseSelectText = "-Select-",
  defaultSelection,
  onSelectionChange,
  rawErrors = [],
  selectClassName = "maxw-mobile-lg",
}: {
  labelText: string;
  description: string;
  fieldId: string;
  isRequired: boolean;
  listKeyValuePairs: { [key: string]: string };
  pleaseSelectText?: string; // optional: e.g. --Please Select--
  defaultSelection?: string; // optional: default selection key
  onSelectionChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  rawErrors?: string[];
  selectClassName?: string;
}) => {
  const error = rawErrors.length ? true : undefined;
  const [selectedValue, setSelectedValue] = useState<string>(
    defaultSelection || "",
  );
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedValue(event.target.value);
    if (onSelectionChange) {
      onSelectionChange(event);
    }
  };

  return (
    <>
      <FormGroup key={`form-group__text-input--${fieldId}`} error={error}>
        <DynamicFieldLabel
          idFor={fieldId}
          title={labelText}
          required={isRequired}
          description={description}
        />
        {error && <FieldErrors fieldName={fieldId} rawErrors={rawErrors} />}
        <Select
          id={fieldId}
          name={fieldId}
          onChange={handleChange}
          value={selectedValue}
          className={selectClassName}
        >
          {/* Default option */}
          <option key={""} value={""} disabled>
            {pleaseSelectText}
          </option>

          {/* List of options */}
          {Object.entries(listKeyValuePairs).map(([key, value]) => (
            <option key={key} value={key}>
              {value}
            </option>
          ))}
        </Select>
      </FormGroup>
    </>
  );
};
