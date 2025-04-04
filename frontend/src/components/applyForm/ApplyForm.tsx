"use client";

import { RJSFSchema } from "@rjsf/utils";
import { useFormStatus } from "react-dom";

import { useActionState } from "react";
import { Button, FormGroup } from "@trussworks/react-uswds";

import { submitApplyForm } from "./actions";
import { ApplyFormErrorMessage } from "./ApplyFormErrorMessage";
import ApplyFormNav from "./ApplyFormNav";
import { UiSchema } from "./types";
import { buildForTreeRecursive, getWrappersForNav } from "./utils";

const ApplyForm = ({
  formSchema,
  uiSchema,
  formId,
}: {
  formSchema: RJSFSchema;
  uiSchema: UiSchema;
  formId: string;
}) => {
  const { pending } = useFormStatus();

  //   submitApplyForm.bind("", formId)

  const [formState, formAction] = useActionState(submitApplyForm, {
    errorMessage: "",
    validationErrors: [],
    formData: new FormData(),
    formId,
  });
  const formObject = Object.fromEntries(formState.formData.entries());
  const fields = buildForTreeRecursive(
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
        <ApplyFormErrorMessage
          heading={formState.errorMessage}
          errors={formState.validationErrors}
        />
        <FormGroup>{fields}</FormGroup>
        <Button
          onClick={() =>
            formState.validationErrors.length > 0
              ? window.scrollTo({ top: 0, behavior: "smooth" })
              : undefined
          }
          type="submit"
        >
          {pending ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </div>
  );
};

export default ApplyForm;
