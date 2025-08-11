import { JSX } from "react";
import { Fieldset, FormGroup } from "@trussworks/react-uswds";

export const FieldsetWidget = ({
  label,
  fieldName,
  children,
  description,
}: {
  label: string;
  fieldName: string;
  children: JSX.Element | undefined;
  description?: string;
}) => {
  return (
    <Fieldset key={`${fieldName}-row`} id={fieldName}>
      <FormGroup key={`${fieldName}-group`} className="simpler-formgroup">
        <h4
          key={`${fieldName}-legend`}
          className="usa-legend font-sans-lg margin-bottom-05 margin-top-5"
        >
          {label}
        </h4>
        {description && <p>{description}</p>}
        {children}
      </FormGroup>
    </Fieldset>
  );
};
