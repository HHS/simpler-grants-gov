"use client";

import { RJSFSchema } from "@rjsf/utils";
import { useFormStatus } from "react-dom";

import { useActionState } from "react";
import { Button, Fieldset, FormGroup } from "@trussworks/react-uswds";

import { submitApplyForm } from "./actions";
import { ApplyFormErrorMessage } from "./ApplyFormErrorMessage";
import ApplyFormNav from "./ApplyFormNav";
import { ApplyFormSuccessMessage } from "./ApplyFormSuccessMessage";
import { UiSchema } from "./types";
import { buildForTreeRecursive, getWrappersForNav } from "./utils";

const ApplyForm = ({
  applicationId,
  formId,
  formSchema,
  rawFormData,
  uiSchema,
}: {
  applicationId: string;
  formId: string;
  formSchema: RJSFSchema;
  rawFormData?: object;
  uiSchema: UiSchema;
}) => {
  const { pending } = useFormStatus();

  const [formState, formAction] = useActionState(submitApplyForm, {
    applicationId,
    errorMessage: "",
    formId,
    formData: new FormData(),
    successMessage: "",
    validationErrors: [],
  });

  const { formData, errorMessage, successMessage, validationErrors } =
    formState;
  const formObject = rawFormData || Object.fromEntries(formData.entries());
  const fields = buildForTreeRecursive({
    errors: validationErrors,
    formData: formObject,
    schema: formSchema,
    uiSchema,
  });
  const navFields = getWrappersForNav(uiSchema);
  return (
    <div className="usa-in-page-nav-container flex-justify">
      <ApplyFormNav fields={navFields} />
      <form className="usa-form usa-form-large flex-1" action={formAction}>
        <ApplyFormSuccessMessage message={successMessage} />
        <ApplyFormErrorMessage
          message={errorMessage}
          errors={validationErrors}
        />
        <FormGroup>
          <Fieldset legendStyle="large">{fields}</Fieldset>
        </FormGroup>
        <p>
          <Button
            data-testid="apply-form-save"
            type="submit"
            secondary
            name="apply-form-button"
            value="save"
          >
            {pending ? "Saving..." : "Save"}
          </Button>
          <Button
            data-testid="apply-form-submit"
            onClick={() =>
              validationErrors.length > 0
                ? window.scrollTo({ top: 0, behavior: "smooth" })
                : undefined
            }
            name="apply-form-button"
            value="submit"
            type="submit"
          >
            {pending ? "Submitting..." : "Submit"}
          </Button>
        </p>
      </form>
    </div>
  );
};

export default ApplyForm;
