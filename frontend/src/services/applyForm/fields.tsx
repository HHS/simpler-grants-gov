import {
    Fieldset,
    FormGroup,
    Label,
    Textarea,
    TextInput,
  } from "@trussworks/react-uswds";
import { JSX } from "react";
import { TextTypes } from "./types";

export const createFieldLabel = (
    fieldName: string,
    title: string,
    required: boolean,
  ) => {
    return (
      <Label key={`label-for-${fieldName}`} htmlFor={fieldName}>
        {title}
        {required && (
          <span className="usa-hint usa-hint--required text-no-underline">*</span>
        )}
      </Label>
    );
  };
  

export const createTextInputField = (
    fieldName: string,
    title: string,
    type: TextTypes,
    parentId: string,
    required = false,
    minLength: number | null = null,
    maxLength: number | null = null,
  ) => {
    const label = createFieldLabel(fieldName, title, required);
    return (
      <div key={`wrapper-for-${fieldName}`} id={parentId}>
        {label}
        <TextInput
          minLength={minLength ?? undefined}
          maxLength={maxLength ?? undefined}
          id={fieldName}
          key={fieldName}
          type={type}
          name={title}
        />
      </div>
    );
  };
  
 export const createTextAreaField = (
    fieldName: string,
    title: string,
    parentId: string,
    required = false,
    minLength: number | null = null,
    maxLength: number | null = null,
  ) => {
    const label = createFieldLabel(fieldName, title, required);
    return (
      <div key={`wrapper-for-${fieldName}`} id={parentId}>
        {label}
        <Textarea
          minLength={minLength ?? undefined}
          maxLength={maxLength ?? undefined}
          id={fieldName}
          key={fieldName}
          name={title}
        />
      </div>
    );
  };
  
 export const wrapSection = (
    label: string,
    fieldName: string,
    tree: JSX.Element | undefined,
  ) => {
    return (
      <Fieldset key={`${fieldName}-row`}>
        <FormGroup key={`${fieldName}-group`}>
          <legend
            key={`${fieldName}-legend`}
            className="usa-legend usa-legend--large"
          >
            {label}
          </legend>
          {tree}
        </FormGroup>
      </Fieldset>
    );
  };
  
  
  