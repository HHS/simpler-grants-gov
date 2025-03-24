"use client";

import { useActionState } from "react";
import { Button, FormGroup } from "@trussworks/react-uswds";

import { submitApplyForm } from "./actions";
import { FormSchema, SetFormDataFunction, UiSchema } from "./types";
import { buildFormTreeClosure } from "./utils";

/**
 *
 * [{ field: name, rendered: JSX }, { field: name, rendered: JSX }]
 *
 *
 *
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

const ApplyForm = ({
  formSchema,
  uiSchema,
}: {
  formSchema: FormSchema;
  uiSchema: UiSchema;
}) => {
  const fields = buildFormTreeClosure(formSchema, uiSchema);
  const [state, formAction] = useActionState(submitApplyForm, {
    errorMessage: "",
    validationErrors: "",
  });

  return (
    <form action={formAction}>
      {state?.errorMessage}
      <FormGroup>{fields}</FormGroup>
      <Button type="submit">Submit</Button>
    </form>
  );
};

export default ApplyForm;
