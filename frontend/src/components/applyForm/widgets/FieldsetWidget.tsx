import { JSX } from "react";
import { Fieldset, FormGroup } from "@trussworks/react-uswds";

export const FieldsetWidget = ({
  label,
  fieldName,
  children,
}: {
  label: string;
  fieldName: string;
  children: JSX.Element | undefined;
}) => {
  return (
    <Fieldset key={`${fieldName}-row`} id={fieldName}>
      <FormGroup key={`${fieldName}-group`}>
        <h4
          key={`${fieldName}-legend`}
          className="usa-legend usa-legend--large"
        >
          {label}
        </h4>
        {children}
      </FormGroup>
    </Fieldset>
  );
};
