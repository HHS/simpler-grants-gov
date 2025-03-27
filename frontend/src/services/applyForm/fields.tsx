import { JSX } from "react";
import { Fieldset, FormGroup, Label } from "@trussworks/react-uswds";

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

export const wrapSection = (
  label: string,
  fieldName: string,
  tree: JSX.Element | undefined,
) => {
  return (
    <Fieldset key={`${fieldName}-row`} id={fieldName}>
      <FormGroup key={`${fieldName}-group`}>
        <h4
          key={`${fieldName}-legend`}
          className="usa-legend usa-legend--large"
        >
          {label}
        </h4>
        {tree}
      </FormGroup>
    </Fieldset>
  );
};
