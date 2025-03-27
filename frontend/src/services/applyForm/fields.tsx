import { JSX } from "react";
import {
  Fieldset,
  FormGroup,
  Label,
  Textarea,
  TextInput,
} from "@trussworks/react-uswds";

import { TextTypes, UswdsWidgetProps } from "./types";

export const fieldLabel = (
  name: string,
  title: string,
  required: boolean | undefined,
) => {
  return (
    <Label key={`label-for-${name}`} htmlFor={name}>
      {title}
      {required && (
        <span className="usa-hint usa-hint--required text-no-underline">*</span>
      )}
    </Label>
  );
};

export const textInputField = ({
  name,
  label,
  type,
  id,
  required,
  minLength,
  maxLength,
}: UswdsWidgetProps) => {
  const renderedLabel = fieldLabel(name, label, required);
  return (
    <div key={`wrapper-for-${name}`}>
      {renderedLabel}
      <TextInput
        minLength={(minLength as number) ?? undefined}
        maxLength={(maxLength as number) ?? undefined}
        id={id}
        key={id}
        type={type as TextTypes}
        name={name}
      />
    </div>
  );
};

export const textAreaField = ({
  name,
  label,
  id,
  required,
  minLength,
  maxLength,
}: UswdsWidgetProps) => {
  const renderedLabel = fieldLabel(name, label, required);
  return (
    <div key={`wrapper-for-${name}`}>
      {renderedLabel}
      <Textarea
        minLength={(minLength as number) ?? undefined}
        maxLength={(maxLength as number) ?? undefined}
        id={id}
        key={name}
        name={name}
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
