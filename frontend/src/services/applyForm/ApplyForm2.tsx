"use client";

import { ThemeProps, withTheme } from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";

import { useState } from "react";

import { SetFormDataFunction } from "./types";
import TextareaWidget from "./widgets2/TextAreaWidget";
import TextWidget from "./widgets2/TextWidget";

const theme: ThemeProps = {
  widgets: {
    textarea: TextareaWidget,
    text: TextWidget,
  },
};

const ThemedForm = withTheme(theme);

const uischema = {
  ProjectDecription: {
    "ui:widget": "textarea",
  },
};
const handleSubmit =
  (setFormData: SetFormDataFunction): React.FormEventHandler<HTMLFormElement> =>
  (event: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    event.preventDefault();
    const data = {} as Record<string, FormDataEntryValue>;
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }
    setFormData(data);
  };

const ApplyForm = ({ formSchema }: { formSchema: object }) => {
  const [formData, setFormData] = useState(null);

  return (
    <ThemedForm
      uiSchema={uischema}
      formData={formData}
      onChange={(e) => setFormData(e.formData)}
      schema={formSchema}
      validator={validator}
      onSubmit={handleSubmit}
      liveValidate
    />
  );
};

export default ApplyForm;
