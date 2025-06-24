"use client";

import { RJSFSchema } from "@rjsf/utils";
import { isEmpty } from "lodash";
import { useFormStatus } from "react-dom";

import { JSX, useActionState, useMemo } from "react";
import { Alert, Button, FormGroup } from "@trussworks/react-uswds";

import { handleFormAction } from "./actions";
import { ApplyFormMessage } from "./ApplyFormMessage";
import ApplyFormNav from "./ApplyFormNav";
import { FormValidationWarning, UiSchema } from "./types";
import { buildFormTreeRecursive, getFieldsForNav } from "./utils";

const ApplyForm = ({
  applicationId,
  formId,
  formSchema,
  savedFormData,
  validationWarnings,
  uiSchema,
}: {
  applicationId: string;
  formId: string;
  formSchema: RJSFSchema;
  savedFormData: object;
  uiSchema: UiSchema;
  validationWarnings: FormValidationWarning[] | null;
}) => {
  const { pending } = useFormStatus();

  const [formState, formAction] = useActionState(handleFormAction, {
    applicationId,
    errorMessage: "",
    formId,
    formData: new FormData(),
    submitted: false,
  });

  const { formData, errorMessage, submitted } = formState;

  const formObject = !isEmpty(formData) ? formData : savedFormData;
  const navFields = useMemo(() => getFieldsForNav(uiSchema), [uiSchema]);
  let fields: JSX.Element[] = [];
  try {
    fields = buildFormTreeRecursive({
      errors: submitted ? validationWarnings : null,
      formData: formObject,
      schema: formSchema,
      uiSchema,
    });
  } catch (e) {
    return (
      <Alert type="error" heading="Error" headingLevel="h4">
        Error rendering form
      </Alert>
    );
  }

  return (
    <>
      <form
        className="flex-1 margin-top-2"
        action={formAction}
        // turns off html5 validation so all error displays are consistent
        noValidate
      >
        <div className="display-flex flex-justify">
          <div>
            A red asterisk (
            <abbr
              title="required"
              className="usa-hint usa-hint--required text-no-underline"
            >
              *
            </abbr>
            ) indicates a required field.
          </div>
          <Button
            data-testid="apply-form-save"
            type="submit"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            name="apply-form-button"
            className="margin-top-0"
            value="save"
          >
            {pending ? "Saving..." : "Save"}
          </Button>
        </div>
        <div className="usa-in-page-nav-container">
          <FormGroup className="order-2 width-full">
            <ApplyFormMessage
              submitted={submitted}
              errorMessage={errorMessage}
              validationWarnings={validationWarnings}
            />
            {fields}
          </FormGroup>
          <ApplyFormNav fields={navFields} />
        </div>
      </form>
    </>
  );
};

export default ApplyForm;
