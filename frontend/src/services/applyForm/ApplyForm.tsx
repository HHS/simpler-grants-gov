"use client";

import { RJSFSchema } from "@rjsf/utils";

import { useActionState } from "react";
import { Alert, Button, FormGroup } from "@trussworks/react-uswds";

import { submitApplyForm } from "./actions";
import { SetFormDataFunction, UiSchema } from "./types";
import { buildFormTreeClosure } from "./utils";
import { useFormStatus } from "react-dom";

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
  formSchema: RJSFSchema;
  uiSchema: UiSchema;
}) => {
  const {pending} = useFormStatus()

  const [formState, formAction] = useActionState(submitApplyForm, {
    errorMessage: "",
    validationErrors: [],
    formData: new FormData()
  });
  const formObject = Object.fromEntries(formState.formData.entries());
  console.log(formState.validationErrors);
  const fields = buildFormTreeClosure(formSchema, uiSchema, formState.validationErrors, formObject);

  return (
    <form action={formAction}>
      {formState.errorMessage.length > 0 && 
            <Alert heading="oops" headingLevel="h3" type="error">{formState.errorMessage}</Alert>
      }
      <FormGroup>{fields}</FormGroup>
      <Button type="submit">{pending ? 'Submitting...' : 'Submit'}</Button>
    </form>
  );
};

export default ApplyForm;
