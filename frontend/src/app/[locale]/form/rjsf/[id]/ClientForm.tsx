"use client";

import { ThemeProps, withTheme } from "@rjsf/core";
import { RJSFSchema, WidgetProps } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";

import { useState } from "react";
import { Label, TextInput } from "@trussworks/react-uswds";

const theme: ThemeProps = {
  widgets: {
    textarea: ({ value, name }: WidgetProps) => (
      <>
        <Label htmlFor="input-type-text">{name}</Label>
        <TextInput
          value={value}
          id="input-type-text"
          name="input-type-text"
          type="text"
        />
      </>
    ),
  },
};

const ThemedForm = withTheme(theme);

const ClientForm = ({
  schema,
  uiSchema,
}: {
  schema: object;
  uiSchema: RJSFSchema;
}) => {
  const [formData, setFormData] = useState(null);
  console.log(formData);
  return (
    <ThemedForm
      uiSchema={uiSchema}
      formData={formData}
      onChange={(e) => setFormData(e.formData)}
      schema={schema}
      validator={validator}
    />
  );
};

export default ClientForm;
