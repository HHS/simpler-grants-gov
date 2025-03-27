"use client";

import { RJSFSchema } from "@rjsf/utils";
import { useFormStatus } from "react-dom";

import { useActionState } from "react";
import { Alert, Button, FormGroup } from "@trussworks/react-uswds";

import { submitApplyForm } from "./actions";
import ApplyFormNav from "./ApplyFormNav";
import { UiSchema } from "./types";
import { buildFormTreeClosure, getWrappersForNav } from "./utils";

const ApplyForm = ({
  formSchema,
  uiSchema,
}: {
  formSchema: RJSFSchema;
  uiSchema: UiSchema;
}) => {
  const { pending } = useFormStatus();

  const [formState, formAction] = useActionState(submitApplyForm, {
    errorMessage: "",
    validationErrors: [],
    formData: new FormData(),
  });
  const formObject = Object.fromEntries(formState.formData.entries());
  const fields = buildFormTreeClosure(
    formSchema,
    uiSchema,
    formState.validationErrors,
    formObject,
  );
  const navFields = getWrappersForNav(uiSchema);

  return (
    <div className="usa-in-page-nav-container flex-justify">
      <ApplyFormNav fields={navFields} />
      <form action={formAction}>
        {formState.errorMessage.length > 0 && (
          <Alert heading="oops" headingLevel="h3" type="error">
            {formState.errorMessage}
          </Alert>
        )}
        <FormGroup>{fields}</FormGroup>
        <Button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          type="submit"
        >
          {pending ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </div>
  );
};

export default ApplyForm;
