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

import { FieldErrors } from "src/components/applyForm/FieldErrors";
import { DynamicFieldLabel } from "src/components/applyForm/widgets/DynamicFieldLabel";

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
  defaultValue = "",
  rawErrors = [],
}: {
  labelText: string;
  description: string;
  fieldId: string;
  isRequired: boolean;
  fieldMaxLength: number;
  onTextChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
        <TextInput
          type="text"
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
  labelText,
  description, // or instructions
  fieldId,
  isRequired,
  fieldMaxLength,
  defaultValue = "",
  onTextChange,
  rawErrors = [],
}: {
  isTextArea?: boolean;
  labelText: string;
  description: string;
  fieldId: string;
  isRequired: boolean;
  fieldMaxLength: number;
  defaultValue?: string;
  onTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
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
        <CharacterCount
          id={fieldId}
          name={fieldId}
          maxLength={fieldMaxLength}
          defaultValue={defaultValue}
          onChange={onTextChange}
          isTextArea={isTextArea}
          aria-describedby={`label-for-${fieldId}`}
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
          className="maxw-mobile-lg"
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
