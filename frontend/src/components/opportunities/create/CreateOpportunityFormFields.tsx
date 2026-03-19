// These fields are meant to be reusable and provide a consistent look and feel for all pages.
// Use this in combo with FormGroup. For examples, see page opportunities/create/[agencyId]
// Feel free to add attributes as needed, but don't delete any because others could be using them.

import React, { useState } from "react";
import {
  ErrorMessage,
  FormGroup,
  Label,
  Select,
  Textarea,
  TextInput,
} from "@trussworks/react-uswds";

// ----------------------------------------------------------
// Common Text with the same styles
// ----------------------------------------------------------
export const CommonText = ({ textContent }: { textContent: string }) => {
  return (
    <>
      <div className="font-sans-2xs" style={{ maxWidth: "550px" }}>
        {textContent}
      </div>
    </>
  );
};

// ----------------------------------------------------------
// Common Label with ErrorMessage
// ----------------------------------------------------------
export const CommonLabel = ({
  labelId,
  labelText,
  description, // or instructions
  fieldId,
  isRequired,
  validationError = "",
}: {
  labelId: string;
  labelText: string;
  description: string;
  fieldId: string;
  isRequired: boolean;
  validationError?: string;
}) => {
  return (
    <>
      <Label
        id={labelId}
        key={labelId}
        htmlFor={fieldId}
        className="font-sans-sm margin-top-3 text-bold"
      >
        {labelText}
        {isRequired && <span className="text-red"> * </span>}
      </Label>
      <div className="font-sans-2xs" style={{ maxWidth: "550px" }}>
        {description}
      </div>
      {validationError ? <ErrorMessage>{validationError}</ErrorMessage> : null}
    </>
  );
};

// ----------------------------------------------------------
// Common TextInput with error block
// ----------------------------------------------------------
export const CommonTextInput = ({
  labelId,
  labelText,
  description, // or instructions
  fieldId,
  isRequired,
  fieldMaxLength,
  onTextChange,
  defaultValue = "",
  validationError = "",
}: {
  labelId: string;
  labelText: string;
  description: string;
  fieldId: string;
  isRequired: boolean;
  fieldMaxLength: number;
  onTextChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  defaultValue?: string;
  validationError?: string;
}) => {
  return (
    <>
      <FormGroup error={Boolean(validationError)} className="margin-top-1">
        <CommonLabel
          labelId={labelId}
          labelText={labelText}
          description={description}
          fieldId={fieldId}
          isRequired={isRequired}
          validationError={validationError}
        />
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
  labelId,
  labelText,
  description, // or instructions
  fieldId,
  isRequired,
  fieldMaxLength,
  onTextChange,
  defaultValue = "",
  validationError = "",
}: {
  labelId: string;
  labelText: string;
  description: string;
  fieldId: string;
  isRequired: boolean;
  fieldMaxLength: number;
  onTextChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  defaultValue?: string;
  validationError?: string;
}) => {
  return (
    <>
      <FormGroup error={Boolean(validationError)} className="margin-top-1">
        <CommonLabel
          labelId={labelId}
          labelText={labelText}
          description={description}
          fieldId={fieldId}
          isRequired={isRequired}
          validationError={validationError}
        />
        <Textarea
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
// Common Select input with error block
// ----------------------------------------------------------
export interface KeyValuePair {
  key: string;
  value: string;
}
export const CommonSelectInput = ({
  labelId,
  labelText,
  description, // or instructions
  fieldId,
  isRequired,
  listKeyValuePairs,
  defaultSelection,
  pleaseSelectText = "-Select-",
  onSelectionChange,
  validationError = "",
}: {
  labelId: string;
  labelText: string;
  description: string;
  fieldId: string;
  isRequired: boolean;
  listKeyValuePairs: KeyValuePair[];
  defaultSelection?: string; // optional: default selection key
  pleaseSelectText?: string; // optional: e.g. --Please Select--
  onSelectionChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  validationError?: string;
}) => {
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
      <FormGroup error={Boolean(validationError)} className="margin-top-1">
        <CommonLabel
          labelId={labelId}
          labelText={labelText}
          description={description}
          fieldId={fieldId}
          isRequired={isRequired}
          validationError={validationError}
        />
        <Select
          id={fieldId}
          name={fieldId}
          onChange={handleChange}
          value={selectedValue}
          style={{ maxWidth: "550px" }}
        >
          {/* Default option */}
          <option key={""} value={""} disabled>
            {pleaseSelectText}
          </option>

          {/* List of options */}
          {listKeyValuePairs.map((item) => (
            <option key={item.key} value={item.key}>
              {item.value}
            </option>
          ))}
        </Select>
      </FormGroup>
    </>
  );
};
