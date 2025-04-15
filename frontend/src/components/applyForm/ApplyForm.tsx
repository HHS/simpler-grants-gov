"use client";

import { RJSFSchema } from "@rjsf/utils";
import { isEmpty } from "lodash";
import { useFormStatus } from "react-dom";

import { useActionState, useMemo } from "react";
import { Button, FormGroup } from "@trussworks/react-uswds";

import { handleFormAction } from "./actions";
import { ApplyFormErrorMessage } from "./ApplyFormErrorMessage";
import ApplyFormNav from "./ApplyFormNav";
import { ApplyFormSuccessMessage } from "./ApplyFormSuccessMessage";
import { UiSchema } from "./types";
import { buildForTreeRecursive, getFieldsForNav } from "./utils";

const ApplyForm = ({
  applicationId,
  formId,
  formSchema,
  savedFormData,
  uiSchema,
}: {
  applicationId: string;
  formId: string;
  formSchema: RJSFSchema;
  savedFormData: object;
  uiSchema: UiSchema;
}) => {
  const { pending } = useFormStatus();

  const [formState, formAction] = useActionState(handleFormAction, {
    applicationId,
    errorMessage: "",
    formId,
    formData: new FormData(),
    successMessage: "",
    validationErrors: [],
  });

  const { formData, errorMessage, successMessage, validationErrors } =
    formState;

  const formObject = !isEmpty(formData) ? formData : savedFormData;
  const fields = buildForTreeRecursive({
    errors: validationErrors,
    formData: formObject,
    schema: formSchema,
    uiSchema,
  });

  const navFields = useMemo(() => getFieldsForNav(uiSchema), [uiSchema]);

  return (
    <div className="usa-in-page-nav-container flex-justify">
      <ApplyFormNav fields={navFields} />
      <form
        className="usa-form usa-form--large flex-1 margin-top-neg-5"
        action={formAction}
      >
        <ApplyFormSuccessMessage message={successMessage} />
        <ApplyFormErrorMessage
          message={errorMessage}
          errors={validationErrors}
        />
        <FormGroup>{fields}</FormGroup>
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
