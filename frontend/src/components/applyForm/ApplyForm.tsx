"use client";

import { RJSFSchema } from "@rjsf/utils";
import { isEmpty } from "lodash";
import { useFormStatus } from "react-dom";
import { AttachmentsProvider } from "src/hooks/ApplicationAttachments";
import { Attachment } from "src/types/attachmentTypes";

import { useTranslations } from "next-intl";
import { useActionState, useEffect, useMemo, useState } from "react";
import { Alert, Button, FormGroup } from "@trussworks/react-uswds";

import { handleFormAction } from "./actions";
import { ApplyFormMessage } from "./ApplyFormMessage";
import ApplyFormNav from "./ApplyFormNav";
import { FormFields } from "./FormFields";
import { FormValidationWarning, UiSchema } from "./types";
import { getFieldsForNav } from "./utils";

const ApplyForm = ({
  applicationId,
  formId,
  formSchema,
  savedFormData,
  validationWarnings,
  uiSchema,
  attachments,
}: {
  applicationId: string;
  formId: string;
  formSchema: RJSFSchema;
  savedFormData: object;
  uiSchema: UiSchema;
  validationWarnings: FormValidationWarning[] | null;
  attachments: Attachment[];
}) => {
  const { pending } = useFormStatus();
  const t = useTranslations("Application.applyForm");
  const required = t.rich("required", {
    abr: (content) => (
      <abbr
        title="required"
        className="usa-hint usa-hint--required text-no-underline"
      >
        {content}
      </abbr>
    ),
  });

  const [formState, formAction] = useActionState(handleFormAction, {
    applicationId,
    error: false,
    formId,
    formData: new FormData(),
    saved: false,
  });

  const { formData, error, saved } = formState;
  const [isDirty, setIsDirty] = useState<boolean>(false);

  useEffect(() => {
    const warningText =
      "You have unsaved changes - are you sure you wish to leave this page?";
    const handleBeforeUnload = (event: {
      preventDefault: () => void;
      returnValue: string;
    }) => {
      console.log("unload!!!!!!!!!!!!")

      if (!isDirty) return;
      // eslint-disable-next-line no-console
      console.log("wtf", isDirty);
      event.preventDefault();
      event.returnValue = warningText
      return warningText;
    };

    const handlePopState = () => {
      console.log("away!!!!!!!!!!!!")
      if (!isDirty) return;
      // eslint-disable-next-line no-alert
      if (window.confirm(warningText)) return;
      handleFormAction()
      throw new Error("routeChange aborted.");
    };
    console.log('zzz')

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popState", handlePopState);
    };
  }, [isDirty]);

  const handleChange = () => {
    // eslint-disable-next-line no-console
    console.log(isDirty);
    setIsDirty(true);
  };

  const formObject = !isEmpty(formData) ? formData : savedFormData;
  const navFields = useMemo(() => getFieldsForNav(uiSchema), [uiSchema]);

  if (!formSchema || !formSchema.properties || isEmpty(formSchema.properties)) {
    return (
      <Alert data-testid="alert" type="error" heading="Error" headingLevel="h4">
        Error rendering form
      </Alert>
    );
  }

  return (
    <form
      className="flex-1 margin-top-2 simpler-apply-form"
      action={formAction}
      onChange={handleChange}
      // turns off html5 validation so all error displays are consistent
      noValidate
    >
      <div className="display-flex flex-justify">
        <div>{required}</div>
        <Button
          data-testid="apply-form-save"
          type="submit"
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
            saved={saved}
            error={error}
            validationWarnings={validationWarnings}
          />
          <AttachmentsProvider value={attachments ?? []}>
            <FormFields
              errors={saved ? validationWarnings : null}
              formData={formObject}
              schema={formSchema}
              uiSchema={uiSchema}
            />
          </AttachmentsProvider>
        </FormGroup>
        <ApplyFormNav title={t("navTitle")} fields={navFields} />
      </div>
    </form>
  );
};

export default ApplyForm;
